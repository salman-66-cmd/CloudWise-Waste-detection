from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.alert import AlertResponse
from app.schemas.recommendation import RecommendationResponse

class TopWastefulItem(BaseModel):
    resource_id: str
    name: str
    resource_type: str
    provider: str
    environment: str
    monthly_cost: float
    potential_savings: float
    reason: str
    severity: str

class DistributionItem(BaseModel):
    name: str
    count: int
    cost: float

class TrendPoint(BaseModel):
    time: str
    cpu: float
    memory: float
    spend: float

class DashboardSummaryResponse(BaseModel):
    total_resources: int
    active_resources: int
    idle_resources: int
    underutilized_resources: int
    estimated_monthly_cost: float
    potential_monthly_savings: float
    potential_annual_savings: float
    optimization_score: float
    simulated_count: int
    aws_count: int

    top_wasteful_resources: List[TopWastefulItem]
    recent_alerts: List[AlertResponse]
    recent_recommendations: List[RecommendationResponse]
    distribution_by_type: List[DistributionItem]
    distribution_by_provider: List[DistributionItem]
    idle_vs_active: List[Dict[str, Any]]
    trends: List[TrendPoint]
