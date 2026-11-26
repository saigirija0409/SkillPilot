from pydantic import BaseModel


class IntegrationStatus(BaseModel):
    """Status summary for an external integration without leaking secrets."""

    configured: bool
    detail: str


class HealthIntegrations(BaseModel):
    """Readiness status for core platform integrations."""

    supabase: IntegrationStatus
    gemini: IntegrationStatus


class HealthResponse(BaseModel):
    """Response model for backend health-check endpoint."""

    status: str
    service: str
    version: str
    environment: str
    timestamp: str
    integrations: HealthIntegrations
