from typing import Optional, List
from pydantic import BaseModel
import datetime

class WasteFindingResponse(BaseModel):
    id: int
    finding_id: str
    resource_id: str
    category: str
    severity: str
    rule_triggered: str
    observed_metrics: str
    explanation: str
    estimated_monthly_savings: float
    confidence_level: str
    suggested_next_step: str
    detection_timestamp: datetime.datetime
    review_status: str

    class Config:
        from_attributes = True

class FindingStatusUpdate(BaseModel):
    review_status: str  # new, acknowledged, resolved, dismissed
