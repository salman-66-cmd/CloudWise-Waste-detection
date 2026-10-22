import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResourceMetric(Base):
    __tablename__ = "resource_metrics"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(100), ForeignKey("cloud_resources.resource_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    
    cpu_percent = Column(Float, nullable=False)
    memory_percent = Column(Float, nullable=True)
    network_mbps = Column(Float, default=0.0, nullable=False)
    storage_gb = Column(Float, nullable=True)
    metrics_source = Column(String(50), default="simulated", nullable=False)

    resource = relationship("CloudResource", back_populates="metrics")

    __table_args__ = (
        Index("ix_resource_metrics_res_time", "resource_id", "timestamp"),
    )
