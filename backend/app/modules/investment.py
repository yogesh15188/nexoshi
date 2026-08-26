from sqlalchemy.orm import Session
from app.models.models import SecurityControl, InvestmentPlan, AttackPath
from app.modules.risk_engine import latest_snapshot


def optimize_investment(db: Session, budget: float) -> dict:
    controls = db.query(SecurityControl).all()
    total_paths = db.query(AttackPath).count() or 1
    scored = []
    for c in controls:
        lakhs = max(c.cost / 100000.0, 0.1)
        coverage = len(c.paths_affected or []) / total_paths
        value = (c.expected_reduction * 100 / lakhs) * (1 + 0.25 * coverage)
        if c.effort == "low":
            value *= 1.05
        elif c.effort == "high":
            value *= 0.95
        scored.append((c, round(value, 2)))
    scored.sort(key=lambda t: t[1], reverse=True)

    selected = []
    spent = 0.0
    covered = set()
    for c, v in scored:
        if spent + c.cost <= budget:
            overlap = len(set(c.paths_affected or []) & covered)
            if overlap >= 2:
                continue
            selected.append(c)
            spent += c.cost
            covered.update(c.paths_affected or [])

    base = latest_snapshot(db, phases=["validated", "current"])
    risk_before = base.score if base else 50.0
    eff_risk = risk_before
    for c in selected:
        eff_risk *= (1 - c.expected_reduction * 0.9)
    risk_after = round(max(10.0, eff_risk), 1)
    reduction_points = round(risk_before - risk_after, 1)

    plan = InvestmentPlan(
        budget=budget, total_cost=round(spent, 0),
        selected_ids=[c.id for c in selected],
        expected_reduction=reduction_points,
        risk_before=risk_before, risk_after=risk_after,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "plan_id": plan.id,
        "budget": budget,
        "total_cost": round(spent, 0),
        "remaining_budget": round(budget - spent, 0),
        "selected_controls": [
            {"id": c.id, "name": c.name, "category": c.category, "cost": c.cost,
             "expected_reduction": c.expected_reduction, "effort": c.effort,
             "paths_affected": c.paths_affected}
            for c in selected
        ],
        "risk_before": risk_before,
        "risk_after": risk_after,
        "risk_reduction": reduction_points,
        "risk_reduction_pct": round(reduction_points / risk_before * 100, 1) if risk_before else 0,
        "risk_reduction_per_rupee": round(reduction_points / (spent / 100000), 2) if spent else 0,
        "applied": False,
    }


def get_recommendations(db: Session):
    plan = db.query(InvestmentPlan).order_by(InvestmentPlan.id.desc()).first()
    if not plan:
        return {"message": "No optimization run yet", "plan": None}
    controls = db.query(SecurityControl).filter(SecurityControl.id.in_(plan.selected_ids or [])).all()
    by_id = {c.id: c for c in controls}
    return {
        "plan": {
            "plan_id": plan.id, "budget": plan.budget, "total_cost": plan.total_cost,
            "risk_before": plan.risk_before, "risk_after": plan.risk_after,
            "expected_reduction": plan.expected_reduction, "applied": plan.applied,
            "controls": [
                {"id": cid, "name": by_id[cid].name, "cost": by_id[cid].cost,
                 "expected_reduction": by_id[cid].expected_reduction,
                 "paths_affected": by_id[cid].paths_affected}
                for cid in (plan.selected_ids or []) if cid in by_id
            ],
        }
    }


def get_all_controls(db: Session):
    return db.query(SecurityControl).all()
