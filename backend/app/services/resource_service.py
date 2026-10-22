import csv
import io
import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.resource import CloudResource
from app.models.metric import ResourceMetric
from app.schemas.resource import ResourceCreate, ResourceUpdate
from app.core.config import settings

class ResourceService:
    @staticmethod
    def get_resources(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        provider: Optional[str] = None,
        resource_type: Optional[str] = None,
        environment: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "monthly_cost",
        sort_desc: bool = True
    ) -> Tuple[List[CloudResource], int]:
        query = db.query(CloudResource)

        if provider and provider != "all":
            query = query.filter(CloudResource.provider == provider)
        if resource_type and resource_type != "all":
            query = query.filter(CloudResource.resource_type == resource_type)
        if environment and environment != "all":
            query = query.filter(CloudResource.environment == environment)
        if status and status != "all":
            query = query.filter(CloudResource.status == status)
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    CloudResource.name.ilike(search_fmt),
                    CloudResource.resource_id.ilike(search_fmt),
                    CloudResource.region.ilike(search_fmt),
                    CloudResource.instance_size.ilike(search_fmt)
                )
            )

        total = query.count()

        sort_col = getattr(CloudResource, sort_by, CloudResource.monthly_cost)
        if sort_desc:
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        items = query.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_by_resource_id(db: Session, resource_id: str) -> Optional[CloudResource]:
        return db.query(CloudResource).filter(CloudResource.resource_id == resource_id).first()

    @staticmethod
    def create_resource(db: Session, resource_in: ResourceCreate) -> CloudResource:
        monthly_cost = round(resource_in.hourly_cost * settings.MONTHLY_BILLABLE_HOURS, 2)
        db_resource = CloudResource(
            resource_id=resource_in.resource_id,
            name=resource_in.name,
            provider=resource_in.provider,
            region=resource_in.region,
            resource_type=resource_in.resource_type,
            environment=resource_in.environment,
            instance_size=resource_in.instance_size,
            cpu_utilization=resource_in.cpu_utilization,
            memory_utilization=resource_in.memory_utilization,
            network_utilization=resource_in.network_utilization,
            storage_utilization=resource_in.storage_utilization,
            hourly_cost=resource_in.hourly_cost,
            monthly_cost=monthly_cost,
            status=resource_in.status,
            is_attached=resource_in.is_attached,
            source=resource_in.source or "manual",
            tags=resource_in.tags,
            created_at=datetime.datetime.utcnow(),
            last_activity=datetime.datetime.utcnow(),
            last_metrics_update=datetime.datetime.utcnow()
        )
        db.add(db_resource)
        db.commit()
        db.refresh(db_resource)
        return db_resource

    @staticmethod
    def update_resource(db: Session, db_resource: CloudResource, update_data: ResourceUpdate) -> CloudResource:
        data_dict = update_data.dict(exclude_unset=True)
        for key, value in data_dict.items():
            setattr(db_resource, key, value)
        
        if "hourly_cost" in data_dict:
            db_resource.monthly_cost = round(db_resource.hourly_cost * settings.MONTHLY_BILLABLE_HOURS, 2)
            
        db_resource.last_metrics_update = datetime.datetime.utcnow()
        db.commit()
        db.refresh(db_resource)
        return db_resource

    @staticmethod
    def delete_resource(db: Session, db_resource: CloudResource) -> bool:
        db.delete(db_resource)
        db.commit()
        return True

    @staticmethod
    def export_csv(db: Session) -> str:
        resources = db.query(CloudResource).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Resource ID", "Name", "Provider", "Region", "Type", "Environment",
            "Size", "CPU (%)", "Memory (%)", "Hourly Cost ($)", "Monthly Cost ($)",
            "Status", "Optimization Status", "Source", "Last Activity"
        ])
        for r in resources:
            writer.writerow([
                r.resource_id, r.name, r.provider, r.region, r.resource_type, r.environment,
                r.instance_size, r.cpu_utilization, r.memory_utilization or "N/A",
                r.hourly_cost, r.monthly_cost, r.status, r.optimization_status, r.source,
                r.last_activity.isoformat()
            ])
        return output.getvalue()

    @staticmethod
    def import_csv_metrics(db: Session, csv_content: str) -> Dict[str, Any]:
        """
        Import resource metrics from CSV with header:
        resource_id,cpu_percent,memory_percent,network_mbps,storage_gb
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        processed = 0
        errors = 0
        for row in reader:
            try:
                res_id = row.get("resource_id", "").strip()
                if not res_id:
                    continue
                res = db.query(CloudResource).filter(CloudResource.resource_id == res_id).first()
                if not res:
                    errors += 1
                    continue
                
                cpu = float(row.get("cpu_percent", 0.0))
                mem = float(row.get("memory_percent")) if row.get("memory_percent") and row.get("memory_percent") != "N/A" else None
                net = float(row.get("network_mbps", 0.0))
                stor = float(row.get("storage_gb")) if row.get("storage_gb") and row.get("storage_gb") != "N/A" else None

                metric = ResourceMetric(
                    resource_id=res_id,
                    timestamp=datetime.datetime.utcnow(),
                    cpu_percent=cpu,
                    memory_percent=mem,
                    network_mbps=net,
                    storage_gb=stor,
                    metrics_source="csv_import"
                )
                db.add(metric)
                
                # Update current state on resource
                res.cpu_utilization = cpu
                if mem is not None:
                    res.memory_utilization = mem
                res.network_utilization = net
                if stor is not None:
                    res.storage_utilization = stor
                res.last_metrics_update = datetime.datetime.utcnow()
                processed += 1
            except Exception:
                errors += 1
        db.commit()
        return {"processed": processed, "errors": errors}
