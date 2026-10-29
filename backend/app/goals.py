import math
from .schemas import GoalPlanRequest, GoalPlan


def future_value_lump_sum(principal: float, monthly_rate: float, months: int) -> float:
    return principal * ((1 + monthly_rate) ** months)


def future_value_annuity(monthly_payment: float, monthly_rate: float, months: int) -> float:
    if months <= 0:
        return 0.0
    if abs(monthly_rate) < 1e-12:
        return monthly_payment * months
    return monthly_payment * (((1 + monthly_rate) ** months - 1) / monthly_rate)


def required_sip(target: float, current_savings: float, annual_return: float, months: int) -> float:
    monthly_rate = (1 + annual_return) ** (1 / 12) - 1
    current_future_value = future_value_lump_sum(current_savings, monthly_rate, months)
    remaining = max(0.0, target - current_future_value)
    if remaining == 0:
        return 0.0
    if abs(monthly_rate) < 1e-12:
        return remaining / months
    factor = (((1 + monthly_rate) ** months - 1) / monthly_rate)
    return remaining / factor


def build_goal_plan(req: GoalPlanRequest) -> GoalPlan:
    months = req.years_to_goal * 12
    target = req.current_goal_cost_inr * ((1 + req.annual_inflation_assumption) ** req.years_to_goal)
    monthly_return = (1 + req.annual_return_assumption) ** (1 / 12) - 1
    current_fv = future_value_lump_sum(req.current_goal_savings_inr, monthly_return, months)
    sip = required_sip(target, req.current_goal_savings_inr, req.annual_return_assumption, months)
    projected = None
    shortfall = None
    if req.monthly_contribution_inr is not None:
        projected = current_fv + future_value_annuity(req.monthly_contribution_inr, monthly_return, months)
        shortfall = max(0.0, target - projected)
    return GoalPlan(
        goal_name=req.goal_name,
        years_to_goal=req.years_to_goal,
        inflation_assumption=req.annual_inflation_assumption,
        return_assumption=req.annual_return_assumption,
        inflation_adjusted_target_inr=round(target, 2),
        current_savings_future_value_inr=round(current_fv, 2),
        required_monthly_sip_inr=round(sip, 2),
        proposed_monthly_contribution_inr=req.monthly_contribution_inr,
        projected_corpus_inr=round(projected, 2) if projected is not None else None,
        projected_shortfall_inr=round(shortfall, 2) if shortfall is not None else None,
        assumptions_and_disclosures=[
            "Inflation and return rates are user-supplied assumptions, not forecasts or guarantees.",
            "Returns are modelled as a constant effective annual rate converted to a monthly rate; actual investment returns vary.",
            "Tax, expense ratios, exit loads and contribution timing are not included in this prototype calculation.",
            "This is a planning estimate for adviser review, not a recommendation to buy a specific fund."
        ]
    )


def glide_path(start_equity_pct: float, years_to_goal: int, floor_equity_pct: float = 10) -> list[dict]:
    """Illustrative de-risking path: reduce equity by 5 percentage points/year in final 5 years."""
    start = max(0.0, min(100.0, start_equity_pct))
    result = []
    for years_left in range(years_to_goal, -1, -1):
        years_in_final_window = max(0, 5 - years_left)
        equity = max(floor_equity_pct, start - 5 * years_in_final_window)
        result.append({
            "years_to_goal": years_left,
            "equity_pct": round(equity, 1),
            "debt_and_cash_pct": round(100 - equity, 1),
        })
    return result
