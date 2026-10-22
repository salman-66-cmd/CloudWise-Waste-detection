from typing import Optional, List
from pydantic import BaseModel
import datetime

class MetricIngestItem(BaseModel):
    resource_id: str
    timestamp: Optional[datetime.datetime] = None
    cpu_percent: float
    memory_percent: Optional[float] = None
    network_mbps: Optional[float] = 0.0
    storage_gb: Optional[float] = None
    metrics_source: Optional[str] = "ingest_api"

class MetricIngestBatch(BaseModel):
    metrics: List[MetricIngestItem]

class MetricResponse(BaseModel):
    id: int
    resource_id: str
    timestamp: datetime.datetime
    cpu_percent: float
    memory_percent: Optional[float] = None
    network_mbps: float
    storage_gb: Optional[float] = None
    metrics_source: str

    class Config:
        from_attributes = True

class MetricTrendPoint(BaseModel):
    timestamp: str
    avg_cpu: float
    avg_memory: float
    avg_network: float
