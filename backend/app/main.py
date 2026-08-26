from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.config import settings
from app.core.database import engine, get_db, Base
from app.models.models import (
    Asset, Vulnerability, Threat, AttackPath, DeceptionAsset,
    InteractionEvent, SecurityControl, InvestmentPlan, RiskSnapshot,
)
from app.schemas.schemas import (
    AssetCreate, AssetResponse, VulnerabilityCreate, VulnerabilityResponse,
    ThreatCreate, ThreatResponse, DeceptionDeployRequest, DeceptionAssetResponse,
    SimulateEventRequest, InteractionEventResponse, SecurityControlResponse,
    InvestmentOptimizeRequest, MetricsResponse, RecalculateRequest,
)
from app.modules import (
    generate_attack_paths, get_attack_graph_data, get_choke_points,
    calculate_overall_risk, recalculate_with_evidence, latest_snapshot, confidence_tier,
    deploy_deception, deploy_all_ready, get_active_deceptions, get_all_deceptions,
    simulate_attacker_event, simulate_random_event, get_interaction_events,
    get_deception_summary, correlate_evidence, get_all_controls,
    optimize_investment, get_recommendations, run_verification, get_risk_history,
)
from app.data.seed import seed_data

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        if seed_data(db):
            generate_attack_paths(db)
            calculate_overall_risk(db, phase="baseline")
    finally:
        db.close()


@app.post("/api/v1/demo/reset")
def demo_reset(db: Session = Depends(get_db)):
    for model in (InteractionEvent, InvestmentPlan, RiskSnapshot, AttackPath,
                  DeceptionAsset, SecurityControl, Threat, Vulnerability, Asset):
        db.query(model).delete()
    db.commit()
    seed_data(db)
    generate_attack_paths(db)
    risk = calculate_overall_risk(db, phase="baseline")
    return {"status": "reset", "baseline_risk": risk["overall_score"]}


