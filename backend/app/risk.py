from app.schemas import ClientProfile, RiskAssessment, RiskBand


# Maximum score for each risk band.
BANDS = [
    (20, RiskBand.VERY_LOW),
    (40, RiskBand.LOW),
    (60, RiskBand.MODERATE),
    (80, RiskBand.HIGH),
    (100, RiskBand.VERY_HIGH),
]

# Ordered from most conservative to most aggressive.
BAND_ORDER = [
    RiskBand.VERY_LOW,
    RiskBand.LOW,
    RiskBand.MODERATE,
    RiskBand.HIGH,
    RiskBand.VERY_HIGH,
]


def score_to_band(score: int) -> RiskBand:
    """Convert a numerical score into a risk band."""

    score = max(0, min(100, score))

    for upper, band in BANDS:
        if score <= upper:
            return band

    return RiskBand.VERY_HIGH


def assess_risk(profile: ClientProfile) -> RiskAssessment:
    """
    Calculate risk capacity and risk tolerance.

    This is a transparent prototype scoring model, not an
    official SEBI-prescribed scoring methodology.

    Risk capacity estimates the client's financial ability
    to withstand losses.

    Risk tolerance represents the client's behavioural
    willingness to accept investment risk.

    When these conflict, the lower and more conservative
    risk band is selected.
    """

    # --------------------------------------------------
    # 1. INVESTMENT HORIZON
    # --------------------------------------------------

    horizon_points = min(
        30,
        profile.goal_horizon_years * 2,
    )

    # --------------------------------------------------
    # 2. INCOME STABILITY
    # --------------------------------------------------

    stability_points = profile.income_stability * 5

    # --------------------------------------------------
    # 3. MONTHLY FINANCIAL SURPLUS
    # --------------------------------------------------

    surplus = (
        profile.monthly_income_inr
        - profile.monthly_essential_expenses_inr
        - profile.monthly_debt_payments_inr
    )

    surplus_ratio = (
        0
        if profile.monthly_income_inr <= 0
        else max(
            0,
            surplus / profile.monthly_income_inr,
        )
    )

    surplus_points = min(
        20,
        int(surplus_ratio * 40),
    )

    # --------------------------------------------------
    # 4. EMERGENCY SAVINGS
    # --------------------------------------------------

    emergency_months = (
        profile.liquid_savings_inr
        / profile.monthly_essential_expenses_inr
        if profile.monthly_essential_expenses_inr > 0
        else 0
    )

    emergency_points = min(
        15,
        int(emergency_months * 3),
    )

    # --------------------------------------------------
    # 5. DEPENDANTS
    # --------------------------------------------------

    dependant_penalty = min(
        15,
        profile.dependants * 3,
    )

    # --------------------------------------------------
    # 6. AGE-RELATED REVIEW
    # --------------------------------------------------

    age_penalty = (
        10
        if profile.age >= 65
        else 5
        if profile.age >= 55
        else 0
    )

    # --------------------------------------------------
    # 7. DEBT BURDEN
    # --------------------------------------------------

    debt_ratio = (
        profile.monthly_debt_payments_inr
        / max(profile.monthly_income_inr, 1)
    )

    debt_penalty = min(
        20,
        int(debt_ratio * 40),
    )

    # --------------------------------------------------
    # 8. RISK CAPACITY SCORE
    # --------------------------------------------------

    capacity = max(
        0,
        min(
            100,
            horizon_points
            + stability_points
            + surplus_points
            + emergency_points
            - dependant_penalty
            - age_penalty
            - debt_penalty,
        ),
    )

    # Behavioural risk tolerance questionnaire score.
    tolerance = profile.risk_tolerance_score

    # --------------------------------------------------
    # 9. MAP SCORES TO RISK BANDS
    # --------------------------------------------------

    capacity_band = score_to_band(capacity)
    tolerance_band = score_to_band(tolerance)

    capacity_idx = BAND_ORDER.index(capacity_band)
    tolerance_idx = BAND_ORDER.index(tolerance_band)

    # Choose the more conservative of the two bands.
    selected_band = BAND_ORDER[
        min(capacity_idx, tolerance_idx)
    ]

    conflict = capacity_idx != tolerance_idx

    # --------------------------------------------------
    # 10. EXPLAINABLE RATIONALE
    # --------------------------------------------------

    rationale = [
        (
            f"Risk capacity score: {capacity}/100. "
            "Calculated from investment horizon, income stability, "
            "monthly surplus, liquid savings, dependants, age, "
            "and debt burden."
        ),
        (
            f"Risk tolerance score: {tolerance}/100. "
            "Based on the client's behavioural questionnaire."
        ),
        (
            f"Selected risk ceiling: {selected_band.value}. "
            "The more conservative of risk capacity and risk "
            "tolerance is used."
        ),
    ]

    if conflict:
        rationale.append(
            "Risk capacity and risk tolerance differ. "
            "An adviser should investigate the discrepancy "
            "before making an investment recommendation."
        )

    if profile.recent_high_risk_losses and tolerance >= 60:
        rationale.append(
            "Recent high-risk investment losses warrant a "
            "suitability conversation before considering "
            "high-risk exposure."
        )

    if profile.age >= 65:
        rationale.append(
            "Age 65 or above triggers additional review of "
            "liquidity needs, investment horizon, and "
            "loss-bearing capacity."
        )

    # --------------------------------------------------
    # 11. RETURN STRUCTURED ASSESSMENT
    # --------------------------------------------------

    return RiskAssessment(
        capacity_score=capacity,
        tolerance_score=tolerance,
        capacity_band=capacity_band,
        tolerance_band=tolerance_band,
        recommended_ceiling_band=selected_band,
        conflict_detected=conflict,
        resolution_rule=(
            "Use the lower (more conservative) of risk-capacity "
            "and risk-tolerance bands. Adviser review is required "
            "when conflicts or suitability concerns arise."
        ),
        rationale=rationale,
    )