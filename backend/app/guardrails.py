from .schemas import SuitabilityRequest, GuardrailResult
from .risk import assess_risk, BAND_ORDER
from .schemas import RiskBand


def check_suitability(req: SuitabilityRequest) -> GuardrailResult:
    flags: list[str] = []
    explanation: list[str] = []
    profile = req.client
    assessment = assess_risk(profile)

    if req.asks_for_guaranteed_returns or "guarantee" in req.requested_outcome.lower():
        flags.append("GUARANTEED_RETURN_REQUEST")
        explanation.append("Investment returns cannot be guaranteed. Replace the claim with scenario analysis and explicit risk disclosures.")

    if req.asks_for_extreme_fast_returns or any(
        phrase in req.requested_outcome.lower()
        for phrase in ["20% guaranteed", "high returns fast", "double my money quickly", "risk-free high return"]
    ):
        flags.append("UNREALISTIC_RETURN_EXPECTATION")
        explanation.append("The requested outcome may imply unrealistic or misleading return expectations; adviser discussion is required.")

    if profile.age >= 65 and (req.proposed_small_cap_allocation_pct or 0) >= 80:
        flags.append("AGE_AND_CONCENTRATION_REVIEW")
        explanation.append("Small-cap-only or highly concentrated exposure may be inconsistent with liquidity needs and loss-bearing capacity; require a full suitability review.")

    if req.proposed_equity_allocation_pct is not None:
        if assessment.recommended_ceiling_band in (RiskBand.VERY_LOW, RiskBand.LOW) and req.proposed_equity_allocation_pct > 40:
            flags.append("ALLOCATION_EXCEEDS_PROFILE")
            explanation.append("Proposed equity allocation appears high relative to the conservative prototype risk-profile ceiling; adviser must reassess goals and capacity.")
        if assessment.recommended_ceiling_band == RiskBand.VERY_LOW and req.proposed_equity_allocation_pct > 20:
            flags.append("LOW_CAPACITY_HIGH_EQUITY")
            explanation.append("A very-low risk profile requires additional review before material equity exposure.")

    if profile.recent_high_risk_losses and req.requested_product_category.lower() in {"small_cap", "sectoral", "thematic", "derivatives", "f&o"}:
        flags.append("RECENT_LOSSES_HIGH_RISK_REQUEST")
        explanation.append("Recent high-risk losses plus a request for a high-risk product triggers a pause, review of objectives, and risk understanding.")

    if profile.monthly_income_inr <= profile.monthly_essential_expenses_inr + profile.monthly_debt_payments_inr:
        flags.append("NO_MONTHLY_SURPLUS")
        explanation.append("Declared income does not exceed essential expenses plus debt payments; confirm emergency liquidity before committing to a recurring investment.")

    if assessment.conflict_detected:
        flags.append("CAPACITY_TOLERANCE_CONFLICT")
        explanation.append("Risk capacity and behavioural tolerance differ; use the conservative ceiling and require adviser review.")

    if not flags:
        explanation.append("No hard-coded trigger fired. This does not establish suitability; adviser must review the complete client profile and product disclosures.")

    if any(f in flags for f in ["GUARANTEED_RETURN_REQUEST", "UNREALISTIC_RETURN_EXPECTATION", "AGE_AND_CONCENTRATION_REVIEW", "RECENT_LOSSES_HIGH_RISK_REQUEST"]):
        status = "blocked_pending_reassessment"
    elif any(f in flags for f in ["ALLOCATION_EXCEEDS_PROFILE", "LOW_CAPACITY_HIGH_EQUITY", "NO_MONTHLY_SURPLUS", "CAPACITY_TOLERANCE_CONFLICT"]):
        status = "needs_more_information"
    else:
        status = "allow_for_adviser_review"

    return GuardrailResult(
        status=status,
        flags=flags,
        explanation=explanation,
        adviser_approval_required=True,
        client_delivery_permitted=False,
    )
