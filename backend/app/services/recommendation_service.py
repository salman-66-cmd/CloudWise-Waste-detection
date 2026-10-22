import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.recommendation import Recommendation
from app.models.audit_log import AuditLog
from app.schemas.recommendation import RecommendationStatusUpdate

class RecommendationService:
    @staticmethod
    def get_recommendations(
        db: Session,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Recommendation], int]:
        query = db.query(Recommendation)
        if status and status != "all":
            query = query.filter(Recommendation.status == status)
        if risk_level and risk_level != "all":
            query = query.filter(Recommendation.risk_level == risk_level)

        total = query.count()
        items = query.order_by(desc(Recommendation.estimated_monthly_savings)).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def update_recommendation_status(
        db: Session,
        rec_id: str,
        update_data: RecommendationStatusUpdate,
        user_email: Optional[str] = None
    ) -> Optional[Recommendation]:
        rec = db.query(Recommendation).filter(Recommendation.recommendation_id == rec_id).first()
        if not rec:
            return None

        old_status = rec.status
        rec.status = update_data.status
        if update_data.review_notes is not None:
            rec.review_notes = update_data.review_notes
        rec.reviewed_by = user_email or "System Reviewer"
        rec.reviewed_at = datetime.datetime.utcnow()
        rec.updated_at = datetime.datetime.utcnow()

        # Audit log entry
        log_entry = AuditLog(
            user_email=user_email,
            action="recommendation_review",
            target_type="recommendation",
            target_id=rec_id,
            details=f"Status changed from {old_status} to {update_data.status}. Notes: {update_data.review_notes or 'None'}"
        )
        db.add(log_entry)
        db.commit()
        db.refresh(rec)
        return rec
