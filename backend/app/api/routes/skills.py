"""
Skill gap analysis endpoints.
GET /api/v1/skills/gap?target_role_id=<uuid>  — analyse current user's gaps
GET /api/v1/skills/roles                       — list all career roles
GET /api/v1/skills/catalog                     — list skill catalog
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.skill_gap import SkillGapResponse
from app.services.skill_gap_service import compute_skill_gap
from app.services.supabase_service import create_user_supabase_client

router = APIRouter(prefix="/skills", tags=["skills"])
logger = logging.getLogger(__name__)


@router.get("/gap", response_model=SkillGapResponse)
def analyse_skill_gap(
    target_role_id: str = Query(..., description="UUID of the target career role"),
    user: AuthenticatedUser = Depends(get_current_user),
) -> SkillGapResponse:
    """
    Compute the skill gap between the authenticated user's current skills
    and the requirements of the specified target career role.
    """
    client = create_user_supabase_client(user.access_token)

    # Fetch target role details
    role_result = (
        client.table("career_roles")
        .select("id, title, slug")
        .eq("id", target_role_id)
        .maybe_single()
        .execute()
    )
    if not role_result or not role_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career role {target_role_id} not found.",
        )
    role = role_result.data

    # Fetch role skill requirements (join with skills table for names)
    rs_result = (
        client.table("role_skills")
        .select("skill_id, required_level, importance_weight, skills(id, name, slug, category)")
        .eq("role_id", target_role_id)
        .execute()
    )
    role_skills_raw = rs_result.data or []

    role_skills = [
        {
            "skill_id": rs["skill_id"],
            "skill_name": rs["skills"]["name"] if rs.get("skills") else rs["skill_id"],
            "slug": rs["skills"]["slug"] if rs.get("skills") else "",
            "category": rs["skills"]["category"] if rs.get("skills") else "General",
            "required_level": rs["required_level"],
            "importance_weight": float(rs.get("importance_weight", 0.15)),
        }
        for rs in role_skills_raw
    ]

    if not role_skills:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skill requirements defined for this role yet.",
        )

    # Fetch user's current skills
    us_result = (
        client.table("user_skills")
        .select("skill_id, proficiency, skills(name)")
        .eq("user_id", user.user_id)
        .execute()
    )
    user_skills = [
        {
            "skill_id": us["skill_id"],
            "skill_name": us["skills"]["name"] if us.get("skills") else us["skill_id"],
            "proficiency": us["proficiency"],
        }
        for us in (us_result.data or [])
    ]

    return compute_skill_gap(
        user_id=user.user_id,
        target_role_id=target_role_id,
        role_skills=role_skills,
        user_skills=user_skills,
        target_role_title=role["title"],
    )


@router.get("/roles")
def list_career_roles(
    user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """List all available career roles from the catalog."""
    client = create_user_supabase_client(user.access_token)
    result = (
        client.table("career_roles")
        .select("id, slug, title, category, description")
        .order("category")
        .execute()
    )
    return result.data or []


@router.get("/catalog")
def list_skills_catalog(
    category: Optional[str] = Query(None, description="Filter by skill category"),
    user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """List all skills in the catalog, optionally filtered by category."""
    client = create_user_supabase_client(user.access_token)
    query = client.table("skills").select("id, slug, name, category, description")
    if category:
        query = query.eq("category", category)
    result = query.order("category").order("name").execute()
    return result.data or []


@router.get("/my-skills")
def get_my_skills(
    user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """Return the authenticated user's skill profile."""
    client = create_user_supabase_client(user.access_token)
    result = (
        client.table("user_skills")
        .select("id, skill_id, proficiency, verification_status, skills(name, category, slug)")
        .eq("user_id", user.user_id)
        .execute()
    )
    return result.data or []
