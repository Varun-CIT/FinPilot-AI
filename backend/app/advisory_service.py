import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Client, FinancialGoal
from app.schemas import (
    ClientProfile,
    RecommendationDraft,
    SuitabilityRequest,
)
from app.risk import assess_risk
from app.guardrails import check_suitability
from app.workflow import store
from app.rag.api import fund_retriever


router = APIRouter(
    prefix="/clients/{client_id}/advisory-workflow",
    tags=["End-to-End Advisory Workflow"],
)


class AdvisoryWorkflowRequest(BaseModel):
    # Client financial information
    age: int = Field(ge=18, le=110)
    monthly_income_inr: float = Field(ge=0)
    income_stability: int = Field(ge=1, le=5)
    monthly_essential_expenses_inr: float = Field(ge=0)
    monthly_debt_payments_inr: float = Field(ge=0)
    liquid_savings_inr: float = Field(ge=0)
    dependants: int = Field(ge=0, le=30)
    goal_horizon_years: int = Field(ge=1, le=60)
    risk_tolerance_score: int = Field(ge=0, le=100)
    investment_experience_years: int = Field(ge=0, le=80)
    recent_high_risk_losses: bool = False
    notes: str | None = None

    # Research and suitability inputs
    research_question: str = Field(
        min_length=3,
        max_length=500,
    )
    requested_product_category: str = Field(
        min_length=1,
        max_length=120,
    )
    requested_outcome: str = Field(
        default="",
        max_length=1000,
    )
    proposed_equity_allocation_pct: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    proposed_small_cap_allocation_pct: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    asks_for_guaranteed_returns: bool = False
    asks_for_extreme_fast_returns: bool = False
    top_k: int = Field(default=3, ge=1, le=10)


