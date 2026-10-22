import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, index=True, nullable=False)
    resource_id = Column(String(100), ForeignKey("cloud_resources.resource_id", ondelete="CASCADE"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="warning", nullable=False)  # critical, warning, info
    alert_type = Column(String(100), nullable=False)  # idle_detected, high_cost, utilization_change, waste_increase, ingestion_failed, job_failed
    
    is_read = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="active", nullable=False)  # active, resolved, dismissed
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    resource = relationship("CloudResource", back_populates="alerts")
