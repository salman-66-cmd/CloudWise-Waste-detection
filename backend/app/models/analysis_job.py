import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.core.database import Base

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="running", nullable=False)  # pending, running, completed, failed
    
    resources_analyzed = Column(Integer, default=0, nullable=False)
    findings_generated = Column(Integer, default=0, nullable=False)
    recommendations_generated = Column(Integer, default=0, nullable=False)
    potential_savings = Column(Float, default=0.0, nullable=False)
    
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
