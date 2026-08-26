from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class AssetCreate(BaseModel):
    name: str
    asset_type: str = "server"
    ip_address: str = ""
    business_function: str = ""
    criticality: str = "medium"
    internet_exposed: bool = False
    data_sensitivity: int = 3


class AssetResponse(BaseModel):
    id: int
    name: str
    asset_type: str
    ip_address: str
    business_function: str
    criticality: str
    internet_exposed: bool
    data_sensitivity: int
    criticality_score: float
    exposure_score: float
    risk_contribution: float

    class Config:
        from_attributes = True


class VulnerabilityCreate(BaseModel):
    asset_id: int
    cve_id: str
    severity: float
    exploitability: float = 0.5
    mitre_technique: str = ""
    description: str = ""


class VulnerabilityResponse(BaseModel):
    id: int
    asset_id: int
    cve_id: str
    severity: float
    exploitability: float
    mitre_technique: str
    description: str

    class Config:
        from_attributes = True


class ThreatCreate(BaseModel):
    name: str
    technique: str
    source: str = "synthetic-intel"
    likelihood: float = 0.5


class ThreatResponse(BaseModel):
    id: int
    name: str
    technique: str
    source: str
    likelihood: float

    class Config:
        from_attributes = True


class DeceptionDeployRequest(BaseModel):
    name: str
    deception_type: str
    location: str = ""


class DeceptionAssetResponse(BaseModel):
    id: int
    name: str
    deception_type: str
    location: str
    status: str
    decoy_ip: str
    deployed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SimulateEventRequest(BaseModel):
    deception_asset_id: int
    event_type: str = "credential_use"
    technique: str = "T1078"
    severity: float = 0.7
    source_ip: str = "203.0.113.7"
    description: str = ""


class InteractionEventResponse(BaseModel):
    id: int
    deception_asset_id: int
    timestamp: datetime
    event_type: str
    technique: str
    severity: float
    confidence: float
    source_ip: str
    description: str

    class Config:
        from_attributes = True


class SecurityControlResponse(BaseModel):
    id: int
    name: str
    category: str
    cost: float
    expected_reduction: float
    effort: str
    paths_affected: List[str]
    description: str

    class Config:
        from_attributes = True


class InvestmentOptimizeRequest(BaseModel):
    budget: float


class RecalculateRequest(BaseModel):
    evidence_confidence_boost: float = 0.2


class MetricsResponse(BaseModel):
    overall_risk_score: float
    estimated_expected_loss: float
    critical_assets_count: int
    high_risk_paths_count: int
    active_deception_assets: int
    recent_interactions: int
    recommended_investment: float
    expected_risk_reduction: float
    risk_reduction_per_rupee: float
    post_investment_risk: float
