from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.metrics_service import MetricsService
from app.services.simulator_service import SimulatorService
from app.services.waste_engine import WasteDetectionEngine
from app.schemas.metric import MetricIngestItem, MetricResponse

router = APIRouter(prefix="/metrics", tags=["Metrics & Simulator"])

@router.post("/ingest", response_model=MetricResponse)
def ingest_metric(item: MetricIngestItem, db: Session = Depends(get_db)):
    return MetricsService.ingest_metric(db, item)

@router.get("/resource/{resource_id}", response_model=List[MetricResponse])
def get_resource_metrics(
    resource_id: str,
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return MetricsService.get_resource_metrics(db, resource_id, days=days, limit=limit)

@router.post("/simulator/run")
def run_simulator(force_reset: bool = Query(False), db: Session = Depends(get_db)):
    """
    Populate realistic demo cloud resources and historical time-series metrics,
    then automatically execute the waste detection engine.
    """
    seed_result = SimulatorService.seed_demo_data(db, force_reset=force_reset)
    
    # Run analysis automatically after simulator populates
    engine = WasteDetectionEngine(db)
    job = engine.run_analysis()

    return {
        "simulator": seed_result,
        "analysis_job": {
            "job_id": job.job_id,
            "status": job.status,
            "resources_analyzed": job.resources_analyzed,
            "findings_generated": job.findings_generated,
            "recommendations_generated": job.recommendations_generated,
            "potential_savings": job.potential_savings
        }
    }
