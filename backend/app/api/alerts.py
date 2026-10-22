from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.alert_service import AlertService
from app.schemas.alert import AlertResponse, AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, total = AlertService.get_alerts(
        db=db,
        severity=severity,
        is_read=is_read,
        status=status,
        skip=skip,
        limit=limit
    )
    return items

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: str,
    update_in: AlertStatusUpdate,
    db: Session = Depends(get_db)
):
    updated = AlertService.update_alert(db, alert_id, update_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")
    return updated
