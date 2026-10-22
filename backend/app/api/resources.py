from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.resource_service import ResourceService
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse, ResourceListResponse

router = APIRouter(prefix="/resources", tags=["Cloud Resources"])

@router.get("", response_model=ResourceListResponse)
def list_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    provider: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("monthly_cost"),
    sort_desc: bool = Query(True),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * page_size
    items, total = ResourceService.get_resources(
        db=db,
        skip=skip,
        limit=page_size,
        provider=provider,
        resource_type=resource_type,
        environment=environment,
        status=status,
        search=search,
        sort_by=sort_by,
        sort_desc=sort_desc
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/export/csv")
def export_resources_csv(db: Session = Depends(get_db)):
    csv_data = ResourceService.export_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cloud_resources_inventory.csv"}
    )

@router.post("/import/csv")
async def import_resources_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    result = ResourceService.import_csv_metrics(db, decoded)
    return result

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(resource_id: str, db: Session = Depends(get_db)):
    resource = ResourceService.get_by_resource_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Cloud resource not found")
    return resource

@router.post("", response_model=ResourceResponse)
def create_resource(resource_in: ResourceCreate, db: Session = Depends(get_db)):
    existing = ResourceService.get_by_resource_id(db, resource_in.resource_id)
    if existing:
        raise HTTPException(status_code=400, detail="Resource ID already exists")
    return ResourceService.create_resource(db, resource_in)

@router.patch("/{resource_id}", response_model=ResourceResponse)
def update_resource(resource_id: str, update_in: ResourceUpdate, db: Session = Depends(get_db)):
    resource = ResourceService.get_by_resource_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Cloud resource not found")
    return ResourceService.update_resource(db, resource, update_in)

@router.delete("/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(get_db)):
    resource = ResourceService.get_by_resource_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Cloud resource not found")
    ResourceService.delete_resource(db, resource)
    return {"status": "success", "message": f"Resource {resource_id} deleted successfully."}
