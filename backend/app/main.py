from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.skills import router as skills_router
from app.api.routes.roadmaps import router as roadmaps_router
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.manager import router as manager_router
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

API_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(resumes_router, prefix=API_PREFIX)
app.include_router(skills_router, prefix=API_PREFIX)
app.include_router(roadmaps_router, prefix=API_PREFIX)
app.include_router(recommendations_router, prefix=API_PREFIX)
app.include_router(manager_router, prefix=API_PREFIX)
# Legacy unprefixed health (keep for backward compat)
app.include_router(health_router)


@app.get("/")
def root() -> dict[str, str]:
    """Basic root endpoint redirecting callers to health and API docs."""
    return {
        "message": "SkillPilot Backend API is running",
        "health": "/api/v1/health",
        "docs": "/docs",
        "version": settings.app_version,
        "endpoints": {
            "auth": "/api/v1/auth",
            "resumes": "/api/v1/resumes",
            "skills": "/api/v1/skills",
            "roadmaps": "/api/v1/roadmaps",
            "recommendations": "/api/v1/recommendations",
            "manager": "/api/v1/manager",
        },
    }
