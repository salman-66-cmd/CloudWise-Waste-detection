import random
import datetime
import math
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.resource import CloudResource
from app.models.metric import ResourceMetric
from app.core.config import settings

SAMPLE_RESOURCES = [
    {
        "resource_id": "i-0a1b2c3d4e001",
        "name": "dev-api-microservice",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Virtual Machines",
        "environment": "Development",
        "instance_size": "t3.xlarge",
        "hourly_cost": 0.1664,
        "status": "running",
        "is_attached": True,
        "pattern": "idle",  # consistently < 5% CPU
        "last_activity_days_ago": 2
    },
    {
        "resource_id": "i-0fe98dcba2002",
        "name": "staging-worker-node-01",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Virtual Machines",
        "environment": "Staging",
        "instance_size": "c5.2xlarge",
        "hourly_cost": 0.34,
        "status": "running",
        "is_attached": True,
        "pattern": "underutilized",  # 10-18% CPU
        "last_activity_days_ago": 1
    },
    {
        "resource_id": "vol-0123456789abc003",
        "name": "backup-volume-temp-2026",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Block Storage Volumes",
        "environment": "Development",
        "instance_size": "500 GB gp3",
        "hourly_cost": 0.055,
        "status": "unattached",
        "is_attached": False,
        "pattern": "zero",
        "last_activity_days_ago": 22
    },
    {
        "resource_id": "db-analytics-pg-replica",
        "name": "analytics-dw-postgres",
        "provider": "AWS",
        "region": "us-west-2",
        "resource_type": "Managed Databases",
        "environment": "Staging",
        "instance_size": "db.r5.2xlarge",
        "hourly_cost": 0.96,
        "status": "running",
        "is_attached": True,
        "pattern": "low_db",  # 6% CPU, 18% memory
        "last_activity_days_ago": 3
    },
    {
        "resource_id": "alb-internal-legacy-005",
        "name": "legacy-auth-internal-alb",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Load Balancers",
        "environment": "Development",
        "instance_size": "Application Load Balancer",
        "hourly_cost": 0.035,
        "status": "running",
        "is_attached": True,
        "pattern": "low_lb",  # 0.02 MB/s
        "last_activity_days_ago": 19
    },
    {
        "resource_id": "i-0987654321fed006",
        "name": "prod-checkout-service",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Virtual Machines",
        "environment": "Production",
        "instance_size": "m5.2xlarge",
        "hourly_cost": 0.384,
        "status": "running",
        "is_attached": True,
        "pattern": "healthy_prod",  # 65-80% CPU
        "last_activity_days_ago": 0
    },
    {
        "resource_id": "cnt-prod-k8s-ingress-007",
        "name": "k8s-edge-ingress-gateway",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Containers",
        "environment": "Production",
        "instance_size": "2 vCPU / 4 GB",
        "hourly_cost": 0.096,
        "status": "running",
        "is_attached": True,
        "pattern": "healthy_prod",
        "last_activity_days_ago": 0
    },
    {
        "resource_id": "s3-audit-archive-bucket-008",
        "name": "enterprise-compliance-logs-glacier",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Object Storage",
        "environment": "Production",
        "instance_size": "2.4 TB Standard-IA",
        "hourly_cost": 0.03,
        "status": "running",
        "is_attached": True,
        "pattern": "storage",
        "last_activity_days_ago": 0
    },
    {
        "resource_id": "i-0staleqa-instance-009",
        "name": "qa-test-regression-cluster",
        "provider": "AWS",
        "region": "eu-west-1",
        "resource_type": "Virtual Machines",
        "environment": "Testing",
        "instance_size": "t3.2xlarge",
        "hourly_cost": 0.3328,
        "status": "running",
        "is_attached": True,
        "pattern": "idle",
        "last_activity_days_ago": 26
    },
    {
        "resource_id": "gcp-compute-ml-eval-010",
        "name": "ml-inference-dev-pod",
        "provider": "GCP",
        "region": "us-central1",
        "resource_type": "Virtual Machines",
        "environment": "Development",
        "instance_size": "n2-standard-4",
        "hourly_cost": 0.194,
        "status": "running",
        "is_attached": True,
        "pattern": "underutilized",
        "last_activity_days_ago": 4
    }
]

