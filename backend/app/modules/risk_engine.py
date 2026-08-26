from sqlalchemy.orm import Session
from app.models.models import Asset, Vulnerability, AttackPath, RiskSnapshot
from app.data.catalog import CRITICALITY_SCORES


def _asset_risks(db: Session) -> dict:
    risks = {}
    sev_by_asset = {}
    for v in db.query(Vulnerability).all():
        sev_by_asset[v.asset_id] = max(sev_by_asset.get(v.asset_id, 0), v.severity)
    for a in db.query(Asset).all():
        crit = CRITICALITY_SCORES.get(a.criticality, 0.5)
        max_sev = sev_by_asset.get(a.id, 2.0)
        risk = 100 * (0.45 * crit + 0.25 * a.exposure_score + 0.30 * (max_sev / 10))
        risks[a.id] = {"name": a.name, "criticality": a.criticality, "risk": round(risk, 1),
                       "weight": crit + 0.2}
    return risks


def _path_risk_average(db: Session) -> float:
    paths = db.query(AttackPath).all()
    if not paths:
        return 0.0
    top = sorted(paths, key=lambda p: p.risk_score, reverse=True)[:3]
    return sum(p.risk_score for p in top) / len(top)


def confidence_tier(conf: float) -> str:
    if conf >= 0.7:
        return "high"
    if conf >= 0.45:
        return "medium"
    return "low"


def calculate_overall_risk(db: Session, phase: str = "current") -> dict:
    asset_risks = _asset_risks(db)
    path_avg = _path_risk_average(db)
    if asset_risks:
        weighted = sum(a["risk"] * a["weight"] for a in asset_risks.values()) / \
            sum(a["weight"] for a in asset_risks.values())
    else:
        weighted = 0.0
    overall = round(min(100.0, 0.55 * weighted + 0.45 * path_avg), 1)
    paths = db.query(AttackPath).all()
    conf = sum(p.confidence for p in paths) / len(paths) if paths else 0.5
    expected_loss = round(sum(p.financial_impact for p in paths), 0)
    drivers = sorted(asset_risks.values(), key=lambda a: a["risk"], reverse=True)[:5]
    snapshot = RiskSnapshot(
        phase=phase, score=overall, technical_risk=overall,
        financial_loss=expected_loss, confidence=round(conf, 2),
        top_drivers=[f"{d['name']} (Risk: {d['risk']})" for d in drivers],
    )
    db.add(snapshot)
    db.commit()
    return {
        "overall_score": overall,
        "technical_risk": overall,
        "financial_loss": expected_loss,
        "confidence": round(conf, 2),
        "confidence_level": confidence_tier(conf),
        "asset_risks": [{"asset_id": k, **{kk: vv for kk, vv in v.items() if kk != "weight"}}
                        for k, v in sorted(asset_risks.items(), key=lambda kv: -kv[1]["risk"])],
        "top_drivers": [f"{d['name']} (Risk: {d['risk']})" for d in drivers],
    }


def latest_snapshot(db: Session, phases=None):
    q = db.query(RiskSnapshot)
    if phases:
        q = q.filter(RiskSnapshot.phase.in_(phases))
    return q.order_by(RiskSnapshot.id.desc()).first()


def recalculate_with_evidence(db: Session, boost: float = 0.2) -> dict:
    paths = db.query(AttackPath).all()
    base = latest_snapshot(db, phases=["current", "validated"])
    any_snap = base or latest_snapshot(db, phases=["baseline"])
    if base:
        base_score = base.score
    else:
        probe = calculate_overall_risk(db, phase="current")
        base_score = probe["overall_score"]
        any_snap = latest_snapshot(db, phases=["current", "baseline"])
    events_factor = 1.0
    from app.models.models import InteractionEvent
    n_events = db.query(InteractionEvent).count()
    delta = min(15.0, n_events * 2.0 + boost * 8.0)
    new_score = round(min(98.0, base_score + delta * events_factor), 1)
    for p in paths:
        p.confidence = round(min(0.95, p.confidence + boost), 2)
        p.risk_score = round(min(100.0, p.risk_score * (1 + boost * 0.25)), 1)
    avg_conf = sum(p.confidence for p in paths) / len(paths) if paths else 0.5
    snapshot = RiskSnapshot(
        phase="validated", score=new_score, technical_risk=new_score,
        financial_loss=any_snap.financial_loss if any_snap else 0,
        confidence=round(avg_conf, 2),
        top_drivers=any_snap.top_drivers if any_snap else [],
    )
    db.add(snapshot)
    db.commit()
    prev_conf = base.confidence if base else 0.5
    return {
        "previous_score": base_score,
        "overall_score": new_score,
        "change": round(new_score - base_score, 1),
        "previous_confidence": confidence_tier(prev_conf),
        "confidence": round(avg_conf, 2),
        "confidence_level": confidence_tier(avg_conf),
        "evidence_events": n_events,
    }
