from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="SkillPilot — Agentic AI-Powered Upskilling and Workforce Intelligence Platform API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(health_router)


@app.get("/")
def root() -> dict[str, str]:
    """Basic root endpoint redirecting callers to health and API docs."""
    return {
        "message": "SkillPilot Backend API is running",
        "health": "/api/v1/health",
        "docs": "/docs",
    }
