from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user
from app.models.finding import WasteFinding
from app.services.waste_engine import WasteDetectionEngine
from app.schemas.finding import WasteFindingResponse, FindingStatusUpdate

router = APIRouter(prefix="/analysis", tags=["Waste Detection Engine"])

@router.post("/run")
def trigger_waste_analysis(db: Session = Depends(get_db)):
    engine = WasteDetectionEngine(db)
    job = engine.run_analysis()
    return {
        "job_id": job.job_id,
        "status": job.status,
        "resources_analyzed": job.resources_analyzed,
        "findings_generated": job.findings_generated,
        "recommendations_generated": job.recommendations_generated,
        "potential_savings": job.potential_savings
    }

@router.get("/findings", response_model=List[WasteFindingResponse])
def list_findings(
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(WasteFinding)
    if category and category != "all":
        query = query.filter(WasteFinding.category == category)
    if severity and severity != "all":
        query = query.filter(WasteFinding.severity == severity)
    if review_status and review_status != "all":
        query = query.filter(WasteFinding.review_status == review_status)

    findings = query.order_by(desc(WasteFinding.estimated_monthly_savings)).limit(limit).all()
    return findings

@router.get("/findings/{finding_id}", response_model=WasteFindingResponse)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = db.query(WasteFinding).filter(WasteFinding.finding_id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding

@router.patch("/findings/{finding_id}", response_model=WasteFindingResponse)
def update_finding_status(finding_id: str, update_in: FindingStatusUpdate, db: Session = Depends(get_db)):
    finding = db.query(WasteFinding).filter(WasteFinding.finding_id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    finding.review_status = update_in.review_status
    db.commit()
    db.refresh(finding)
    return finding
