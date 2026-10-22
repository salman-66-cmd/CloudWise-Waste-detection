from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import datetime

class ReportSummaryResponse(BaseModel):
    generated_at: datetime.datetime
    total_resources: int
    total_monthly_spend: float
    total_potential_monthly_savings: float
    total_potential_annual_savings: float
    optimization_score: float
    
    findings_by_severity: Dict[str, int]
    findings_by_category: Dict[str, int]
    provider_breakdown: List[Dict[str, Any]]
    environment_breakdown: List[Dict[str, Any]]
    recommendations_summary: List[Dict[str, Any]]
