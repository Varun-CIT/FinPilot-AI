from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException

from app.schemas import (
    ClientProfile,
    GoalPlanRequest,
    SuitabilityRequest,
    RecommendationDraft,
    ApprovalAction,
)

from app.risk import assess_risk
from app.goals import build_goal_plan, glide_path
from app.guardrails import check_suitability
from app.workflow import store

# Database imports
from app.database import Base, engine
from app import models

# Client and financial goal management
from app.client_service import router as clients_router
from app.goal_service import router as goal_management_router

# RAG imports
from app.rag.api import (
    router as research_router,
    fund_retriever,
)
from app.rag.document_loader import load_pdf
from app.advisory_service import router as advisory_workflow_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load and index the mutual fund factsheet at startup."""

    project_root = Path(__file__).resolve().parent.parent

    pdf_path = (
        project_root
        / "data"
        / "fund_documents"
        / "HDFC_MF_Factsheet.pdf"
    )

    if not pdf_path.exists():
        print(
            "FinPilot AI: factsheet not found at "
            f"{pdf_path.resolve()}"
        )
    else:
        try:
            pages = load_pdf(str(pdf_path))
            chunk_count = fund_retriever.index_pages(pages)

            print(
                "FinPilot AI: indexed "
                f"{chunk_count} fund-document chunks."
            )

        except Exception as exc:
            print(
                "FinPilot AI: document indexing failed: "
                f"{exc}"
            )

    yield


app = FastAPI(
    title="FinPilot AI Core",
    version="0.4.0",
    description=(
        "Adviser-controlled investment planning with "
        "evidence-grounded mutual fund research, "
        "persistent client management, and financial goal tracking."
    ),
    lifespan=lifespan,
)


# --------------------------------------------------
# DATABASE INITIALIZATION
# --------------------------------------------------

# Register SQLAlchemy models and create missing tables.
Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# REGISTER ROUTERS
# --------------------------------------------------

app.include_router(research_router)
app.include_router(clients_router)
app.include_router(goal_management_router)
app.include_router(advisory_workflow_router)

# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health", tags=["System"])
def health():
    """Check whether the backend is running."""

    return {
        "status": "ok",
        "service": "finpilot-core",
        "version": "0.4.0",
    }


# --------------------------------------------------
# RISK ASSESSMENT
# --------------------------------------------------

@app.post("/risk/assess", tags=["Risk Assessment"])
def risk_assess(profile: ClientProfile):
    """Assess a client's investment risk profile."""

    return assess_risk(profile)


# --------------------------------------------------
# FINANCIAL GOAL PLANNING
# --------------------------------------------------

@app.post("/goals/plan", tags=["Financial Goals"])
def goals_plan(request: GoalPlanRequest):
    """Calculate a financial goal plan without saving it."""

    return build_goal_plan(request)


@app.get("/goals/glide-path", tags=["Financial Goals"])
def goals_glide_path(
    start_equity_pct: float = 60,
    years_to_goal: int = 10,
):
    """Generate an illustrative equity allocation glide path."""

    if not 0 <= start_equity_pct <= 100:
        raise HTTPException(
            status_code=400,
            detail="start_equity_pct must be between 0 and 100",
        )

    if not 1 <= years_to_goal <= 60:
        raise HTTPException(
            status_code=400,
            detail="years_to_goal must be between 1 and 60",
        )

    return {
        "glide_path": glide_path(
            start_equity_pct,
            years_to_goal,
        )
    }


# --------------------------------------------------
# INVESTMENT SUITABILITY
# --------------------------------------------------

@app.post("/suitability/check", tags=["Suitability"])
def suitability_check(request: SuitabilityRequest):
    """Check a proposed investment against suitability rules."""

    return check_suitability(request)


# --------------------------------------------------
# ADVISER RECOMMENDATION WORKFLOW
# --------------------------------------------------

@app.post("/adviser/drafts", tags=["Adviser Workflow"])
def create_draft(draft: RecommendationDraft):
    """Create a recommendation draft."""

    return store.create_draft(draft)


@app.post(
    "/adviser/drafts/{draft_id}/submit",
    tags=["Adviser Workflow"],
)
def submit_draft(draft_id: str):
    """Submit a recommendation draft for adviser review."""

    try:
        return store.submit_for_review(draft_id)

    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@app.post(
    "/adviser/drafts/{draft_id}/decision",
    tags=["Adviser Workflow"],
)
def decide_draft(
    draft_id: str,
    action: ApprovalAction,
):
    """Record an adviser approval or rejection decision."""

    try:
        return store.decide(draft_id, action)

    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@app.get("/adviser/audit-log", tags=["Adviser Workflow"])
def audit_log():
    """Retrieve adviser workflow audit events."""

    return {
        "events": store.audit_log,
    }