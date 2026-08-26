from sqlalchemy.orm import Session
from app.models.models import InteractionEvent, AttackPath, DeceptionAsset


def correlate_evidence(db: Session) -> dict:
    events = db.query(InteractionEvent).order_by(InteractionEvent.id.desc()).limit(100).all()
    paths = db.query(AttackPath).all()
    decoys = {d.id: d for d in db.query(DeceptionAsset).all()}
    affected = []
    total_interest = 0.0
    for p in paths:
        techniques = set(p.techniques or [])
        matched = [e for e in events if e.technique in techniques]
        if not matched:
            continue
        evidence_strength = sum(min(1.0, e.severity * e.confidence) for e in matched)
        uplift = round(min(20.0, evidence_strength * 4.5), 1)
        affected.append({
            "path_id": p.id,
            "path_name": p.name,
            "risk_before": p.risk_score,
            "evidence_impact": uplift,
            "matched_events": len(matched),
            "decoy_names": [decoys[e.deception_asset_id].name for e in matched if e.deception_asset_id in decoys],
        })
        total_interest += evidence_strength
    high_conf = sum(1 for e in events if e.confidence >= 0.8)
    evidence_confidence = min(1.0, round((len(events) * 0.06 + high_conf * 0.08), 2))
    attacker_interest = min(100.0, round(total_interest * 12, 1))
    severity_avg = sum(e.severity for e in events) / len(events) if events else 0.0
    return {
        "evidence_confidence": evidence_confidence,
        "behaviour_severity": round(severity_avg, 2),
        "attacker_interest_score": attacker_interest,
        "total_events": len(events),
        "affected_paths": sorted(affected, key=lambda a: a["risk_before"], reverse=True),
    }
