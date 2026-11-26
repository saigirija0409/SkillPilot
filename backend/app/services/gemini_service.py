from functools import lru_cache
from typing import Optional

from google import genai

from app.core.config import get_settings
from app.schemas.health import IntegrationStatus

_PLACEHOLDER_KEYS = {"", "your-gemini-api-key"}


def is_gemini_configured() -> bool:
    """Return True if a non-placeholder Gemini API key is present."""
    settings = get_settings()
    return settings.gemini_api_key.strip() not in _PLACEHOLDER_KEYS


@lru_cache
def get_gemini_client() -> Optional[genai.Client]:
    """Initialize and return a server-side Gemini API client if configured."""
    if not is_gemini_configured():
        return None
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)


def get_gemini_status() -> IntegrationStatus:
    """Return safe configuration status for the Gemini integration."""
    settings = get_settings()
    if is_gemini_configured():
        return IntegrationStatus(
            configured=True,
            detail=f"Configured (model: {settings.gemini_model})",
        )
    return IntegrationStatus(
        configured=False,
        detail="Missing GEMINI_API_KEY in backend/.env",
    )