class SimulatorService:
    @staticmethod
    def seed_demo_data(db: Session, force_reset: bool = False) -> Dict[str, Any]:
        """
        Populate realistic cloud resources and historical time-series metrics.
        """
        existing_count = db.query(CloudResource).count()
        if existing_count > 0 and not force_reset:
            return {"status": "skipped", "message": "Demo data already exists", "count": existing_count}

        if force_reset:
            from app.models.finding import WasteFinding
            from app.models.recommendation import Recommendation
            from app.models.alert import Alert
            db.query(Alert).delete()
            db.query(Recommendation).delete()
            db.query(WasteFinding).delete()
            db.query(ResourceMetric).delete()
            db.query(CloudResource).delete()
            db.commit()

        now = datetime.datetime.utcnow()
        created_resources = []

        # Create resources
        for item in SAMPLE_RESOURCES:
            monthly_cost = round(item["hourly_cost"] * settings.MONTHLY_BILLABLE_HOURS, 2)
            last_activity = now - datetime.timedelta(days=item["last_activity_days_ago"])
            
            # Initial utilization values based on pattern
            cpu = 2.4 if item["pattern"] == "idle" else (14.2 if item["pattern"] == "underutilized" else (72.5 if item["pattern"] == "healthy_prod" else (7.1 if item["pattern"] == "low_db" else 0.0)))
            mem = 18.0 if item["pattern"] == "idle" else (22.5 if item["pattern"] == "underutilized" else (68.0 if item["pattern"] == "healthy_prod" else (21.0 if item["pattern"] == "low_db" else None)))
            net = 0.02 if item["pattern"] in ("idle", "low_lb") else (0.85 if item["pattern"] == "underutilized" else 14.5)

            resource = CloudResource(
                resource_id=item["resource_id"],
                name=item["name"],
                provider=item["provider"],
                region=item["region"],
                resource_type=item["resource_type"],
                environment=item["environment"],
                instance_size=item["instance_size"],
                cpu_utilization=cpu,
                memory_utilization=mem,
                network_utilization=net,
                storage_utilization=500.0 if "Storage" in item["resource_type"] else None,
                hourly_cost=item["hourly_cost"],
                monthly_cost=monthly_cost,
                status=item["status"],
                is_attached=item["is_attached"],
                optimization_status="warning" if item["pattern"] in ("idle", "underutilized", "zero", "low_db", "low_lb") else "optimal",
                source="simulated",
                created_at=now - datetime.timedelta(days=60),
                last_activity=last_activity,
                last_metrics_update=now
            )
            db.add(resource)
            created_resources.append((resource, item["pattern"]))

        db.commit()

        # Generate 7 days of realistic time-series metrics (every 6 hours = 28 data points per resource)
        metrics_to_add = []
        for resource, pattern in created_resources:
            for step in range(28):
                ts = now - datetime.timedelta(hours=(28 - step) * 6)
                hour_of_day = ts.hour
                # Add diurnal wave pattern
                wave = math.sin((hour_of_day / 24.0) * 2 * math.pi)

                if pattern == "idle":
                    cpu_val = max(0.5, round(2.0 + 1.2 * wave + random.uniform(-0.4, 0.5), 1))
                    mem_val = max(10.0, round(18.0 + random.uniform(-1.0, 1.0), 1))
                    net_val = max(0.01, round(0.02 + random.uniform(0.0, 0.01), 3))
                elif pattern == "underutilized":
                    cpu_val = max(4.0, round(13.0 + 3.5 * wave + random.uniform(-1.5, 1.5), 1))
                    mem_val = max(15.0, round(22.0 + 2.0 * wave + random.uniform(-1.0, 1.0), 1))
                    net_val = max(0.1, round(0.8 + 0.3 * wave, 2))
                elif pattern == "healthy_prod":
                    cpu_val = min(92.0, max(45.0, round(68.0 + 12.0 * wave + random.uniform(-4.0, 4.0), 1)))
                    mem_val = round(70.0 + 4.0 * wave + random.uniform(-2.0, 2.0), 1)
                    net_val = max(5.0, round(16.0 + 5.0 * wave, 2))
                elif pattern == "low_db":
                    cpu_val = max(2.0, round(7.0 + 2.0 * wave + random.uniform(-1.0, 1.0), 1))
                    mem_val = round(21.0 + random.uniform(-1.0, 1.0), 1)
                    net_val = max(0.1, round(0.4 + 0.2 * wave, 2))
                elif pattern == "low_lb":
                    cpu_val = 0.0
                    mem_val = None
                    net_val = max(0.01, round(0.03 + random.uniform(0.0, 0.02), 3))
                else:  # storage / unattached
                    cpu_val = 0.0
                    mem_val = None
                    net_val = 0.0

                m = ResourceMetric(
                    resource_id=resource.resource_id,
                    timestamp=ts,
                    cpu_percent=cpu_val,
                    memory_percent=mem_val,
                    network_mbps=net_val,
                    storage_gb=resource.storage_utilization,
                    metrics_source="simulated"
                )
                metrics_to_add.append(m)

        db.bulk_save_objects(metrics_to_add)
        db.commit()

        return {
            "status": "success",
            "message": f"Successfully initialized {len(created_resources)} simulated resources and {len(metrics_to_add)} metric records.",
            "resources_count": len(created_resources),
            "metrics_count": len(metrics_to_add)
        }
