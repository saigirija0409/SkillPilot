"""
Roadmap generation and progress tracking endpoints.
POST /api/v1/roadmaps/generate      — generate a personalised roadmap
GET  /api/v1/roadmaps/my            — list user's roadmaps
GET  /api/v1/roadmaps/{id}          — get specific roadmap with items
PATCH /api/v1/roadmaps/items/{id}   — update item progress status
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    RoadmapProgressUpdate,
)
from app.services.gemini_service import get_gemini_client, is_gemini_configured
from app.services.roadmap_service import generate_roadmap_with_gemini, persist_roadmap_to_db
from app.services.supabase_service import create_user_supabase_client

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=RoadmapGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_roadmap(
    request: RoadmapGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> RoadmapGenerateResponse:
    """
    Generate a personalised 30/60/90-day learning roadmap using Gemini AI.
    Fetches skill gaps and available opportunities from Supabase, then
    calls Gemini to produce a structured plan. Result is saved to the DB.
    """
    if request.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You may only generate roadmaps for yourself.",
        )

    settings = get_settings()
    client = create_user_supabase_client(user.access_token)

    # Fetch target role
    role_result = (
        client.table("career_roles")
        .select("id, title")
        .eq("id", request.target_role_id)
        .maybe_single()
        .execute()
    )
    if not role_result or not role_result.data:
        raise HTTPException(status_code=404, detail="Target role not found.")
    role = role_result.data

    # Fetch user skill gaps
    rs_result = (
        client.table("role_skills")
        .select("skill_id, required_level, skills(name)")
        .eq("role_id", request.target_role_id)
        .execute()
    )
    us_result = (
        client.table("user_skills")
        .select("skill_id, proficiency")
        .eq("user_id", user.user_id)
        .execute()
    )
    user_skill_map = {s["skill_id"]: s["proficiency"] for s in (us_result.data or [])}

    skill_gaps = []
    for rs in rs_result.data or []:
        req = rs["required_level"]
        cur = user_skill_map.get(rs["skill_id"], 0)
        if cur < req:
            skill_gaps.append(rs["skills"]["name"] if rs.get("skills") else rs["skill_id"])

    # Fetch relevant opportunities
    opp_result = client.table("opportunities").select("*").execute()
    opportunities = opp_result.data or []

    if not is_gemini_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API is not configured. Add GEMINI_API_KEY to backend/.env.",
        )

    gemini = get_gemini_client()
    roadmap = generate_roadmap_with_gemini(
        user_id=user.user_id,
        target_role_id=request.target_role_id,
        target_role_title=role["title"],
        skill_gaps=skill_gaps,
        opportunities=opportunities,
        duration_days=request.duration_days,
        daily_minutes=request.daily_minutes_budget,
        budget_inr=request.total_budget_inr,
        gemini_client=gemini,
        model_name=settings.gemini_model,
    )

    # Persist to Supabase
    try:
        roadmap_id = persist_roadmap_to_db(roadmap, supabase_client=client)
        roadmap.roadmap_id = roadmap_id
    except Exception as exc:
        logger.warning("Could not persist roadmap to DB: %s", exc)

    return roadmap


@router.get("/my")
def list_my_roadmaps(
    user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """List all roadmaps belonging to the authenticated user."""
    client = create_user_supabase_client(user.access_token)
    result = (
        client.table("roadmaps")
        .select("id, title, duration_days, status, created_at, updated_at, career_roles(title)")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/{roadmap_id}")
def get_roadmap(
    roadmap_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Get a specific roadmap with all its items."""
    client = create_user_supabase_client(user.access_token)
    roadmap_result = (
        client.table("roadmaps")
        .select("*, career_roles(title, slug)")
        .eq("id", roadmap_id)
        .eq("user_id", user.user_id)
        .maybe_single()
        .execute()
    )
    if not roadmap_result or not roadmap_result.data:
        raise HTTPException(status_code=404, detail="Roadmap not found.")

    items_result = (
        client.table("roadmap_items")
        .select("*")
        .eq("roadmap_id", roadmap_id)
        .order("day_bucket")
        .order("sort_order")
        .execute()
    )

    roadmap = roadmap_result.data
    roadmap["items"] = items_result.data or []
    return roadmap


@router.patch("/items/{item_id}", status_code=status.HTTP_200_OK)
def update_item_progress(
    item_id: str,
    update: RoadmapProgressUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Update the progress status of a roadmap item."""
    valid_statuses = {"pending", "in_progress", "completed", "skipped"}
    if update.status not in valid_statuses:
        raise HTTPException(
            status_code=422,
            detail=f"Status must be one of {valid_statuses}",
        )

    client = create_user_supabase_client(user.access_token)
    patch: dict = {"status": update.status}
    if update.notes:
        patch["notes"] = update.notes
    if update.status == "completed":
        from datetime import datetime, timezone
        patch["completed_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        client.table("roadmap_items")
        .update(patch)
        .eq("id", item_id)
        .eq("user_id", user.user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Roadmap item not found.")
    return result.data[0]
