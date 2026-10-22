import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(100), unique=True, index=True, nullable=False)
    resource_id = Column(String(100), ForeignKey("cloud_resources.resource_id", ondelete="CASCADE"), nullable=False, index=True)
    finding_id = Column(String(100), ForeignKey("waste_findings.finding_id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False)
    suggested_action = Column(Text, nullable=False)
    current_configuration = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    
    estimated_monthly_savings = Column(Float, default=0.0, nullable=False)
    estimated_savings_range = Column(String(100), nullable=True)
    
    risk_level = Column(String(50), default="Low", nullable=False)  # Low, Medium, High
    confidence_level = Column(String(50), default="High", nullable=False)  # High, Medium, Low
    operational_impact = Column(Text, nullable=False)
    required_human_approval = Column(Boolean, default=True, nullable=False)
    rollback_considerations = Column(Text, nullable=False)
    
    # Workflow status: New, Under Review, Approved, Rejected, Completed
    status = Column(String(50), default="New", nullable=False)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    resource = relationship("CloudResource", back_populates="recommendations")
    finding = relationship("WasteFinding", back_populates="recommendations")
