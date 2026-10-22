import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.models.metric import ResourceMetric
from app.models.resource import CloudResource
from app.schemas.metric import MetricIngestItem

class MetricsService:
    @staticmethod
    def ingest_metric(db: Session, item: MetricIngestItem) -> ResourceMetric:
        ts = item.timestamp or datetime.datetime.utcnow()
        metric = ResourceMetric(
            resource_id=item.resource_id,
            timestamp=ts,
            cpu_percent=item.cpu_percent,
            memory_percent=item.memory_percent,
            network_mbps=item.network_mbps or 0.0,
            storage_gb=item.storage_gb,
            metrics_source=item.metrics_source or "ingest_api"
        )
        db.add(metric)

        # Update the parent resource's latest snapshot
        res = db.query(CloudResource).filter(CloudResource.resource_id == item.resource_id).first()
        if res:
            res.cpu_utilization = item.cpu_percent
            if item.memory_percent is not None:
                res.memory_utilization = item.memory_percent
            if item.network_mbps is not None:
                res.network_utilization = item.network_mbps
            if item.storage_gb is not None:
                res.storage_utilization = item.storage_gb
            res.last_metrics_update = ts

        db.commit()
        db.refresh(metric)
        return metric

    @staticmethod
    def get_resource_metrics(
        db: Session,
        resource_id: str,
        days: int = 7,
        limit: int = 100
    ) -> List[ResourceMetric]:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        metrics = (
            db.query(ResourceMetric)
            .filter(ResourceMetric.resource_id == resource_id)
            .filter(ResourceMetric.timestamp >= cutoff)
            .order_by(asc(ResourceMetric.timestamp))
            .limit(limit)
            .all()
        )
        return metrics

    @staticmethod
    def get_aggregated_trends(db: Session, days: int = 7) -> List[Dict[str, Any]]:
        """
        Produce daily average CPU, Memory, and Spending trend points for dashboard charts.
        """
        now = datetime.datetime.utcnow()
        points = []
        for i in range(days - 1, -1, -1):
            day_start = (now - datetime.timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + datetime.timedelta(days=1)
            date_label = day_start.strftime("%b %d")

            avg_cpu = db.query(func.avg(ResourceMetric.cpu_percent))\
                .filter(ResourceMetric.timestamp >= day_start)\
                .filter(ResourceMetric.timestamp < day_end).scalar() or 0.0

            avg_mem = db.query(func.avg(ResourceMetric.memory_percent))\
                .filter(ResourceMetric.timestamp >= day_start)\
                .filter(ResourceMetric.timestamp < day_end)\
                .filter(ResourceMetric.memory_percent.isnot(None)).scalar() or 0.0

            # Calculate total active hourly cost * 24 for spend estimation of that day
            active_hourly = db.query(func.sum(CloudResource.hourly_cost))\
                .filter(CloudResource.status.in_(["running", "idle"])).scalar() or 0.0
            
            # Subtle variation for realism if historical metrics existed
            daily_spend = round(active_hourly * 24, 2)

            points.append({
                "time": date_label,
                "cpu": round(float(avg_cpu), 1),
                "memory": round(float(avg_mem), 1),
                "spend": daily_spend
            })
        return points
