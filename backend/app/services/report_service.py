import csv
import io
import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.resource import CloudResource
from app.models.finding import WasteFinding
from app.models.recommendation import Recommendation
from app.services.cost_service import CostService

class ReportService:
    @staticmethod
    def generate_summary_report(db: Session) -> Dict[str, Any]:
        cost_info = CostService.get_cost_summary(db)
        total_resources = db.query(CloudResource).count()

        # Findings by severity
        sev_counts = db.query(WasteFinding.severity, func.count(WasteFinding.id))\
            .group_by(WasteFinding.severity).all()
        findings_by_severity = {s[0]: s[1] for s in sev_counts}

        # Findings by category
        cat_counts = db.query(WasteFinding.category, func.count(WasteFinding.id))\
            .group_by(WasteFinding.category).all()
        findings_by_category = {c[0]: c[1] for c in cat_counts}

        # Environment breakdown
        env_breakdown = db.query(
            CloudResource.environment,
            func.count(CloudResource.id),
            func.sum(CloudResource.monthly_cost)
        ).group_by(CloudResource.environment).all()

        environment_data = [
            {"environment": e[0], "resource_count": e[1], "monthly_spend": round(float(e[2] or 0), 2)}
            for e in env_breakdown
        ]

        # Recommendations summary
        recs = db.query(Recommendation).order_by(Recommendation.estimated_monthly_savings.desc()).limit(10).all()
        rec_summary = [
            {
                "title": r.title,
                "action": r.suggested_action,
                "savings": r.estimated_monthly_savings,
                "risk": r.risk_level,
                "status": r.status
            }
            for r in recs
        ]

        return {
            "generated_at": datetime.datetime.utcnow(),
            "total_resources": total_resources,
            "total_monthly_spend": cost_info["total_monthly_spend"],
            "total_potential_monthly_savings": cost_info["potential_monthly_savings"],
            "total_potential_annual_savings": cost_info["potential_annual_savings"],
            "optimization_score": cost_info["optimization_score"],
            "findings_by_severity": findings_by_severity,
            "findings_by_category": findings_by_category,
            "provider_breakdown": cost_info["provider_breakdown"],
            "environment_breakdown": environment_data,
            "recommendations_summary": rec_summary
        }

    @staticmethod
    def export_report_csv(db: Session) -> str:
        report = ReportService.generate_summary_report(db)
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["=== CLOUD RESOURCE WASTE & OPTIMIZATION REPORT ==="])
        writer.writerow(["Generated At", report["generated_at"].isoformat()])
        writer.writerow(["Total Monitored Resources", report["total_resources"]])
        writer.writerow(["Estimated Monthly Spend ($)", report["total_monthly_spend"]])
        writer.writerow(["Potential Monthly Savings ($)", report["total_potential_monthly_savings"]])
        writer.writerow(["Potential Annual Savings ($)", report["total_potential_annual_savings"]])
        writer.writerow(["Optimization Score (%)", report["optimization_score"]])
        writer.writerow([])
        
        writer.writerow(["=== FINDINGS BY CATEGORY ==="])
        writer.writerow(["Category", "Count"])
        for cat, cnt in report["findings_by_category"].items():
            writer.writerow([cat, cnt])
        writer.writerow([])

        writer.writerow(["=== TOP RECOMMENDATIONS ==="])
        writer.writerow(["Title", "Suggested Action", "Monthly Savings ($)", "Risk", "Status"])
        for r in report["recommendations_summary"]:
            writer.writerow([r["title"], r["action"], r["savings"], r["risk"], r["status"]])

        return output.getvalue()
