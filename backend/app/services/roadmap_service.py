"""
Roadmap generation service using Google Gemini.
Produces personalised 30/60/90-day learning roadmaps from skill gaps
and available opportunities, then persists them to Supabase.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

from app.schemas.roadmap import RoadmapGenerateResponse, RoadmapItemSchema

logger = logging.getLogger(__name__)


_ROADMAP_PROMPT = """\
You are SkillPilot's expert learning coach. Create a personalised {duration_days}-day learning roadmap.

Learner profile:
- Target role: {target_role_title}
- Top skill gaps: {skill_gaps}
- Daily time budget: {daily_minutes} minutes/day
- Total budget: ₹{budget_inr}
- Available learning opportunities: {opportunities_summary}

Generate a JSON roadmap with this exact structure:
{{
  "title": "Roadmap to {target_role_title}",
  "items": [
    {{
      "title": "Learn Python fundamentals",
      "item_type": "course",
      "day_bucket": 30,
      "estimated_minutes": 300,
      "skill_name": "Python",
      "rationale": "Foundation skill required for the role",
      "url": "https://example.com",
      "provider": "Coursera",
      "cost_inr": 0.0,
      "sort_order": 1
    }}
  ]
}}

Rules:
- item_type: course | practical_task | workshop | project | assessment
- day_bucket: 30 | 60 | 90 (which 30-day phase the item belongs to)
- Distribute items across all phases proportionally
- Include a mix of theory and practical tasks
- Respect the daily time and budget constraints
- Target {num_items} items total
- Provide ONLY valid JSON, no markdown, no explanation
"""


def generate_roadmap_with_gemini(
    user_id: str,
    target_role_id: str,
    target_role_title: str,
    skill_gaps: List[str],
    opportunities: List[Dict[str, Any]],
    duration_days: int = 90,
    daily_minutes: int = 45,
    budget_inr: float = 0.0,
    *,
    gemini_client: Any,
    model_name: str = "gemini-2.5-flash",
) -> RoadmapGenerateResponse:
    """
    Call Gemini to generate a structured learning roadmap.
    Returns a RoadmapGenerateResponse (not yet persisted to DB).
    """
    # Build a compact opportunities summary for the prompt
    opp_lines = []
    for opp in opportunities[:20]:  # limit to 20 to fit prompt
        opp_lines.append(
            f"- {opp.get('title')} ({opp.get('provider')}, ₹{opp.get('cost_inr', 0)}, "
            f"{opp.get('estimated_hours', 0)}h, tags: {', '.join(opp.get('skill_tags', [])[:4])})"
        )
    opp_summary = "\n".join(opp_lines) if opp_lines else "No specific opportunities available; suggest general resources."

    num_items = max(6, min(duration_days // 7, 24))  # ~1 item per week

    prompt = _ROADMAP_PROMPT.format(
        duration_days=duration_days,
        target_role_title=target_role_title,
        skill_gaps=", ".join(skill_gaps[:10]) or "General upskilling",
        daily_minutes=daily_minutes,
        budget_inr=budget_inr,
        opportunities_summary=opp_summary,
        num_items=num_items,
    )

    parsed: Optional[Dict[str, Any]] = None
    try:
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        parsed = json.loads(raw)
    except Exception as exc:
        logger.warning("Gemini roadmap generation failed: %s", exc)

    if parsed is None or "items" not in parsed:
        parsed = _fallback_roadmap(skill_gaps, duration_days)

    items = []
    for i, raw_item in enumerate(parsed.get("items", [])):
        items.append(
            RoadmapItemSchema(
                title=raw_item.get("title", f"Learning activity {i + 1}"),
                item_type=raw_item.get("item_type", "course"),
                day_bucket=int(raw_item.get("day_bucket", 30)),
                estimated_minutes=int(raw_item.get("estimated_minutes", 60)),
                skill_name=raw_item.get("skill_name", ""),
                rationale=raw_item.get("rationale", ""),
                url=raw_item.get("url"),
                provider=raw_item.get("provider"),
                cost_inr=float(raw_item.get("cost_inr", 0.0)),
                sort_order=raw_item.get("sort_order", i),
            )
        )

    total_hours = sum(item.estimated_minutes for item in items) / 60
    total_cost = sum(item.cost_inr for item in items)

    return RoadmapGenerateResponse(
        user_id=user_id,
        target_role_id=target_role_id,
        target_role_title=target_role_title,
        duration_days=duration_days,
        title=parsed.get("title", f"{duration_days}-Day Roadmap to {target_role_title}"),
        items=items,
        total_estimated_hours=round(total_hours, 1),
        total_cost_inr=round(total_cost, 2),
        generated_by="gemini",
    )


def _fallback_roadmap(skill_gaps: List[str], duration_days: int) -> Dict[str, Any]:
    """Generate a simple placeholder roadmap when Gemini is unavailable."""
    items = []
    buckets = [30, 60, 90][:duration_days // 30]
    for i, gap in enumerate(skill_gaps[:9]):
        bucket = buckets[i % len(buckets)]
        items.append({
            "title": f"Learn {gap}",
            "item_type": "course",
            "day_bucket": bucket,
            "estimated_minutes": 240,
            "skill_name": gap,
            "rationale": f"Core skill gap: {gap}",
            "sort_order": i,
            "cost_inr": 0.0,
        })
        items.append({
            "title": f"Practice {gap} with hands-on project",
            "item_type": "practical_task",
            "day_bucket": bucket,
            "estimated_minutes": 120,
            "skill_name": gap,
            "rationale": "Applied practice reinforces learning",
            "sort_order": i + 100,
            "cost_inr": 0.0,
        })
    return {"title": f"Skill Development Roadmap", "items": items}


# ---------------------------------------------------------------------------
# Supabase persistence
# ---------------------------------------------------------------------------

def persist_roadmap_to_db(
    roadmap: RoadmapGenerateResponse,
    *,
    supabase_client: Any,
) -> str:
    """
    Insert the generated roadmap and its items into Supabase.
    Returns the new roadmap_id.
    """
    # Insert roadmap header
    roadmap_row = {
        "user_id": roadmap.user_id,
        "target_role_id": roadmap.target_role_id or None,
        "title": roadmap.title,
        "duration_days": roadmap.duration_days,
        "status": "active",
    }
    result = supabase_client.table("roadmaps").insert(roadmap_row).execute()
    if not result.data:
        raise RuntimeError("Failed to insert roadmap into database")
    roadmap_id = result.data[0]["id"]

    # Insert all items
    item_rows = [
        {
            "roadmap_id": roadmap_id,
            "user_id": roadmap.user_id,
            "title": item.title,
            "item_type": item.item_type,
            "day_bucket": item.day_bucket,
            "estimated_minutes": item.estimated_minutes,
            "status": "pending",
            "notes": item.rationale,
            "sort_order": item.sort_order,
        }
        for item in roadmap.items
    ]
    if item_rows:
        supabase_client.table("roadmap_items").insert(item_rows).execute()

    return roadmap_id
