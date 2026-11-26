from typing import Optional

from pydantic import BaseModel


class ProfileSummary(BaseModel):
    """Safe user profile summary fetched through RLS-enforced Supabase client."""

    id: str
    full_name: str
    account_type: str
    organization_id: Optional[str] = None
    onboarding_completed: bool
    onboarding_step: int


class AuthenticatedUserResponse(BaseModel):
    """Response for the protected /api/v1/auth/me endpoint (excludes tokens/secrets)."""

    authenticated: bool
    user_id: str
    email: Optional[str] = None
    jwt_role: str
    issuer: Optional[str] = None
    audience: Optional[str] = None
    auth_method: str
    profile: Optional[ProfileSummary] = None
