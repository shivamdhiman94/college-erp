from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.db.init_db import init_db
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup
    Base.metadata.create_all(bind=engine)
    # Seed initial superadmin if none exists
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Set up CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error_code": "VALIDATION_ERROR",
            "message": "Invalid request payload or parameters",
            "details": exc.errors()
        }
    )


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "docs_url": f"{settings.API_V1_STR}/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe for load balancer health checking."""
    return {"status": "healthy"}


@app.get("/health/ready", tags=["Health"])
def readiness_check():
    """Readiness probe that tests live database connectivity."""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "dialect": engine.dialect.name,
            "environment": settings.ENVIRONMENT,
        }
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(exc),
            }
        )


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
