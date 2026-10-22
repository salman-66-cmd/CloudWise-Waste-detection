from typing import Optional, List
from pydantic import BaseModel
import datetime

class ResourceBase(BaseModel):
    name: str
    provider: str = "AWS"
    region: str = "us-east-1"
    resource_type: str = "Virtual Machines"
    environment: str = "Development"
    instance_size: str = "t3.medium"
    cpu_utilization: float = 0.0
    memory_utilization: Optional[float] = None
    network_utilization: float = 0.0
    storage_utilization: Optional[float] = None
    hourly_cost: float = 0.0
    status: str = "running"
    is_attached: bool = True
    tags: Optional[str] = None

class ResourceCreate(ResourceBase):
    resource_id: str
    source: Optional[str] = "manual"

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    region: Optional[str] = None
    resource_type: Optional[str] = None
    environment: Optional[str] = None
    instance_size: Optional[str] = None
    cpu_utilization: Optional[float] = None
    memory_utilization: Optional[float] = None
    network_utilization: Optional[float] = None
    storage_utilization: Optional[float] = None
    hourly_cost: Optional[float] = None
    status: Optional[str] = None
    is_attached: Optional[bool] = None
    optimization_status: Optional[str] = None
    tags: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: int
    resource_id: str
    monthly_cost: float
    optimization_status: str
    source: str
    created_at: datetime.datetime
    last_activity: datetime.datetime
    last_metrics_update: datetime.datetime

    class Config:
        from_attributes = True

class ResourceListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ResourceResponse]
