import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Cloud Resource Waste Detector"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cloudwise_super_secret_jwt_key_2026_dev_mode_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cloudwise.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Cost & Waste Engine Configurable Thresholds
    MONTHLY_BILLABLE_HOURS: float = 730.0
    IDLE_CPU_THRESHOLD_PERCENT: float = 5.0
    UNDERUTILIZED_CPU_THRESHOLD_PERCENT: float = 20.0
    LOW_MEMORY_THRESHOLD_PERCENT: float = 25.0
    UNATTACHED_STORAGE_DAYS_THRESHOLD: int = 7
    LOW_TRAFFIC_LB_MBPS_THRESHOLD: float = 0.5
    STALE_RESOURCE_DAYS_THRESHOLD: int = 14
    OBSERVATION_WINDOW_DAYS: int = 7
    MIN_OBSERVATION_METRICS_COUNT: int = 5  # require at least 5 readings for high confidence
    
    # Optional AWS Integration
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_DEFAULT_REGION: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    AWS_ENABLED: bool = os.getenv("AWS_ENABLED", "false").lower() in ("true", "1")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
