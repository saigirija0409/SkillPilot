"""
ML recommendation engine endpoints.
GET /api/v1/recommendations/opportunities — personalised opportunity recommendations
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.recommendations import RecommendationResponse
from app.services.recommendation_service import recommend_opportunities
from app.services.supabase_service import create_user_supabase_client

router = APIRouter(prefix="/recommendations", tags=["recommendations"])
logger = logging.getLogger(__name__)


@router.get("/opportunities", response_model=RecommendationResponse)
def get_opportunity_recommendations(
    target_role_id: Optional[str] = Query(None, description="Filter by target role UUID"),
    limit: int = Query(10, ge=1, le=50),
    max_cost_inr: Optional[float] = Query(None, description="Maximum cost in INR"),
    user: AuthenticatedUser = Depends(get_current_user),
) -> RecommendationResponse:
    """
    Return semantically ranked learning opportunities based on the user's
    skill gaps. Uses sentence-transformer embeddings when available.
    """
    settings = get_settings()
    client = create_user_supabase_client(user.access_token)

    # Determine target role
    effective_role_id = target_role_id
    if not effective_role_id:
        profile_result = (
            client.table("profiles")
            .select("target_role_id")
            .eq("id", user.user_id)
            .maybe_single()
            .execute()
        )
        if profile_result and profile_result.data:
            effective_role_id = profile_result.data.get("target_role_id")

    # Collect skill gaps
    skill_gaps: list[str] = []
    if effective_role_id:
        rs_result = (
            client.table("role_skills")
            .select("skill_id, required_level, skills(name)")
            .eq("role_id", effective_role_id)
            .execute()
        )
        us_result = (
            client.table("user_skills")
            .select("skill_id, proficiency")
            .eq("user_id", user.user_id)
            .execute()
        )
        user_map = {s["skill_id"]: s["proficiency"] for s in (us_result.data or [])}
        for rs in rs_result.data or []:
            if user_map.get(rs["skill_id"], 0) < rs["required_level"]:
                name = rs["skills"]["name"] if rs.get("skills") else rs["skill_id"]
                skill_gaps.append(name)

    # Fetch all opportunities
    opp_result = client.table("opportunities").select("*").execute()
    opportunities = opp_result.data or []

    return recommend_opportunities(
        user_id=user.user_id,
        skill_gaps=skill_gaps,
        opportunities=opportunities,
        limit=limit,
        max_cost_inr=max_cost_inr,
        embedding_model_name=settings.embedding_model,
    )
