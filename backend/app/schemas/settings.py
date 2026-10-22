from typing import Optional
from pydantic import BaseModel

class ThresholdSettings(BaseModel):
    idle_cpu_threshold: float
    underutilized_cpu_threshold: float
    low_memory_threshold: float
    unattached_storage_days: int
    low_traffic_lb_mbps: float
    stale_resource_days: int
    monthly_billable_hours: float
    observation_window_days: int
    min_metrics_count: int
    aws_enabled: bool

class SettingsUpdate(BaseModel):
    idle_cpu_threshold: Optional[float] = None
    underutilized_cpu_threshold: Optional[float] = None
    low_memory_threshold: Optional[float] = None
    unattached_storage_days: Optional[int] = None
    low_traffic_lb_mbps: Optional[float] = None
    stale_resource_days: Optional[int] = None
    monthly_billable_hours: Optional[float] = None
    observation_window_days: Optional[int] = None
