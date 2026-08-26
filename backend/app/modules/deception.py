import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import DeceptionAsset, InteractionEvent


def deploy_deception(db: Session, name: str, deception_type: str, location: str = "") -> DeceptionAsset:
    decoy = db.query(DeceptionAsset).filter(DeceptionAsset.name == name).first()
    if decoy:
        decoy.status = "active"
        decoy.deployed_at = datetime.utcnow()
        db.commit()
        db.refresh(decoy)
        return decoy
    d = DeceptionAsset(
        name=name, deception_type=deception_type, location=location,
        status="active", decoy_ip=f"10.0.9.{random.randint(50, 250)}",
        deployed_at=datetime.utcnow(),
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


def deploy_all_ready(db: Session) -> list:
    ready = db.query(DeceptionAsset).filter(DeceptionAsset.status == "ready").all()
    deployed = []
    for d in ready:
        d.status = "active"
        d.decoy_ip = d.decoy_ip or f"10.0.9.{random.randint(50, 250)}"
        d.deployed_at = datetime.utcnow()
        deployed.append(d)
    db.commit()
    return deployed


def get_active_deceptions(db: Session) -> list:
    return db.query(DeceptionAsset).filter(DeceptionAsset.status == "active").all()


def get_all_deceptions(db: Session) -> list:
    return db.query(DeceptionAsset).all()


def simulate_attacker_event(db: Session, deception_asset_id: int, event_type: str,
                            technique: str, severity: float, source_ip: str,
                            description: str) -> InteractionEvent:
    jitter = random.uniform(-0.05, 0.05)
    conf = max(0.3, min(0.99, severity * (0.92 + jitter)))
    e = InteractionEvent(
        deception_asset_id=deception_asset_id,
        timestamp=datetime.utcnow(),
        event_type=event_type, technique=technique,
        severity=round(severity, 2), confidence=round(conf, 2),
        source_ip=source_ip, description=description,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


EVENT_PRESETS = {
    "credential_use": {"technique": "T1078", "severity": 0.9, "description": "Honeytoken credential used from external IP"},
    "portal_login": {"technique": "T1078", "severity": 0.85, "description": "Login attempt on fake admin portal"},
    "port_scan": {"technique": "T1046", "severity": 0.7, "description": "Lateral scan touched decoy service"},
    "smb_probe": {"technique": "T1021", "severity": 0.75, "description": "SMB enumeration against decoy share"},
    "data_staging": {"technique": "T1530", "severity": 0.95, "description": "Bulk read on fake database records"},
}


def simulate_random_event(db: Session, deception_asset_id: int) -> InteractionEvent:
    kind = random.choice(list(EVENT_PRESETS.keys()))
    preset = EVENT_PRESETS[kind]
    ips = ["185.220.101.42", "45.155.204.11", "10.0.3.77", "91.240.118.6", "10.0.40.9"]
    return simulate_attacker_event(
        db, deception_asset_id, kind, preset["technique"],
        round(min(0.98, preset["severity"] + random.uniform(-0.08, 0.08)), 2),
        random.choice(ips), preset["description"],
    )


def get_interaction_events(db: Session, deception_id=None, limit=50) -> list:
    q = db.query(InteractionEvent)
    if deception_id:
        q = q.filter(InteractionEvent.deception_asset_id == deception_id)
    return q.order_by(InteractionEvent.id.desc()).limit(limit).all()


def get_deception_summary(db: Session) -> dict:
    all_d = db.query(DeceptionAsset).all()
    active = [d for d in all_d if d.status == "active"]
    events = db.query(InteractionEvent).count()
    engaged_decoys = len({e.deception_asset_id for e in db.query(InteractionEvent).all()})
    engagement_rate = round(engaged_decoys / len(active) * 100, 1) if active else 0.0
    by_type = {}
    for d in all_d:
        by_type[d.deception_type] = by_type.get(d.deception_type, 0) + 1
    return {
        "total": len(all_d), "active": len(active), "ready": len(all_d) - len(active),
        "events_total": events, "engaged_decoys": engaged_decoys,
        "engagement_rate_pct": engagement_rate, "by_type": by_type,
    }
