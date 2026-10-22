from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter(prefix="/mock-targets", tags=["Mock Targets Simulation"])

class MockTargetResponse(BaseModel):
    status: str
    code: int
    message: str

@router.get("/healthy", response_model=MockTargetResponse)
@router.post("/healthy", response_model=MockTargetResponse)
def mock_target_healthy():
    return {
        "status": "healthy",
        "code": 200,
        "message": "Mock target is healthy and responding"
    }

@router.get("/error")
@router.post("/error")
def mock_target_error():
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Simulated mock target error"
    )

@router.get("/unhealthy")
@router.post("/unhealthy")
def mock_target_unhealthy():
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Simulated mock target unhealthy"
    )
