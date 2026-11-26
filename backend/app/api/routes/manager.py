"""
Manager analytics endpoints.
GET /api/v1/manager/analytics?organization_id=<uuid>[&team_id=<uuid>]
GET /api/v1/manager/team-members
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import AuthenticatedUser, require_manager_role
from app.schemas.analytics import ManagerAnalyticsResponse
from app.services.analytics_service import compute_manager_analytics
from app.services.supabase_service import create_user_supabase_client

router = APIRouter(prefix="/manager", tags=["manager"])
logger = logging.getLogger(__name__)


@router.get("/analytics", response_model=ManagerAnalyticsResponse)
def get_manager_analytics(
    organization_id: str = Query(..., description="UUID of the organization"),
    team_id: Optional[str] = Query(None, description="Optional team UUID to filter"),
    user: AuthenticatedUser = Depends(require_manager_role),
) -> ManagerAnalyticsResponse:
    """
    Aggregate skill readiness and gap data for a manager's team.
    Requires manager or admin account_type.
    """
    client = create_user_supabase_client(user.access_token)

    # Verify manager belongs to this org
    profile_result = (
        client.table("profiles")
        .select("organization_id, account_type")
        .eq("id", user.user_id)
        .maybe_single()
        .execute()
    )
    if not profile_result or not profile_result.data:
        raise HTTPException(status_code=403, detail="Profile not found.")

    profile = profile_result.data
    if profile["organization_id"] != organization_id and profile["account_type"] != "admin":
        raise HTTPException(status_code=403, detail="You do not belong to this organization.")

    # Fetch team members
    members_query = (
        client.table("team_members")
        .select("user_id, profiles(id, full_name, email, target_role_id, career_roles(title))")
        .eq("organization_id", organization_id)
    )
    if team_id:
        members_query = members_query.eq("team_id", team_id)
    members_result = members_query.execute()
    team_rows = members_result.data or []

    # Build per-member data
    members_data = []
    for tm in team_rows:
        profile_data = tm.get("profiles", {}) or {}
        uid = profile_data.get("id") or tm.get("user_id")
        if not uid:
            continue

        # Fetch user skills
        us_result = (
            client.table("user_skills")
            .select("skill_id, proficiency, skills(name, category)")
            .eq("user_id", uid)
            .execute()
        )
        user_skills = [
            {
                "skill_id": s["skill_id"],
                "skill_name": s["skills"]["name"] if s.get("skills") else s["skill_id"],
                "category": s["skills"]["category"] if s.get("skills") else "General",
                "proficiency": s["proficiency"],
            }
            for s in (us_result.data or [])
        ]

        # Fetch role requirements
        role_skills = []
        target_role_id = profile_data.get("target_role_id")
        if target_role_id:
            rs_result = (
                client.table("role_skills")
                .select("skill_id, required_level, importance_weight, skills(name, category)")
                .eq("role_id", target_role_id)
                .execute()
            )
            role_skills = [
                {
                    "skill_id": rs["skill_id"],
                    "skill_name": rs["skills"]["name"] if rs.get("skills") else rs["skill_id"],
                    "category": rs["skills"]["category"] if rs.get("skills") else "General",
                    "required_level": rs["required_level"],
                    "importance_weight": float(rs.get("importance_weight", 0.15)),
                }
                for rs in (rs_result.data or [])
            ]

        # Fetch last activity
        activity_result = (
            client.table("activity_logs")
            .select("created_at")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        last_activity = None
        if activity_result.data:
            last_activity = activity_result.data[0]["created_at"]

        career_roles = profile_data.get("career_roles")
        members_data.append({
            "user_id": uid,
            "full_name": profile_data.get("full_name", ""),
            "email": profile_data.get("email", ""),
            "target_role_title": career_roles.get("title") if career_roles else None,
            "user_skills": user_skills,
            "role_skills": role_skills,
            "last_activity": last_activity,
        })

    return compute_manager_analytics(
        organization_id=organization_id,
        members_data=members_data,
        team_id=team_id,
    )


@router.get("/team-members")
def list_team_members(
    organization_id: str = Query(...),
    team_id: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(require_manager_role),
) -> list:
    """List team members with basic profile info. Manager-only."""
    client = create_user_supabase_client(user.access_token)
    query = (
        client.table("team_members")
        .select("user_id, role, joined_at, profiles(full_name, email, target_role_name, onboarding_completed)")
        .eq("organization_id", organization_id)
    )
    if team_id:
        query = query.eq("team_id", team_id)
    result = query.execute()
    return result.data or []
