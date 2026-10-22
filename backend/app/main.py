import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.services.simulator_service import SimulatorService
from app.services.waste_engine import WasteDetectionEngine

# Import all API routers
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.resources import router as resources_router
from app.api.metrics import router as metrics_router
from app.api.analysis import router as analysis_router
from app.api.recommendations import router as recommendations_router
from app.api.alerts import router as alerts_router
from app.api.reports import router as reports_router
from app.api.settings import router as settings_router
from app.api.system import router as system_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Initialize demo admin user and realistic sample resources if database is empty
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@cloudwise.io").first()
        if not admin_user:
            logger.info("Creating default demo admin account (admin@cloudwise.io)...")
            admin_user = User(
                email="admin@cloudwise.io",
                hashed_password=hash_password("DemoAdmin123!"),
                full_name="CloudWise Demo Administrator",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()

        # Seed sample resources and time-series metrics if not present
        logger.info("Checking demo cloud resources...")
        seed_result = SimulatorService.seed_demo_data(db, force_reset=False)
        logger.info(f"Seed status: {seed_result}")

        # Run waste detection engine
        engine_runner = WasteDetectionEngine(db)
        job = engine_runner.run_analysis()
        logger.info(f"Initial waste detection run completed: {job.job_id}, {job.findings_generated} findings generated.")
    except Exception as e:
        logger.error(f"Error during application startup initialization: {str(e)}")
    finally:
        db.close()

    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Cloud Resource Waste Detector & Cost Optimization Engine REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again or inspect server logs."}
    )

# Include API routers under /api and /api/v1
for prefix in ("/api", "/api/v1"):
    app.include_router(system_router, prefix=prefix)
    app.include_router(auth_router, prefix=prefix)
    app.include_router(dashboard_router, prefix=prefix)
    app.include_router(resources_router, prefix=prefix)
    app.include_router(metrics_router, prefix=prefix)
    app.include_router(analysis_router, prefix=prefix)
    app.include_router(recommendations_router, prefix=prefix)
    app.include_router(alerts_router, prefix=prefix)
    app.include_router(reports_router, prefix=prefix)
    app.include_router(settings_router, prefix=prefix)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health"
    }