@app.get("/api/v1/metrics", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    snap = latest_snapshot(db) or latest_snapshot(db, phases=["baseline"])
    if snap is None:
        calc = calculate_overall_risk(db, phase="current")
        score, loss, conf = calc["overall_score"], calc["financial_loss"], calc["confidence"]
    else:
        score, loss, conf = snap.score, snap.financial_loss, snap.confidence
    assets = db.query(Asset).all()
    paths = db.query(AttackPath).all()
    active_deceptions = db.query(DeceptionAsset).filter(DeceptionAsset.status == "active").count()
    events_count = db.query(InteractionEvent).count()
    recommended = 1000000
    expected_reduction = round(score * 0.3, 1)
    post_risk = round(max(10.0, score - expected_reduction), 1)
    return MetricsResponse(
        overall_risk_score=score,
        estimated_expected_loss=loss,
        critical_assets_count=len([a for a in assets if a.criticality == "critical"]),
        high_risk_paths_count=len([p for p in paths if p.is_critical]),
        active_deception_assets=active_deceptions,
        recent_interactions=events_count,
        recommended_investment=recommended,
        expected_risk_reduction=expected_reduction,
        risk_reduction_per_rupee=round(expected_reduction / (recommended / 100000), 2),
        post_investment_risk=post_risk,
    )


@app.get("/")
def root():
    if FRONTEND_DIST.exists():
        return FileResponse(FRONTEND_DIST / "index.html")
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/api/v1/assets", response_model=List[AssetResponse])
def list_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


@app.post("/api/v1/assets", response_model=AssetResponse)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    from app.data.catalog import CRITICALITY_SCORES
    from app.data.seed import exposure_score
    crit = CRITICALITY_SCORES.get(asset.criticality, 0.5)
    exp = exposure_score(asset.internet_exposed, asset.data_sensitivity)
    obj = Asset(
        **asset.model_dump(), criticality_score=crit, exposure_score=exp,
        risk_contribution=round((crit * 0.55 + exp * 0.45) * 100, 1),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/api/v1/assets/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.get("/api/v1/vulnerabilities", response_model=List[VulnerabilityResponse])
def list_vulnerabilities(db: Session = Depends(get_db)):
    return db.query(Vulnerability).all()


@app.post("/api/v1/vulnerabilities", response_model=VulnerabilityResponse)
def create_vulnerability(vuln: VulnerabilityCreate, db: Session = Depends(get_db)):
    obj = Vulnerability(**vuln.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/api/v1/threats", response_model=List[ThreatResponse])
def list_threats(db: Session = Depends(get_db)):
    return db.query(Threat).all()


@app.post("/api/v1/threats", response_model=ThreatResponse)
def create_threat(threat: ThreatCreate, db: Session = Depends(get_db)):
    obj = Threat(**threat.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.post("/api/v1/attack-graph/generate")
def regenerate_attack_graph(db: Session = Depends(get_db)):
    count = generate_attack_paths(db)
    return {"status": "generated", "paths": count}


@app.get("/api/v1/attack-graph")
def get_attack_graph(db: Session = Depends(get_db)):
    return get_attack_graph_data(db)


@app.get("/api/v1/attack-graph/choke-points")
def choke_points(db: Session = Depends(get_db)):
    return get_choke_points(db)


@app.post("/api/v1/risk/calculate")
def calculate_risk(db: Session = Depends(get_db)):
    return calculate_overall_risk(db, phase="current")


@app.get("/api/v1/risk/current")
def current_risk(db: Session = Depends(get_db)):
    snap = latest_snapshot(db) or latest_snapshot(db, phases=["baseline"])
    if not snap:
        return calculate_overall_risk(db, phase="current")
    return {
        "score": snap.score, "financial_loss": snap.financial_loss,
        "confidence": snap.confidence, "confidence_level": confidence_tier(snap.confidence),
        "technical_risk": snap.technical_risk, "top_drivers": snap.top_drivers,
        "phase": snap.phase, "timestamp": snap.timestamp.isoformat() if snap.timestamp else None,
    }


@app.post("/api/v1/risk/recalculate")
def recalculate_risk(req: RecalculateRequest, db: Session = Depends(get_db)):
    return recalculate_with_evidence(db, req.evidence_confidence_boost)


@app.get("/api/v1/risk/history")
def risk_history(db: Session = Depends(get_db)):
    return get_risk_history(db)


@app.post("/api/v1/deception/deploy", response_model=DeceptionAssetResponse)
def deploy(req: DeceptionDeployRequest, db: Session = Depends(get_db)):
    return deploy_deception(db, req.name, req.deception_type, req.location)


@app.post("/api/v1/deception/deploy-all")
def deploy_all(db: Session = Depends(get_db)):
    deployed = deploy_all_ready(db)
    return {"deployed": len(deployed),
            "assets": [{"id": d.id, "name": d.name} for d in deployed]}


@app.get("/api/v1/deception/assets", response_model=List[DeceptionAssetResponse])
def list_deceptions(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(DeceptionAsset)
    if status:
        q = q.filter(DeceptionAsset.status == status)
    return q.all()


@app.post("/api/v1/deception/simulate-event", response_model=InteractionEventResponse)
def simulate_event(req: SimulateEventRequest, db: Session = Depends(get_db)):
    decoy = db.query(DeceptionAsset).filter(DeceptionAsset.id == req.deception_asset_id).first()
    if not decoy:
        raise HTTPException(status_code=404, detail="Deception asset not found")
    return simulate_attacker_event(db, req.deception_asset_id, req.event_type,
                                   req.technique, req.severity, req.source_ip, req.description)


@app.post("/api/v1/deception/simulate-random")
def simulate_random(req: SimulateEventRequest, db: Session = Depends(get_db)):
    return simulate_random_event(db, req.deception_asset_id)


@app.get("/api/v1/deception/events", response_model=List[InteractionEventResponse])
def list_events(deception_id: Optional[int] = None, limit: int = 50, db: Session = Depends(get_db)):
    return get_interaction_events(db, deception_id, limit)


@app.get("/api/v1/deception/summary")
def deception_summary(db: Session = Depends(get_db)):
    return get_deception_summary(db)


@app.get("/api/v1/evidence/correlate")
def evidence_correlate(db: Session = Depends(get_db)):
    return correlate_evidence(db)


@app.get("/api/v1/controls", response_model=List[SecurityControlResponse])
def list_controls(db: Session = Depends(get_db)):
    return get_all_controls(db)


@app.post("/api/v1/investment/optimize")
def optimize(req: InvestmentOptimizeRequest, db: Session = Depends(get_db)):
    if req.budget <= 0:
        raise HTTPException(status_code=400, detail="Budget must be positive")
    return optimize_investment(db, req.budget)


@app.get("/api/v1/investment/recommendations")
def recommendations(db: Session = Depends(get_db)):
    return get_recommendations(db)


@app.post("/api/v1/verification/run")
def verification(db: Session = Depends(get_db)):
    return run_verification(db)


@app.get("/api/v1/verification/history")
def verification_history(db: Session = Depends(get_db)):
    return get_risk_history(db)


if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="spa-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        candidate = (FRONTEND_DIST / full_path).resolve()
        if full_path and candidate.is_relative_to(FRONTEND_DIST.resolve()) and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
