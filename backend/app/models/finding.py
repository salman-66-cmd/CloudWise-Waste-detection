import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class WasteFinding(Base):
    __tablename__ = "waste_findings"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(String(100), unique=True, index=True, nullable=False)
    resource_id = Column(String(100), ForeignKey("cloud_resources.resource_id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String(100), nullable=False)
    severity = Column(String(50), default="medium", nullable=False)  # critical, high, medium, low
    rule_triggered = Column(String(100), nullable=False)
    observed_metrics = Column(Text, nullable=False)  # Summary of metrics observed
    explanation = Column(Text, nullable=False)
    
    estimated_monthly_savings = Column(Float, default=0.0, nullable=False)
    confidence_level = Column(String(50), default="high", nullable=False)  # high, medium, low
    suggested_next_step = Column(Text, nullable=False)
    
    detection_timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    review_status = Column(String(50), default="new", nullable=False)  # new, acknowledged, resolved, dismissed

    resource = relationship("CloudResource", back_populates="findings")
    recommendations = relationship("Recommendation", back_populates="finding", cascade="all, delete-orphan")
