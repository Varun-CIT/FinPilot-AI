from fastapi.testclient import TestClient
from app.main import app
from app.goals import build_goal_plan
from app.schemas import GoalPlanRequest

client = TestClient(app)


def sample_client():
    return {
        "client_id": "demo-001",
        "age": 31,
        "monthly_income_inr": 120000,
        "income_stability": 4,
        "monthly_essential_expenses_inr": 45000,
        "monthly_debt_payments_inr": 20000,
        "liquid_savings_inr": 300000,
        "dependants": 1,
        "goal_horizon_years": 15,
        "risk_tolerance_score": 55,
        "investment_experience_years": 3,
        "recent_high_risk_losses": False
    }


def test_health():
    assert client.get("/health").status_code == 200


def test_risk_assessment_has_conservative_rule():
    response = client.post("/risk/assess", json=sample_client())
    assert response.status_code == 200
    body = response.json()
    assert body["capacity_score"] >= 0
    assert body["capacity_score"] <= 100
    assert body["resolution_rule"]


def test_goal_plan_outputs_inflation_adjusted_target():
    request = GoalPlanRequest(
        goal_name="Education",
        current_goal_cost_inr=1000000,
        years_to_goal=10,
        current_goal_savings_inr=100000,
        monthly_contribution_inr=5000,
        annual_inflation_assumption=0.06,
        annual_return_assumption=0.08,
    )
    plan = build_goal_plan(request)
    assert plan.inflation_adjusted_target_inr > 1_000_000
    assert plan.required_monthly_sip_inr > 0
    assert plan.projected_corpus_inr is not None


def test_guaranteed_return_guardrail():
    payload = {
        "client": sample_client(),
        "requested_product_category": "equity",
        "requested_outcome": "Guarantee me 20% returns",
        "asks_for_guaranteed_returns": True
    }
    response = client.post("/suitability/check", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "GUARANTEED_RETURN_REQUEST" in body["flags"]
    assert body["client_delivery_permitted"] is False


def test_senior_small_cap_concentration_guardrail():
    person = sample_client()
    person["age"] = 68
    payload = {
        "client": person,
        "requested_product_category": "small_cap",
        "requested_outcome": "Invest all corpus in small caps",
        "proposed_small_cap_allocation_pct": 100
    }
    response = client.post("/suitability/check", json=payload)
    assert response.status_code == 200
    assert "AGE_AND_CONCENTRATION_REVIEW" in response.json()["flags"]


def test_approval_workflow_never_enables_direct_delivery():
    draft = {
        "client_id": "demo-001",
        "summary": "Illustrative planning draft",
        "supporting_facts": ["Savings rate estimated from declared figures"],
        "source_citations": [],
        "guardrail": {
            "status": "allow_for_adviser_review",
            "flags": [],
            "explanation": ["Prototype result"],
            "adviser_approval_required": True,
            "client_delivery_permitted": False
        }
    }
    created = client.post("/adviser/drafts", json=draft).json()
    draft_id = created["draft_id"]
    assert client.post(f"/adviser/drafts/{draft_id}/submit").status_code == 200
    decision = client.post(
        f"/adviser/drafts/{draft_id}/decision",
        json={"adviser_id": "ria-001", "decision": "approve", "reason": "Reviewed assumptions"}
    )
    assert decision.status_code == 200
    assert decision.json()["status"] == "approved"
    assert decision.json()["client_delivery_permitted"] is False
