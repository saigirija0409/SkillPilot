from typing import Optional

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_user, require_manager_role
from app.schemas.auth import AuthenticatedUserResponse, ProfileSummary
from app.services.supabase_service import create_user_supabase_client

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthenticatedUserResponse)
def get_authenticated_me(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUserResponse:
    """Protected test endpoint validating Supabase token and fetching RLS-scoped profile."""
    profile_summary: Optional[ProfileSummary] = None
    try:
        client = create_user_supabase_client(user.access_token)
        result = (
            client.table("profiles")
            .select(
                "id, full_name, account_type, organization_id, onboarding_completed, onboarding_step"
            )
            .eq("id", user.user_id)
            .maybe_single()
            .execute()
        )
        if result and result.data:
            profile_summary = ProfileSummary(**result.data)
    except Exception:
        # Profile table may not exist until migrations are applied; token verification still succeeded.
        profile_summary = None

    return AuthenticatedUserResponse(
        authenticated=True,
        user_id=user.user_id,
        email=user.email,
        jwt_role=user.jwt_role,
        issuer=user.issuer,
        audience=user.audience,
        auth_method=user.auth_method,
        profile=profile_summary,
    )


@router.get("/manager-check")
def check_manager_access(
    user: AuthenticatedUser = Depends(require_manager_role),
) -> dict[str, str]:
    """Protected endpoint verifying server-side manager authorization."""
    return {
        "status": "authorized",
        "user_id": user.user_id,
        "message": "Manager role verified",
    }
