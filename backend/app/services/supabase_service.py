from functools import lru_cache
from typing import Optional

from supabase import Client, ClientOptions, create_client

from app.core.config import get_settings
from app.schemas.health import IntegrationStatus

_PLACEHOLDER_URLS = {"", "https://your-project-ref.supabase.co"}
_PLACEHOLDER_KEYS = {"", "your-supabase-publishable-key"}


def is_supabase_configured() -> bool:
    """Return True if Supabase URL and publishable key are configured."""
    settings = get_settings()
    url_ok = settings.supabase_url.strip() not in _PLACEHOLDER_URLS
    key_ok = settings.supabase_publishable_key.strip() not in _PLACEHOLDER_KEYS
    return url_ok and key_ok


@lru_cache
def get_supabase_client() -> Optional[Client]:
    """Create and return an unauthenticated anon/publishable Supabase client."""
    if not is_supabase_configured():
        return None
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_publishable_key)


def create_user_supabase_client(access_token: str) -> Client:
    """Create a fresh, request-scoped Supabase client enforcing RLS as the caller."""
    if not is_supabase_configured():
        raise RuntimeError("Supabase is not configured in backend/.env")
    settings = get_settings()
    options = ClientOptions(
        headers={"Authorization": f"Bearer {access_token}"},
        persist_session=False,
        auto_refresh_token=False,
    )
    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=options,
    )


def get_supabase_status() -> IntegrationStatus:
    """Return safe configuration status for the Supabase integration."""
    if is_supabase_configured():
        return IntegrationStatus(
            configured=True,
            detail="Supabase URL and publishable key configured",
        )
    return IntegrationStatus(
        configured=False,
        detail="Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in backend/.env",
    )
