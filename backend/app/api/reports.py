from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.report_service import ReportService
from app.schemas.report import ReportSummaryResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary", response_model=ReportSummaryResponse)
def get_report_summary(db: Session = Depends(get_db)):
    return ReportService.generate_summary_report(db)

@router.get("/export")
def export_report_csv(db: Session = Depends(get_db)):
    csv_data = ReportService.export_report_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cloud_waste_report.csv"}
    )
