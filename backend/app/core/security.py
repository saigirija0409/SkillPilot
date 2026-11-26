from functools import lru_cache
from typing import Optional
from uuid import UUID

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.supabase_service import create_user_supabase_client, is_supabase_configured

_ASYMMETRIC_ALGS = {"ES256", "ES384", "ES512", "RS256", "RS384", "RS512", "EdDSA"}
_bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    """Verified caller identity derived from a validated Supabase access token."""

    user_id: str
    email: Optional[str] = None
    jwt_role: str = "authenticated"
    audience: Optional[str] = None
    issuer: Optional[str] = None
    auth_method: str
    access_token: str


@lru_cache
def _get_jwk_client(jwks_url: str) -> PyJWKClient:
    """Cache JWKS public key client for asymmetric Supabase JWT verification."""
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=300)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _verify_via_supabase_auth_api(token: str, issuer: str) -> AuthenticatedUser:
    """Fallback cryptographic/session verification via Supabase Auth /user endpoint."""
    settings = get_settings()
    try:
        response = httpx.get(
            f"{issuer}/user",
            headers={
                "apikey": settings.supabase_publishable_key.strip(),
                "Authorization": f"Bearer {token}",
            },
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable",
        ) from exc

    if response.status_code != 200:
        raise _unauthorized("Invalid or expired Supabase access token")

    data = response.json()
    user_id = str(data.get("id", ""))
    try:
        UUID(user_id)
    except ValueError as exc:
        raise _unauthorized("Invalid authenticated user identifier") from exc

    return AuthenticatedUser(
        user_id=user_id,
        email=data.get("email"),
        jwt_role=data.get("role") or "authenticated",
        audience=data.get("aud"),
        issuer=issuer,
        auth_method="supabase_auth_api",
        access_token=token,
    )


def verify_supabase_access_token(token: str) -> AuthenticatedUser:
    """Cryptographically verify a Supabase JWT and validate claims (exp, iss, aud, sub)."""
    if not is_supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication is not configured on backend",
        )

    settings = get_settings()
    base_url = settings.supabase_url.strip().rstrip("/")
    expected_issuer = f"{base_url}/auth/v1"

    try:
        header = jwt.get_unverified_header(token)
    except InvalidTokenError as exc:
        raise _unauthorized("Malformed access token") from exc

    alg = header.get("alg")
    if alg in _ASYMMETRIC_ALGS:
        jwks_url = f"{expected_issuer}/.well-known/jwks.json"
        try:
            jwk_client = _get_jwk_client(jwks_url)
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
                issuer=expected_issuer,
                options={"require": ["exp", "sub", "iss", "aud"]},
            )
        except InvalidTokenError as exc:
            raise _unauthorized("Invalid, expired, or untrusted access token") from exc
        except Exception as exc:
            raise _unauthorized("Unable to verify access token signature") from exc

        sub = str(payload.get("sub", ""))
        try:
            UUID(sub)
        except ValueError as exc:
            raise _unauthorized("Token subject is not a valid UUID") from exc

        aud_claim = payload.get("aud")
        aud_str = aud_claim[0] if isinstance(aud_claim, list) and aud_claim else str(aud_claim)

        return AuthenticatedUser(
            user_id=sub,
            email=payload.get("email"),
            jwt_role=str(payload.get("role", "authenticated")),
            audience=aud_str,
            issuer=str(payload.get("iss", expected_issuer)),
            auth_method=f"jwks_{alg}",
            access_token=token,
        )

    if alg == "HS256":
        return _verify_via_supabase_auth_api(token, expected_issuer)

    raise _unauthorized("Unsupported token signing algorithm")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> AuthenticatedUser:
    """FastAPI dependency returning the verified authenticated Supabase user."""
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise _unauthorized("Missing Bearer access token")
    return verify_supabase_access_token(credentials.credentials.strip())


def require_manager_role(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """FastAPI dependency enforcing manager/admin privileges via RLS-scoped profile lookup."""
    client = create_user_supabase_client(user.access_token)
    response = (
        client.table("profiles")
        .select("account_type, organization_id")
        .eq("id", user.user_id)
        .maybe_single()
        .execute()
    )
    profile = response.data if response else None
    if not profile or profile.get("account_type") not in {"manager", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager privileges are required for this endpoint",
        )
    return user
