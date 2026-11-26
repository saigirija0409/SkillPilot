from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.health import HealthIntegrations, HealthResponse
from app.services.gemini_service import get_gemini_status
from app.services.supabase_service import get_supabase_status

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Return backend liveness and safe integration configuration status."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="skillpilot-backend",
        version=settings.app_version,
        environment=settings.app_env,
        timestamp=datetime.now(timezone.utc).isoformat(),
        integrations=HealthIntegrations(
            supabase=get_supabase_status(),
            gemini=get_gemini_status(),
        ),
    )
