import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Client, FinancialGoal
from app.goals import build_goal_plan
from app.schemas import GoalPlan, GoalPlanRequest


router = APIRouter(
    prefix="/clients/{client_id}/goals",
    tags=["Financial Goal Management"],
)


class FinancialGoalCreate(GoalPlanRequest):
    """Request to create and calculate a persistent financial goal."""

    pass


class FinancialGoalUpdate(BaseModel):
    """Fields that can be updated on an existing goal."""

    model_config = ConfigDict(extra="forbid")

    goal_name: str | None = Field(default=None, min_length=1, max_length=120)
    current_goal_cost_inr: float | None = Field(default=None, gt=0)
    years_to_goal: int | None = Field(default=None, ge=1, le=60)
    current_goal_savings_inr: float | None = Field(default=None, ge=0)
    monthly_contribution_inr: float | None = Field(default=None, ge=0)
    annual_inflation_assumption: float | None = Field(
        default=None, ge=0, le=0.20
    )
    annual_return_assumption: float | None = Field(
        default=None, ge=0, le=0.30
    )


class FinancialGoalResponse(BaseModel):
    """A persisted goal and its latest calculated plan."""

    id: str
    client_id: str
    goal_name: str
    current_goal_cost_inr: float
    years_to_goal: int
    current_goal_savings_inr: float
    monthly_contribution_inr: float | None
    annual_inflation_assumption: float
    annual_return_assumption: float
    plan: dict[str, Any] | None


def get_client_or_404(db: Session, client_id: str) -> Client:
    client = db.get(Client, client_id)

    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    return client


def serialize_goal(goal: FinancialGoal) -> dict:
    """Convert a database goal to a JSON-compatible response."""

    return {
        "id": goal.id,
        "client_id": goal.client_id,
        "goal_name": goal.goal_name,
        "current_goal_cost_inr": goal.current_goal_cost_inr,
        "years_to_goal": int(goal.years_to_goal),
        "current_goal_savings_inr": goal.current_goal_savings_inr,
        "monthly_contribution_inr": goal.monthly_contribution_inr,
        "annual_inflation_assumption": goal.annual_inflation_assumption,
        "annual_return_assumption": goal.annual_return_assumption,
        "plan": json.loads(goal.plan_json) if goal.plan_json else None,
    }


def recalculate_goal(goal: FinancialGoal) -> dict:
    """Recalculate a goal using the existing planning function."""

    request = GoalPlanRequest(
        goal_name=goal.goal_name,
        current_goal_cost_inr=goal.current_goal_cost_inr,
        years_to_goal=int(goal.years_to_goal),
        current_goal_savings_inr=goal.current_goal_savings_inr,
        monthly_contribution_inr=goal.monthly_contribution_inr,
        annual_inflation_assumption=goal.annual_inflation_assumption,
        annual_return_assumption=goal.annual_return_assumption,
    )

    plan = build_goal_plan(request)

    # Store a JSON-safe version of the plan.
    return plan.model_dump(mode="json")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_goal(
    client_id: str,
    request: FinancialGoalCreate,
    db: Session = Depends(get_db),
):
    """Create a financial goal for an existing client."""

    get_client_or_404(db, client_id)

    goal = FinancialGoal(
        client_id=client_id,
        goal_name=request.goal_name,
        current_goal_cost_inr=request.current_goal_cost_inr,
        years_to_goal=request.years_to_goal,
        current_goal_savings_inr=request.current_goal_savings_inr,
        monthly_contribution_inr=request.monthly_contribution_inr,
        annual_inflation_assumption=request.annual_inflation_assumption,
        annual_return_assumption=request.annual_return_assumption,
    )

    try:
        db.add(goal)
        db.flush()

        goal.plan_json = json.dumps(recalculate_goal(goal))

        db.commit()
        db.refresh(goal)

    except Exception:
        db.rollback()
        raise

    return serialize_goal(goal)


@router.get("")
def list_goals(
    client_id: str,
    db: Session = Depends(get_db),
):
    """List financial goals belonging to a client."""

    get_client_or_404(db, client_id)

    goals = (
        db.query(FinancialGoal)
        .filter(FinancialGoal.client_id == client_id)
        .order_by(FinancialGoal.created_at.desc())
        .all()
    )

    return {
        "client_id": client_id,
        "count": len(goals),
        "goals": [serialize_goal(goal) for goal in goals],
    }


@router.get("/{goal_id}")
def get_goal(
    client_id: str,
    goal_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve one goal belonging to a client."""

    goal = db.get(FinancialGoal, goal_id)

    if goal is None or goal.client_id != client_id:
        raise HTTPException(
            status_code=404,
            detail="Financial goal not found for this client.",
        )

    return serialize_goal(goal)


@router.patch("/{goal_id}")
def update_goal(
    client_id: str,
    goal_id: str,
    request: FinancialGoalUpdate,
    db: Session = Depends(get_db),
):
    """Update a goal and recalculate its plan."""

    goal = db.get(FinancialGoal, goal_id)

    if goal is None or goal.client_id != client_id:
        raise HTTPException(
            status_code=404,
            detail="Financial goal not found for this client.",
        )

    changes = request.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(goal, field, value)

    try:
        db.flush()
        goal.plan_json = json.dumps(recalculate_goal(goal))

        db.commit()
        db.refresh(goal)

    except Exception:
        db.rollback()
        raise

    return serialize_goal(goal)


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_goal(
    client_id: str,
    goal_id: str,
    db: Session = Depends(get_db),
):
    """Delete a financial goal belonging to a client."""

    goal = db.get(FinancialGoal, goal_id)

    if goal is None or goal.client_id != client_id:
        raise HTTPException(
            status_code=404,
            detail="Financial goal not found for this client.",
        )

    db.delete(goal)
    db.commit()