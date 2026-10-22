import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class CloudResource(Base):
    __tablename__ = "cloud_resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    provider = Column(String(50), default="AWS", nullable=False)  # AWS, GCP, Azure, Simulated
    region = Column(String(50), default="us-east-1", nullable=False)
    resource_type = Column(String(100), nullable=False)  # Virtual Machines, Containers, Managed Databases, Object Storage, Block Storage Volumes, Load Balancers
    environment = Column(String(50), default="Development", nullable=False)  # Production, Staging, Development, Testing
    instance_size = Column(String(100), default="t3.medium", nullable=False)
    
    # Utilization Metrics
    cpu_utilization = Column(Float, default=0.0, nullable=False)
    memory_utilization = Column(Float, nullable=True)  # May be None if agent not installed
    network_utilization = Column(Float, default=0.0, nullable=False)  # MB/s
    storage_utilization = Column(Float, nullable=True)  # GB or %
    
    # Cost & Pricing
    hourly_cost = Column(Float, default=0.0, nullable=False)
    monthly_cost = Column(Float, default=0.0, nullable=False)  # Calculated as hourly * 730
    
    # Status
    status = Column(String(50), default="running", nullable=False)  # running, stopped, idle, unattached, terminated
    is_attached = Column(Boolean, default=True, nullable=False)  # Relevant for EBS volumes
    optimization_status = Column(String(50), default="optimal", nullable=False)  # optimal, underutilized, idle, wasteful, under_review
    source = Column(String(50), default="simulated", nullable=False)  # simulated, aws, csv, manual
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_activity = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_metrics_update = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    tags = Column(Text, nullable=True)  # JSON or comma-separated tags

    # Relationships
    metrics = relationship("ResourceMetric", back_populates="resource", cascade="all, delete-orphan")
    findings = relationship("WasteFinding", back_populates="resource", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="resource", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="resource", cascade="all, delete-orphan")
