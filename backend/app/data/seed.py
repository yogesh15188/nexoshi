from app.models.models import Asset, Vulnerability, Threat, DeceptionAsset, SecurityControl
from app.data.catalog import ASSETS, VULNERABILITIES, THREATS, DECOYS, CONTROLS, CRITICALITY_SCORES


def exposure_score(internet_exposed: bool, sensitivity: int) -> float:
    base = 0.85 if internet_exposed else 0.25
    return round(min(1.0, base * 0.65 + (sensitivity / 5.0) * 0.35), 3)


def seed_data(db):
    if db.query(Asset).count() > 0:
        return False
    for a in ASSETS:
        crit = CRITICALITY_SCORES[a["criticality"]]
        exp = exposure_score(a["internet_exposed"], a["data_sensitivity"])
        db.add(Asset(
            id=a["id"], name=a["name"], asset_type=a["asset_type"], ip_address=a["ip_address"],
            business_function=a["business_function"], criticality=a["criticality"],
            internet_exposed=a["internet_exposed"], data_sensitivity=a["data_sensitivity"],
            criticality_score=crit, exposure_score=exp,
            risk_contribution=round((crit * 0.55 + exp * 0.45) * 100, 1),
        ))
    for v in VULNERABILITIES:
        db.add(Vulnerability(**v))
    for t in THREATS:
        db.add(Threat(**t))
    for d in DECOYS:
        db.add(DeceptionAsset(**d))
    for c in CONTROLS:
        db.add(SecurityControl(**c))
    db.commit()
    return True
