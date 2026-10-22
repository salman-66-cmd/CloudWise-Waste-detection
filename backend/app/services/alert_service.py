import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.alert import Alert
from app.schemas.alert import AlertStatusUpdate

class AlertService:
    @staticmethod
    def get_alerts(
        db: Session,
        severity: Optional[str] = None,
        is_read: Optional[bool] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Alert], int]:
        query = db.query(Alert)
        if severity and severity != "all":
            query = query.filter(Alert.severity == severity)
        if is_read is not None:
            query = query.filter(Alert.is_read == is_read)
        if status and status != "all":
            query = query.filter(Alert.status == status)

        total = query.count()
        items = query.order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def update_alert(db: Session, alert_id: str, update_data: AlertStatusUpdate) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not alert:
            return None

        if update_data.is_read is not None:
            alert.is_read = update_data.is_read
        if update_data.status is not None:
            alert.status = update_data.status
            if update_data.status == "resolved":
                alert.resolved_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(alert)
        return alert
