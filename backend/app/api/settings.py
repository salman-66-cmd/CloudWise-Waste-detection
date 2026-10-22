from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.services.aws_adapter import AWSAdapter
from app.schemas.settings import ThresholdSettings, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings & Configuration"])

@router.get("", response_model=ThresholdSettings)
def get_settings():
    return ThresholdSettings(
        idle_cpu_threshold=settings.IDLE_CPU_THRESHOLD_PERCENT,
        underutilized_cpu_threshold=settings.UNDERUTILIZED_CPU_THRESHOLD_PERCENT,
        low_memory_threshold=settings.LOW_MEMORY_THRESHOLD_PERCENT,
        unattached_storage_days=settings.UNATTACHED_STORAGE_DAYS_THRESHOLD,
        low_traffic_lb_mbps=settings.LOW_TRAFFIC_LB_MBPS_THRESHOLD,
        stale_resource_days=settings.STALE_RESOURCE_DAYS_THRESHOLD,
        monthly_billable_hours=settings.MONTHLY_BILLABLE_HOURS,
        observation_window_days=settings.OBSERVATION_WINDOW_DAYS,
        min_metrics_count=settings.MIN_OBSERVATION_METRICS_COUNT,
        aws_enabled=settings.AWS_ENABLED
    )

@router.patch("", response_model=ThresholdSettings)
def update_settings(update_in: SettingsUpdate):
    if update_in.idle_cpu_threshold is not None:
        settings.IDLE_CPU_THRESHOLD_PERCENT = update_in.idle_cpu_threshold
    if update_in.underutilized_cpu_threshold is not None:
        settings.UNDERUTILIZED_CPU_THRESHOLD_PERCENT = update_in.underutilized_cpu_threshold
    if update_in.low_memory_threshold is not None:
        settings.LOW_MEMORY_THRESHOLD_PERCENT = update_in.low_memory_threshold
    if update_in.unattached_storage_days is not None:
        settings.UNATTACHED_STORAGE_DAYS_THRESHOLD = update_in.unattached_storage_days
    if update_in.low_traffic_lb_mbps is not None:
        settings.LOW_TRAFFIC_LB_MBPS_THRESHOLD = update_in.low_traffic_lb_mbps
    if update_in.stale_resource_days is not None:
        settings.STALE_RESOURCE_DAYS_THRESHOLD = update_in.stale_resource_days
    if update_in.monthly_billable_hours is not None:
        settings.MONTHLY_BILLABLE_HOURS = update_in.monthly_billable_hours
    if update_in.observation_window_days is not None:
        settings.OBSERVATION_WINDOW_DAYS = update_in.observation_window_days

    return get_settings()

@router.get("/aws/status")
def get_aws_status():
    adapter = AWSAdapter()
    return adapter.get_connection_status()

@router.post("/aws/sync")
def sync_aws_resources():
    adapter = AWSAdapter()
    return adapter.sync_resources()