@router.post("")
def run_advisory_workflow(
    client_id: str,
    request: AdvisoryWorkflowRequest,
    db: Session = Depends(get_db),
):
    # 1. Retrieve the saved client.
    client = db.get(Client, client_id)

    if client is None:
        raise HTTPException(
            status_code=404,
            detail="Client not found.",
        )

    # 2. Build the client profile and assess risk.
    profile = ClientProfile(
        client_id=client_id,
        age=request.age,
        monthly_income_inr=request.monthly_income_inr,
        income_stability=request.income_stability,
        monthly_essential_expenses_inr=(
            request.monthly_essential_expenses_inr
        ),
        monthly_debt_payments_inr=request.monthly_debt_payments_inr,
        liquid_savings_inr=request.liquid_savings_inr,
        dependants=request.dependants,
        goal_horizon_years=request.goal_horizon_years,
        risk_tolerance_score=request.risk_tolerance_score,
        investment_experience_years=(
            request.investment_experience_years
        ),
        recent_high_risk_losses=request.recent_high_risk_losses,
        notes=request.notes,
    )

    risk_assessment = assess_risk(profile)

    # Save the assessed risk band to the client record.
    risk_band = getattr(
        risk_assessment.recommended_ceiling_band,
        "value",
        risk_assessment.recommended_ceiling_band,
    )

    client.risk_profile = str(risk_band)
    db.commit()

    # 3. Retrieve the client's saved financial goals.
    goals = (
        db.query(FinancialGoal)
        .filter(FinancialGoal.client_id == client_id)
        .order_by(FinancialGoal.created_at.desc())
        .all()
    )

    goal_summaries = []

    for goal in goals:
        plan = (
            json.loads(goal.plan_json)
            if goal.plan_json
            else {}
        )

        goal_summaries.append(
            {
                "goal_id": goal.id,
                "goal_name": goal.goal_name,
                "years_to_goal": int(goal.years_to_goal),
                "target_cost_today_inr": (
                    goal.current_goal_cost_inr
                ),
                "required_monthly_sip_inr": plan.get(
                    "required_monthly_sip_inr"
                ),
                "projected_shortfall_inr": plan.get(
                    "projected_shortfall_inr"
                ),
            }
        )

    # 4. Retrieve supporting evidence from fund documents.
    if fund_retriever.embeddings is None:
        research_results = []
        insufficient_evidence = True

        research_message = (
            "Fund documents are not indexed. "
            "Fund-specific claims cannot be supported."
        )
    else:
        retrieved = fund_retriever.search(
            query=request.research_question,
            top_k=request.top_k,
        )

        research_results = [
            {
                "source": item["source"],
                "page": item["page"],
                "text": item["text"],
                "similarity": item["similarity"],
            }
            for item in retrieved
        ]

        insufficient_evidence = not bool(research_results)

        research_message = (
            "Retrieved passages require adviser verification."
            if research_results
            else "No relevant passages were found."
        )

    # 5. Run suitability checks.
    suitability_request = SuitabilityRequest(
        client=profile,
        requested_product_category=(
            request.requested_product_category
        ),
        requested_outcome=request.requested_outcome,
        proposed_equity_allocation_pct=(
            request.proposed_equity_allocation_pct
        ),
        proposed_small_cap_allocation_pct=(
            request.proposed_small_cap_allocation_pct
        ),
        asks_for_guaranteed_returns=(
            request.asks_for_guaranteed_returns
        ),
        asks_for_extreme_fast_returns=(
            request.asks_for_extreme_fast_returns
        ),
    )

    guardrail = check_suitability(suitability_request)

    # 6. Prepare an adviser-facing draft.
    supporting_facts = [
        (
            "Risk capacity score: "
            f"{risk_assessment.capacity_score}/100."
        ),
        (
            "Risk tolerance score: "
            f"{risk_assessment.tolerance_score}/100."
        ),
        f"Risk ceiling: {risk_band}.",
        f"Saved financial goals found: {len(goal_summaries)}.",
    ]

    for goal in goal_summaries:
        supporting_facts.append(
            f"Goal: {goal['goal_name']}; "
            f"horizon: {goal['years_to_goal']} years; "
            f"required monthly SIP estimate: "
            f"{goal['required_monthly_sip_inr']} INR."
        )

    if insufficient_evidence:
        supporting_facts.append(
            "Insufficient fund-document evidence was retrieved. "
            "Fund details and performance must not be inferred."
        )

    summary = (
        "Adviser review draft generated using the submitted client "
        "financial profile, risk assessment, saved financial goals, "
        "suitability checks, and available fund research. "
        "This is not a final investment recommendation. "
        "The adviser must verify the client information, source "
        "passages, product disclosures, and suitability before "
        "making any recommendation."
    )

    draft = RecommendationDraft(
        client_id=client_id,
        summary=summary,
        supporting_facts=supporting_facts,
        source_citations=[
            {
                "source": item["source"],
                "page": item["page"],
                "similarity": item["similarity"],
                "excerpt": item["text"],
            }
            for item in research_results
        ],
        guardrail=guardrail,
        status="draft",
    )

    draft_result = store.create_draft(draft)

    # 7. Return the complete workflow result.
    return {
        "client": {
            "id": client.id,
            "full_name": client.full_name,
            "risk_profile": client.risk_profile,
        },
        "risk_assessment": risk_assessment.model_dump(
            mode="json"
        ),
        "financial_goals": goal_summaries,
        "fund_research": {
            "question": request.research_question,
            "results": research_results,
            "insufficient_evidence": insufficient_evidence,
            "message": research_message,
        },
        "suitability": guardrail.model_dump(
            mode="json"
        ),
        "recommendation_draft": {
            **draft_result,
            "summary": draft.summary,
            "supporting_facts": draft.supporting_facts,
            "source_citations": draft.source_citations,
            "guardrail": guardrail.model_dump(
                mode="json"
            ),
        },
        "next_action": (
            "Verify the retrieved evidence and resolve suitability "
            "concerns before submitting the draft for adviser review."
        ),
        "client_delivery_permitted": False,
    }