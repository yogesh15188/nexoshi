from sqlalchemy.orm import Session
from datetime import datetime
from app.models.models import InvestmentPlan, AttackPath, Asset, RiskSnapshot
from app.modules.risk_engine import calculate_overall_risk


def run_verification(db: Session) -> dict:
    plan = db.query(InvestmentPlan).order_by(InvestmentPlan.id.desc()).first()
    if not plan:
        return {"verification_status": "blocked", "reason": "Run investment optimization first"}
    pre_snapshot = None
    for phase in ("validated", "current"):
        pre_snapshot = db.query(RiskSnapshot).filter(RiskSnapshot.phase == phase) \
            .order_by(RiskSnapshot.id.desc()).first()
        if pre_snapshot:
            break
    risk_initial = pre_snapshot.score if pre_snapshot else plan.risk_before

    paths = db.query(AttackPath).all()
    controls = plan.selected_ids or []
    n_controls = max(len(controls), 1)
    loss_before = round(sum(p.financial_impact for p in paths), 0)
    mitigation = min(0.6, 0.15 + 0.04 * n_controls)
    for p in paths:
        new_likelihood = round(p.likelihood * (1 - mitigation), 3)
        p.financial_impact = round(p.financial_impact * (1 - mitigation), 0)
        p.risk_score = round(max(8.0, p.risk_score * (1 - mitigation)), 1)
        p.confidence = round(max(0.5, p.confidence - 0.05), 2)
        p.likelihood = new_likelihood

    post = calculate_overall_risk(db, phase="post_investment")
    risk_after = post["overall_score"]
    loss_after = post["financial_loss"]
    reduction = round(risk_initial - risk_after, 1)
    per_rupee = round(reduction / (plan.total_cost / 100000), 2) if plan.total_cost else 0

    assets = sorted(db.query(Asset).all(), key=lambda a: a.risk_contribution, reverse=True)[:3]
    feedback = {
        "next_cycle_recommendation": f"Re-run deception validation on {assets[0].name if assets else 'crown jewels'} and re-optimize within 30 days",
        "areas_to_watch": [f"{a.name} residual exposure" for a in assets],
        "observed_outcome": "Simulated deployment reduced path likelihoods; evidence layer reset for next cycle",
    }

    plan.applied = True
    db.commit()

    return {
        "verification_status": "completed",
        "timestamp": datetime.utcnow().isoformat(),
        "risk_before_initial": risk_initial,
        "risk_after_evidence": plan.risk_before,
        "risk_after_investment": risk_after,
        "total_risk_reduction": reduction,
        "reduction_percentage": round(reduction / risk_initial * 100, 1) if risk_initial else 0,
        "investment_cost": plan.total_cost,
        "expected_loss_before": loss_before,
        "expected_loss_after": loss_after,
        "loss_reduction": round(loss_before - loss_after, 0),
        "risk_reduction_per_rupee": per_rupee,
        "controls_applied": controls,
        "feedback": feedback,
    }


def get_risk_history(db: Session, limit: int = 30):
    snaps = db.query(RiskSnapshot).order_by(RiskSnapshot.id.asc()).limit(limit).all()
    return [
        {"id": s.id, "timestamp": s.timestamp.isoformat() if s.timestamp else None,
         "phase": s.phase, "score": s.score, "financial_loss": s.financial_loss,
         "confidence": s.confidence}
        for s in snaps
    ]
