from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.recommendation_service import RecommendationService
from app.schemas.recommendation import RecommendationResponse, RecommendationStatusUpdate

router = APIRouter(prefix="/recommendations", tags=["Optimization Recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def list_recommendations(
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, total = RecommendationService.get_recommendations(
        db=db,
        status=status,
        risk_level=risk_level,
        skip=skip,
        limit=limit
    )
    return items

@router.patch("/{recommendation_id}", response_model=RecommendationResponse)
def update_recommendation(
    recommendation_id: str,
    update_in: RecommendationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = RecommendationService.update_recommendation_status(
        db=db,
        rec_id=recommendation_id,
        update_data=update_in,
        user_email=current_user.email if current_user else "admin@cloudwise.io"
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return updated
