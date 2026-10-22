from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.resource import CloudResource
from app.models.recommendation import Recommendation
from app.models.finding import WasteFinding
from app.core.config import settings

class CostService:
    @staticmethod
    def get_cost_summary(db: Session) -> Dict[str, Any]:
        """
        Calculate total monthly cost, potential monthly savings (deduplicated by resource),
        annual savings, and before/after comparison.
        """
        resources = db.query(CloudResource).all()
        total_monthly_spend = sum(r.monthly_cost for r in resources if r.status != "terminated")
        total_hourly_spend = sum(r.hourly_cost for r in resources if r.status != "terminated")
        total_daily_spend = round(total_hourly_spend * 24, 2)

        # Deduplicate potential savings per resource by taking the max savings from active findings/recs
        findings = db.query(WasteFinding).filter(WasteFinding.review_status != "dismissed").all()
        resource_savings_map: Dict[str, float] = {}
        for f in findings:
            current = resource_savings_map.get(f.resource_id, 0.0)
            if f.estimated_monthly_savings > current:
                resource_savings_map[f.resource_id] = f.estimated_monthly_savings

        potential_monthly_savings = round(sum(resource_savings_map.values()), 2)
        # Cap savings at total spend
        potential_monthly_savings = min(potential_monthly_savings, total_monthly_spend)
        potential_annual_savings = round(potential_monthly_savings * 12, 2)

        optimized_monthly_spend = round(max(0.0, total_monthly_spend - potential_monthly_savings), 2)
        savings_percentage = round((potential_monthly_savings / total_monthly_spend * 100), 1) if total_monthly_spend > 0 else 0.0
        optimization_score = round(max(0.0, 100.0 - savings_percentage), 1)

        # Provider Breakdown
        providers = db.query(
            CloudResource.provider,
            func.count(CloudResource.id),
            func.sum(CloudResource.monthly_cost)
        ).group_by(CloudResource.provider).all()

        provider_breakdown = [
            {"provider": p[0], "count": p[1], "cost": round(float(p[2] or 0), 2)}
            for p in providers
        ]

        # Region Breakdown
        regions = db.query(
            CloudResource.region,
            func.count(CloudResource.id),
            func.sum(CloudResource.monthly_cost)
        ).group_by(CloudResource.region).all()

        region_breakdown = [
            {"region": r[0], "count": r[1], "cost": round(float(r[2] or 0), 2)}
            for r in regions
        ]

        return {
            "total_hourly_spend": round(total_hourly_spend, 4),
            "total_daily_spend": total_daily_spend,
            "total_monthly_spend": round(total_monthly_spend, 2),
            "potential_monthly_savings": potential_monthly_savings,
            "potential_annual_savings": potential_annual_savings,
            "optimized_monthly_spend": optimized_monthly_spend,
            "savings_percentage": savings_percentage,
            "optimization_score": optimization_score,
            "provider_breakdown": provider_breakdown,
            "region_breakdown": region_breakdown,
            "billable_hours_month": settings.MONTHLY_BILLABLE_HOURS
        }
