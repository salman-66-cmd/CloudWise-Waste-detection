import datetime
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.resource import CloudResource
from app.models.metric import ResourceMetric
from app.models.finding import WasteFinding
from app.models.recommendation import Recommendation
from app.models.alert import Alert
from app.models.analysis_job import AnalysisJob
from app.core.config import settings

class WasteDetectionEngine:
    def __init__(self, db: Session):
        self.db = db
        # Configurable thresholds
        self.idle_cpu_threshold = settings.IDLE_CPU_THRESHOLD_PERCENT
        self.underutilized_cpu_threshold = settings.UNDERUTILIZED_CPU_THRESHOLD_PERCENT
        self.low_mem_threshold = settings.LOW_MEMORY_THRESHOLD_PERCENT
        self.unattached_days = settings.UNATTACHED_STORAGE_DAYS_THRESHOLD
        self.low_traffic_mbps = settings.LOW_TRAFFIC_LB_MBPS_THRESHOLD
        self.stale_days = settings.STALE_RESOURCE_DAYS_THRESHOLD
        self.min_metrics_count = settings.MIN_OBSERVATION_METRICS_COUNT

    def run_analysis(self) -> AnalysisJob:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        job = AnalysisJob(
            job_id=job_id,
            status="running",
            started_at=datetime.datetime.utcnow()
        )
        self.db.add(job)
        self.db.commit()

        resources_analyzed = 0
        findings_count = 0
        recommendations_count = 0
        total_potential_savings = 0.0

        try:
            resources = self.db.query(CloudResource).all()
            for res in resources:
                resources_analyzed += 1
                res_findings, res_recs = self.evaluate_resource(res)
                
                # Check for existing findings to prevent duplicate accumulation
                for finding_data, rec_data in zip(res_findings, res_recs):
                    existing = self.db.query(WasteFinding).filter(
                        WasteFinding.resource_id == res.resource_id,
                        WasteFinding.rule_triggered == finding_data["rule_triggered"],
                        WasteFinding.review_status != "resolved"
                    ).first()

                    if not existing:
                        finding = WasteFinding(**finding_data)
                        self.db.add(finding)
                        self.db.flush()
                        
                        rec_data["finding_id"] = finding.finding_id
                        rec = Recommendation(**rec_data)
                        self.db.add(rec)
                        
                        # Generate alert for critical/high findings
                        if finding.severity in ("critical", "high"):
                            alert = Alert(
                                alert_id=f"alt-{uuid.uuid4().hex[:8]}",
                                resource_id=res.resource_id,
                                title=f"Waste Alert: {res.name} ({finding.category})",
                                message=finding.explanation,
                                severity=finding.severity,
                                alert_type="waste_increase" if finding.severity == "critical" else "idle_detected",
                                created_at=datetime.datetime.utcnow()
                            )
                            self.db.add(alert)

                        findings_count += 1
                        recommendations_count += 1
                        total_potential_savings += finding.estimated_monthly_savings

                # Update resource optimization status
                if res_findings:
                    severities = [f["severity"] for f in res_findings]
                    if "critical" in severities:
                        res.optimization_status = "wasteful"
                    elif "high" in severities or "medium" in severities:
                        res.optimization_status = "underutilized"
                    else:
                        res.optimization_status = "warning"
                else:
                    if res.status != "terminated":
                        res.optimization_status = "optimal"

            job.status = "completed"
            job.completed_at = datetime.datetime.utcnow()
            job.resources_analyzed = resources_analyzed
            job.findings_generated = findings_count
            job.recommendations_generated = recommendations_count
            job.potential_savings = round(total_potential_savings, 2)
            self.db.commit()

        except Exception as e:
            self.db.rollback()
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.datetime.utcnow()
            self.db.commit()
            raise e

        return job

    def evaluate_resource(self, res: CloudResource) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        findings = []
        recommendations = []

        now = datetime.datetime.utcnow()
        metrics = self.db.query(ResourceMetric).filter(
            ResourceMetric.resource_id == res.resource_id
        ).order_by(ResourceMetric.timestamp.desc()).limit(30).all()

        metrics_count = len(metrics)
        has_sufficient_metrics = metrics_count >= self.min_metrics_count
        confidence = "High" if has_sufficient_metrics else ("Medium" if metrics_count > 0 else "Low")

        avg_cpu = sum(m.cpu_percent for m in metrics) / metrics_count if metrics_count > 0 else res.cpu_utilization
        valid_mem_metrics = [m.memory_percent for m in metrics if m.memory_percent is not None]
        avg_mem = sum(valid_mem_metrics) / len(valid_mem_metrics) if valid_mem_metrics else res.memory_utilization
        avg_net = sum(m.network_mbps for m in metrics) / metrics_count if metrics_count > 0 else res.network_utilization

        # RULE E: Unattached Storage Volumes
        if res.resource_type == "Block Storage Volumes" and (not res.is_attached or res.status == "unattached"):
            unattached_age = (now - res.last_activity).days
            if unattached_age >= self.unattached_days or not res.is_attached:
                monthly_savings = res.monthly_cost
                f_id = f"fnd-{uuid.uuid4().hex[:8]}"
                findings.append({
                    "finding_id": f_id,
                    "resource_id": res.resource_id,
                    "category": "Unattached Storage",
                    "severity": "critical" if unattached_age > 14 else "high",
                    "rule_triggered": "Rule E: Unattached Storage Volume",
                    "observed_metrics": f"Volume has been detached for {unattached_age} days. Size: {res.instance_size}.",
                    "explanation": f"EBS/Disk volume '{res.name}' is unattached from any instance, continuously accumulating storage charges without providing utility.",
                    "estimated_monthly_savings": monthly_savings,
                    "confidence_level": "High",
                    "suggested_next_step": "Take a final snapshot for archive and delete the unattached volume.",
                    "detection_timestamp": now,
                    "review_status": "new"
                })
                recommendations.append({
                    "recommendation_id": f"rec-{uuid.uuid4().hex[:8]}",
                    "resource_id": res.resource_id,
                    "title": f"Delete Unattached Storage Volume: {res.name}",
                    "suggested_action": "Snapshot and terminate unattached volume",
                    "current_configuration": f"{res.instance_size} unattached volume in {res.region}",
                    "evidence": f"Volume detached for {unattached_age} days. Zero I/O activity.",
                    "estimated_monthly_savings": monthly_savings,
                    "estimated_savings_range": f"${monthly_savings:.2f} / month (100% avoidable)",
                    "risk_level": "Low",
                    "confidence_level": "High",
                    "operational_impact": "None to running compute systems. Volume data preserved via snapshot before deletion.",
                    "required_human_approval": True,
                    "rollback_considerations": "Can be recreated instantly from snapshot if needed.",
                    "status": "New",
                    "created_at": now
                })
                return findings, recommendations

        # RULE A: Idle Virtual Machines (Avg CPU < 5% over observation window)
        if res.resource_type in ("Virtual Machines", "Containers") and res.status == "running":
            if has_sufficient_metrics and avg_cpu < self.idle_cpu_threshold:
                # If it's a dev/test instance, 100% of cost is avoidable if stopped, or 70% if scheduled
                is_dev = res.environment in ("Development", "Testing")
                avoidable_pct = 1.0 if is_dev else 0.75
                monthly_savings = round(res.monthly_cost * avoidable_pct, 2)
                
                f_id = f"fnd-{uuid.uuid4().hex[:8]}"
                findings.append({
                    "finding_id": f_id,
                    "resource_id": res.resource_id,
                    "category": "Idle Resource",
                    "severity": "critical" if is_dev else "high",
                    "rule_triggered": "Rule A: Idle Virtual Machine (<5% CPU)",
                    "observed_metrics": f"Historical avg CPU: {avg_cpu:.1f}% across {metrics_count} samples. Network: {avg_net:.2f} MB/s.",
                    "explanation": f"Instance '{res.name}' has shown near-zero CPU activity ({avg_cpu:.1f}%) consistently over the observation window.",
                    "estimated_monthly_savings": monthly_savings,
                    "confidence_level": confidence,
                    "suggested_next_step": "Stop the instance or configure auto-stop outside work hours." if is_dev else "Verify workload before decommissioning or downsizing.",
                    "detection_timestamp": now,
                    "review_status": "new"
                })
                recommendations.append({
                    "recommendation_id": f"rec-{uuid.uuid4().hex[:8]}",
                    "resource_id": res.resource_id,
                    "title": f"Stop or Schedule Idle Instance: {res.name}",
                    "suggested_action": "Stop instance during inactive periods" if is_dev else "Decommission idle instance after verification",
                    "current_configuration": f"{res.instance_size} ({res.provider} {res.region}) in {res.environment}",
                    "evidence": f"Avg CPU {avg_cpu:.1f}% (<{self.idle_cpu_threshold}%), low network traffic ({avg_net:.2f} MB/s).",
                    "estimated_monthly_savings": monthly_savings,
                    "estimated_savings_range": f"${monthly_savings:.2f} / month",
                    "risk_level": "Low" if is_dev else "Medium",
                    "confidence_level": confidence,
                    "operational_impact": "Development services suspended when stopped. Readily restartable on demand.",
                    "required_human_approval": True,
                    "rollback_considerations": "Instance state and root disk are retained. Can be restarted in 30 seconds.",
                    "status": "New",
                    "created_at": now
                })
                return findings, recommendations

        # RULE B: Underutilized Virtual Machines (Avg CPU < 20%)
        if res.resource_type in ("Virtual Machines", "Containers") and res.status == "running":
            if has_sufficient_metrics and self.idle_cpu_threshold <= avg_cpu < self.underutilized_cpu_threshold:
                # Rightsizing generally saves ~40-50% by stepping down 1-2 instance families
                monthly_savings = round(res.monthly_cost * 0.45, 2)
                f_id = f"fnd-{uuid.uuid4().hex[:8]}"
                findings.append({
                    "finding_id": f_id,
                    "resource_id": res.resource_id,
                    "category": "Underutilized Resource",
                    "severity": "medium",
                    "rule_triggered": "Rule B: Underutilized Compute (<20% CPU)",
                    "observed_metrics": f"Avg CPU: {avg_cpu:.1f}%, Peak CPU: {max((m.cpu_percent for m in metrics), default=avg_cpu):.1f}%.",
                    "explanation": f"Compute resource '{res.name}' is underutilized. CPU consumption rarely exceeds 20% of provisioned capacity.",
                    "estimated_monthly_savings": monthly_savings,
                    "confidence_level": confidence,
                    "suggested_next_step": "Downsize instance by one tier (e.g. xlarge to large) to align capacity with demand.",
                    "detection_timestamp": now,
                    "review_status": "new"
                })
                recommendations.append({
                    "recommendation_id": f"rec-{uuid.uuid4().hex[:8]}",
                    "resource_id": res.resource_id,
                    "title": f"Rightsize Underutilized Compute: {res.name}",
                    "suggested_action": "Downsize to half-size instance tier",
                    "current_configuration": f"{res.instance_size} costing ${res.monthly_cost:.2f}/mo",
                    "evidence": f"Avg CPU {avg_cpu:.1f}% consistently below {self.underutilized_cpu_threshold}% over observation window.",
                    "estimated_monthly_savings": monthly_savings,
                    "estimated_savings_range": f"${monthly_savings * 0.8:.2f} - ${monthly_savings * 1.2:.2f} / month",
                    "risk_level": "Medium",
                    "confidence_level": confidence,
                    "operational_impact": "Requires a brief reboot window (<2 minutes) to resize instance type.",
                    "required_human_approval": True,
                    "rollback_considerations": "Can be resized back to current instance type immediately if workload spikes.",
                    "status": "New",
                    "created_at": now
                })
                return findings, recommendations

        # RULE C: Low Memory Utilization (Only when reliable memory metrics are present)
        if res.resource_type in ("Virtual Machines", "Managed Databases") and res.status == "running":
            if valid_mem_metrics and len(valid_mem_metrics) >= self.min_metrics_count and avg_mem < self.low_mem_threshold:
                monthly_savings = round(res.monthly_cost * 0.35, 2)
                f_id = f"fnd-{uuid.uuid4().hex[:8]}"
                findings.append({
                    "finding_id": f_id,
                    "resource_id": res.resource_id,
                    "category": "Low Memory Utilization",
                    "severity": "medium",
                    "rule_triggered": "Rule C: Low Memory Utilization (<25%)",
                    "observed_metrics": f"Avg Memory: {avg_mem:.1f}% across {len(valid_mem_metrics)} telemetry samples.",
                    "explanation": f"Resource '{res.name}' has memory-optimized allocation but actively uses only {avg_mem:.1f}% of memory.",
                    "estimated_monthly_savings": monthly_savings,
                    "confidence_level": "High",
                    "suggested_next_step": "Switch from memory-optimized (e.g. r-family) to general-purpose (e.g. m or t-family).",
                    "detection_timestamp": now,
                    "review_status": "new"
                })
                recommendations.append({
                    "recommendation_id": f"rec-{uuid.uuid4().hex[:8]}",
                    "resource_id": res.resource_id,
                    "title": f"Rebalance Memory Allocation: {res.name}",
                    "suggested_action": "Switch to general purpose instance family",
                    "current_configuration": f"{res.instance_size} with avg memory usage {avg_mem:.1f}%",
                    "evidence": f"Consistent low memory demand ({avg_mem:.1f}%) observed via CloudWatch/agent metrics.",
                    "estimated_monthly_savings": monthly_savings,
                    "estimated_savings_range": f"${monthly_savings:.2f} / month",
                    "risk_level": "Low",
                    "confidence_level": "High",
                    "operational_impact": "Requires scheduled maintenance window for instance type change.",
                    "required_human_approval": True,
                    "rollback_considerations": "Standard instance type change rollback supported.",
                    "status": "New",
                    "created_at": now
                })
                return findings, recommendations

        # RULE F: Oversized Databases
        if res.resource_type == "Managed Databases" and res.status == "running":
            if avg_cpu < 15.0 and (avg_mem is None or avg_mem < 30.0):
                monthly_savings = round(res.monthly_cost * 0.40, 2)
                f_id = f"fnd-{uuid.uuid4().hex[:8]}"
                findings.append({
                    "finding_id": f_id,
                    "resource_id": res.resource_id,
                    "category": "Oversized Database",
                    "severity": "high" if res.monthly_cost > 200 else "medium",
                    "rule_triggered": "Rule F: Oversized Managed Database",
                    "observed_metrics": f"Avg CPU: {avg_cpu:.1f}%, Memory: {avg_mem or 'N/A'}%. Size: {res.instance_size}.",
                    "explanation": f"Database '{res.name}' has low CPU and connection utilization relative to its provisioned tier.",
                    "estimated_monthly_savings": monthly_savings,
                    "confidence_level": confidence,
                    "suggested_next_step": "Evaluate downsizing database instance or migrating to serverless/burstable tier.",
                    "detection_timestamp": now,
                    "review_status": "new"
                })
                recommendations.append({
                    "recommendation_id": f"rec-{uuid.uuid4().hex[:8]}",
                    "resource_id": res.resource_id,
                    "title": f"Downsize Database Instance: {res.name}",
                    "suggested_action": "Scale down database instance tier",
                    "current_configuration": f"{res.instance_size} (${res.monthly_cost:.2f}/mo) in {res.environment}",
                    "evidence": f"Sustained CPU < 15% ({avg_cpu:.1f}%) and low connection load.",
                    "estimated_monthly_savings": monthly_savings,
                    "estimated_savings_range": f"${monthly_savings:.2f} / month",
                    "risk_level": "Medium",
                    "confidence_level": confidence,
                    "operational_impact": "Multi-AZ failover takes ~60-120 seconds during modification window.",
                    "required_human_approval": True,
                    "rollback_considerations": "Automated snapshot taken before instance class change; can scale back up.",
                    "status": "New",
                    "created_at": now
                })
                return findings, recommendations

        # RULE G: Low-traffic Load Balancers
        if res.resource_type == "Load Balancers" and res.status == "running":
            if avg_net < self.low_traffic_mbps:
                monthly_savings = res.monthly_cost
                f_id = f"fnd-{uuid.uuid4().hex[:8]}"
                findings.append({
                    "finding_id": f_id,
                    "resource_id": res.resource_id,
                    "category": "Low-Traffic Load Balancer",
                    "severity": "medium",
                    "rule_triggered": "Rule G: Inactive Load Balancer (<0.5 MB/s)",
                    "observed_metrics": f"Average traffic throughput: {avg_net:.3f} MB/s (< {self.low_traffic_mbps} MB/s threshold).",
                    "explanation": f"Load Balancer '{res.name}' handles negligible traffic, incurring baseline hourly charges without active target routing.",
                    "estimated_monthly_savings": monthly_savings,
                    "confidence_level": confidence,
                    "suggested_next_step": "Consolidate routing or decommission inactive load balancer.",
                    "detection_timestamp": now,
                    "review_status": "new"
                })
                recommendations.append({
                    "recommendation_id": f"rec-{uuid.uuid4().hex[:8]}",
                    "resource_id": res.resource_id,
                    "title": f"Decommission Inactive Load Balancer: {res.name}",
                    "suggested_action": "Remove unused load balancer",
                    "current_configuration": f"{res.name} ({res.provider} {res.region})",
                    "evidence": f"Traffic averaging {avg_net:.3f} MB/s over observation period.",
                    "estimated_monthly_savings": monthly_savings,
                    "estimated_savings_range": f"${monthly_savings:.2f} / month",
                    "risk_level": "Medium",
                    "confidence_level": confidence,
                    "operational_impact": "Verify no legacy DNS records point to this endpoint before deletion.",
                    "required_human_approval": True,
                    "rollback_considerations": "Re-provisioning requires recreating target groups and listener rules.",
                    "status": "New",
                    "created_at": now
                })
                return findings, recommendations

        # RULE H: Stale Resources (No activity for configurable period)
        stale_days_elapsed = (now - res.last_activity).days
        if stale_days_elapsed >= self.stale_days and res.status != "terminated":
            monthly_savings = res.monthly_cost
            f_id = f"fnd-{uuid.uuid4().hex[:8]}"
            findings.append({
                "finding_id": f_id,
                "resource_id": res.resource_id,
                "category": "Stale Resource",
                "severity": "high",
                "rule_triggered": "Rule H: Stale Resource (No Activity > 14 days)",
                "observed_metrics": f"Last activity was {stale_days_elapsed} days ago ({res.last_activity.strftime('%Y-%m-%d')}).",
                "explanation": f"Resource '{res.name}' has had no meaningful activity or updates for {stale_days_elapsed} days.",
                "estimated_monthly_savings": monthly_savings,
                "confidence_level": "High",
                "suggested_next_step": "Confirm with resource owner and decommission if abandoned.",
                "detection_timestamp": now,
                "review_status": "new"
            })
            recommendations.append({
                "recommendation_id": f"rec-{uuid.uuid4().hex[:8]}",
                "resource_id": res.resource_id,
                "title": f"Decommission Stale Resource: {res.name}",
                "suggested_action": "Archive and terminate stale resource",
                "current_configuration": f"{res.resource_type} ({res.instance_size}) in {res.environment}",
                "evidence": f"Zero activity since {res.last_activity.strftime('%Y-%m-%d')} ({stale_days_elapsed} days).",
                "estimated_monthly_savings": monthly_savings,
                "estimated_savings_range": f"${monthly_savings:.2f} / month",
                "risk_level": "Low" if res.environment != "Production" else "High",
                "confidence_level": "High",
                "operational_impact": "Decommissioning will release cloud capacity. Backups recommended.",
                "required_human_approval": True,
                "rollback_considerations": "Create snapshot/backup before termination.",
                "status": "New",
                "created_at": now
            })

        return findings, recommendations
