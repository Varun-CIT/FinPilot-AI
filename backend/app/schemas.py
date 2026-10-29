from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)


# ==================================================
# RISK ENUMS
# ==================================================

class RiskBand(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


# ==================================================
# CLIENT PROFILE
# ==================================================

class ClientProfile(BaseModel):
    """
    Financial and behavioural information used
    by the risk assessment prototype.
    """

    model_config = ConfigDict(
        use_enum_values=True,
        extra="forbid",
        str_strip_whitespace=True,
    )

    client_id: str = Field(
        min_length=1,
        max_length=100,
    )

    age: int = Field(
        ge=18,
        le=110,
    )

    monthly_income_inr: float = Field(
        ge=0,
        description="Monthly income in Indian rupees.",
    )

    income_stability: int = Field(
        ge=1,
        le=5,
        description="1 = very unstable; 5 = very stable.",
    )

    monthly_essential_expenses_inr: float = Field(
        ge=0,
    )

    monthly_debt_payments_inr: float = Field(
        ge=0,
    )

    liquid_savings_inr: float = Field(
        ge=0,
    )

    dependants: int = Field(
        ge=0,
        le=30,
    )

    goal_horizon_years: int = Field(
        ge=1,
        le=60,
    )

    risk_tolerance_score: int = Field(
        ge=0,
        le=100,
        description="Behavioural questionnaire score.",
    )

    investment_experience_years: int = Field(
        ge=0,
        le=80,
    )

    recent_high_risk_losses: bool = False

    notes: str | None = Field(
        default=None,
        max_length=2000,
    )


# ==================================================
# RISK ASSESSMENT RESULT
# ==================================================

class RiskAssessment(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
        extra="forbid",
    )

    capacity_score: int = Field(
        ge=0,
        le=100,
    )

    tolerance_score: int = Field(
        ge=0,
        le=100,
    )

    capacity_band: RiskBand

    tolerance_band: RiskBand

    recommended_ceiling_band: RiskBand

    conflict_detected: bool

    resolution_rule: str

    rationale: list[str] = Field(
        min_length=1,
    )


# ==================================================
# GOAL PLANNING
# ==================================================

class GoalPlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    goal_name: str = Field(
        min_length=1,
        max_length=120,
    )

    current_goal_cost_inr: float = Field(
        gt=0,
        description="Goal cost in today's rupees.",
    )

    years_to_goal: int = Field(
        ge=1,
        le=60,
    )

    current_goal_savings_inr: float = Field(
        ge=0,
    )

    monthly_contribution_inr: float | None = Field(
        default=None,
        ge=0,
    )

    annual_inflation_assumption: float = Field(
        default=0.06,
        ge=0,
        le=0.20,
    )

    annual_return_assumption: float = Field(
        default=0.08,
        ge=0,
        le=0.30,
    )


class GoalPlan(BaseModel):
    goal_name: str

    years_to_goal: int

    inflation_assumption: float

    return_assumption: float

    inflation_adjusted_target_inr: float

    current_savings_future_value_inr: float

    required_monthly_sip_inr: float

    proposed_monthly_contribution_inr: float | None

    projected_corpus_inr: float | None

    projected_shortfall_inr: float | None

    assumptions_and_disclosures: list[str] = Field(
        default_factory=list,
    )


# ==================================================
# SUITABILITY CHECK
# ==================================================

class SuitabilityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client: ClientProfile

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

    @model_validator(mode="after")
    def validate_allocation(self) -> SuitabilityRequest:
        if (
            self.proposed_equity_allocation_pct is not None
            and self.proposed_small_cap_allocation_pct is not None
            and self.proposed_small_cap_allocation_pct
            > self.proposed_equity_allocation_pct
        ):
            raise ValueError(
                "Small-cap allocation cannot exceed total "
                "proposed equity allocation."
            )

        return self


class GuardrailResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal[
        "allow_for_adviser_review",
        "needs_more_information",
        "blocked_pending_reassessment",
    ]

    flags: list[str] = Field(
        default_factory=list,
    )

    explanation: list[str] = Field(
        default_factory=list,
    )

    adviser_approval_required: bool = True

    client_delivery_permitted: bool = False


# ==================================================
# RECOMMENDATION DRAFT
# ==================================================

class RecommendationDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_id: str = Field(
        min_length=1,
        max_length=100,
    )

    summary: str = Field(
        min_length=1,
        max_length=3000,
    )

    supporting_facts: list[str] = Field(
        default_factory=list,
    )

    source_citations: list[dict] = Field(
        default_factory=list,
    )

    guardrail: GuardrailResult

    status: Literal[
        "draft",
        "submitted_for_review",
        "approved",
        "rejected",
    ] = "draft"


# ==================================================
# ADVISER APPROVAL
# ==================================================

class ApprovalAction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    adviser_id: str = Field(
        min_length=1,
        max_length=100,
    )

    decision: Literal[
        "approve",
        "reject",
    ]

    reason: str = Field(
        min_length=3,
        max_length=1000,
    )