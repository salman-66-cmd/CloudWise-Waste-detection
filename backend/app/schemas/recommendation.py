from typing import Optional, List
from pydantic import BaseModel
import datetime

class RecommendationResponse(BaseModel):
    id: int
    recommendation_id: str
    resource_id: str
    finding_id: Optional[str] = None
    title: str
    suggested_action: str
    current_configuration: str
    evidence: str
    estimated_monthly_savings: float
    estimated_savings_range: Optional[str] = None
    risk_level: str
    confidence_level: str
    operational_impact: str
    required_human_approval: bool
    rollback_considerations: str
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class RecommendationStatusUpdate(BaseModel):
    status: str  # New, Under Review, Approved, Rejected, Completed
    review_notes: Optional[str] = None
