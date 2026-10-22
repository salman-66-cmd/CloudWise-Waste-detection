from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_user
from app.models.resource import CloudResource
from app.models.finding import WasteFinding
from app.models.alert import Alert
from app.models.recommendation import Recommendation
from app.services.cost_service import CostService
from app.services.metrics_service import MetricsService
from app.schemas.dashboard import DashboardSummaryResponse, TrendPoint, TopWastefulItem, DistributionItem
from app.schemas.alert import AlertResponse
from app.schemas.recommendation import RecommendationResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    provider: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Query resources with optional filters
    res_query = db.query(CloudResource)
    if provider and provider != "all":
        res_query = res_query.filter(CloudResource.provider == provider)
    if environment and environment != "all":
        res_query = res_query.filter(CloudResource.environment == environment)

    resources = res_query.all()
    total_resources = len(resources)
    active_resources = sum(1 for r in resources if r.status in ("running", "active"))
    idle_resources = sum(1 for r in resources if r.optimization_status in ("idle", "wasteful") or r.status in ("idle", "unattached"))
    underutilized_resources = sum(1 for r in resources if r.optimization_status == "underutilized")

    simulated_count = sum(1 for r in resources if r.source == "simulated")
    aws_count = sum(1 for r in resources if r.source == "aws")

    cost_info = CostService.get_cost_summary(db)

    # Top wasteful resources
    waste_findings = db.query(WasteFinding).order_by(WasteFinding.estimated_monthly_savings.desc()).limit(10).all()
    top_wasteful: List[TopWastefulItem] = []
    seen_ids = set()
    for f in waste_findings:
        if f.resource_id in seen_ids:
            continue
        res = next((r for r in resources if r.resource_id == f.resource_id), None)
        if res:
            seen_ids.add(f.resource_id)
            top_wasteful.append(TopWastefulItem(
                resource_id=res.resource_id,
                name=res.name,
                resource_type=res.resource_type,
                provider=res.provider,
                environment=res.environment,
                monthly_cost=res.monthly_cost,
                potential_savings=f.estimated_monthly_savings,
                reason=f.category,
                severity=f.severity
            ))
        if len(top_wasteful) >= 5:
            break

    # Recent alerts
    recent_alerts_db = db.query(Alert).order_by(Alert.created_at.desc()).limit(5).all()
    recent_alerts = [AlertResponse.model_validate(a) for a in recent_alerts_db]

    # Recent recommendations
    recent_recs_db = db.query(Recommendation).order_by(Recommendation.created_at.desc()).limit(5).all()
    recent_recs = [RecommendationResponse.model_validate(r) for r in recent_recs_db]

    # Distribution by type
    type_map: Dict[str, Dict[str, Any]] = {}
    for r in resources:
        if r.resource_type not in type_map:
            type_map[r.resource_type] = {"count": 0, "cost": 0.0}
        type_map[r.resource_type]["count"] += 1
        type_map[r.resource_type]["cost"] += r.monthly_cost

    distribution_by_type = [
        DistributionItem(name=k, count=v["count"], cost=round(v["cost"], 2))
        for k, v in type_map.items()
    ]

    # Distribution by provider
    prov_map: Dict[str, Dict[str, Any]] = {}
    for r in resources:
        if r.provider not in prov_map:
            prov_map[r.provider] = {"count": 0, "cost": 0.0}
        prov_map[r.provider]["count"] += 1
        prov_map[r.provider]["cost"] += r.monthly_cost

    distribution_by_provider = [
        DistributionItem(name=k, count=v["count"], cost=round(v["cost"], 2))
        for k, v in prov_map.items()
    ]

    # Idle vs active chart breakdown
    idle_vs_active = [
        {"name": "Active & Optimal", "value": max(0, active_resources - idle_resources - underutilized_resources)},
        {"name": "Underutilized", "value": underutilized_resources},
        {"name": "Idle / Unattached", "value": idle_resources},
        {"name": "Stopped / Other", "value": max(0, total_resources - active_resources)}
    ]

    # Trends
    trend_points_raw = MetricsService.get_aggregated_trends(db, days=7)
    trends = [TrendPoint(**tp) for tp in trend_points_raw]

    return DashboardSummaryResponse(
        total_resources=total_resources,
        active_resources=active_resources,
        idle_resources=idle_resources,
        underutilized_resources=underutilized_resources,
        estimated_monthly_cost=cost_info["total_monthly_spend"],
        potential_monthly_savings=cost_info["potential_monthly_savings"],
        potential_annual_savings=cost_info["potential_annual_savings"],
        optimization_score=cost_info["optimization_score"],
        simulated_count=simulated_count,
        aws_count=aws_count,
        top_wasteful_resources=top_wasteful,
        recent_alerts=recent_alerts,
        recent_recommendations=recent_recs,
        distribution_by_type=distribution_by_type,
        distribution_by_provider=distribution_by_provider,
        idle_vs_active=idle_vs_active,
        trends=trends
    )

@router.get("/trends")
def get_dashboard_trends(days: int = 7, db: Session = Depends(get_db)):
    return MetricsService.get_aggregated_trends(db, days=days)
