from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    asset_type = Column(String(60), default="server")
    ip_address = Column(String(50), default="")
    business_function = Column(String(120), default="")
    criticality = Column(String(20), default="medium")
    internet_exposed = Column(Boolean, default=False)
    data_sensitivity = Column(Integer, default=3)
    criticality_score = Column(Float, default=0.5)
    exposure_score = Column(Float, default=0.3)
    risk_contribution = Column(Float, default=0.0)


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, index=True)
    cve_id = Column(String(40))
    severity = Column(Float, default=0.0)
    exploitability = Column(Float, default=0.5)
    mitre_technique = Column(String(20), default="")
    description = Column(Text, default="")


class Threat(Base):
    __tablename__ = "threats"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120))
    technique = Column(String(20))
    source = Column(String(80), default="synthetic-intel")
    likelihood = Column(Float, default=0.5)


class AttackPath(Base):
    __tablename__ = "attack_paths"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160))
    source_asset_id = Column(Integer)
    target_asset_id = Column(Integer)
    node_ids = Column(JSON)
    edge_likelihoods = Column(JSON)
    techniques = Column(JSON)
    likelihood = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0)
    financial_impact = Column(Float, default=0.0)
    confidence = Column(Float, default=0.5)
    is_critical = Column(Boolean, default=False)


class DeceptionAsset(Base):
    __tablename__ = "deception_assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120))
    deception_type = Column(String(60))
    location = Column(String(160), default="")
    status = Column(String(20), default="ready")
    decoy_ip = Column(String(50), default="")
    deployed_at = Column(DateTime, nullable=True)


class InteractionEvent(Base):
    __tablename__ = "interaction_events"
    id = Column(Integer, primary_key=True, index=True)
    deception_asset_id = Column(Integer, index=True)
    timestamp = Column(DateTime, server_default=func.now())
    event_type = Column(String(60))
    technique = Column(String(20))
    severity = Column(Float, default=0.5)
    confidence = Column(Float, default=0.5)
    source_ip = Column(String(50), default="")
    description = Column(Text, default="")


class SecurityControl(Base):
    __tablename__ = "security_controls"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120))
    category = Column(String(60))
    cost = Column(Float)
    expected_reduction = Column(Float)
    effort = Column(String(20), default="medium")
    paths_affected = Column(JSON)
    description = Column(Text, default="")


class InvestmentPlan(Base):
    __tablename__ = "investment_plans"
    id = Column(Integer, primary_key=True, index=True)
    budget = Column(Float)
    total_cost = Column(Float, default=0.0)
    selected_ids = Column(JSON)
    expected_reduction = Column(Float, default=0.0)
    risk_before = Column(Float, default=0.0)
    risk_after = Column(Float, default=0.0)
    applied = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now())
    phase = Column(String(30), default="current")
    score = Column(Float)
    technical_risk = Column(Float, default=0.0)
    financial_loss = Column(Float, default=0.0)
    confidence = Column(Float, default=0.5)
    top_drivers = Column(JSON)
