from typing import Optional, List
from pydantic import BaseModel
import datetime

class AlertResponse(BaseModel):
    id: int
    alert_id: str
    resource_id: Optional[str] = None
    title: str
    message: str
    severity: str
    alert_type: str
    is_read: bool
    status: str
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    is_read: Optional[bool] = None
    status: Optional[str] = None
