"""
Skill gap analysis service.
Compares a user's current skills against role requirements
and computes a readiness score with prioritised gaps.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from app.schemas.skill_gap import SkillGapItem, SkillGapResponse

logger = logging.getLogger(__name__)


def _priority(gap: int, weight: float) -> str:
    score = gap * weight
    if score >= 2.0:
        return "critical"
    if score >= 1.0:
        return "high"
    if score >= 0.5:
        return "medium"
    return "low"


def compute_skill_gap(
    user_id: str,
    target_role_id: str,
    role_skills: List[Dict[str, Any]],  # [{skill_id, skill_name, slug, category, required_level, importance_weight}]
    user_skills: List[Dict[str, Any]],  # [{skill_id, skill_name, proficiency}]
    target_role_title: str,
) -> SkillGapResponse:
    """
    Pure-Python skill gap analysis. No external API required.

    Args:
        role_skills: List of required skills for the target role.
        user_skills: List of skills the user currently has.

    Returns:
        SkillGapResponse with gaps, strengths, and readiness score.
    """
    user_skill_map: Dict[str, int] = {
        s["skill_id"]: s["proficiency"] for s in user_skills
    }

    gaps: List[SkillGapItem] = []
    strengths: List[SkillGapItem] = []
    weighted_score_sum = 0.0
    weight_total = 0.0

    for rs in role_skills:
        skill_id = rs["skill_id"]
        required = rs["required_level"]
        current = user_skill_map.get(skill_id, 0)
        gap = required - current
        weight = float(rs.get("importance_weight", 0.15))
        weight_total += weight

        # Contribution to readiness: min(current/required, 1) * weight
        contribution = min(current / required, 1.0) if required > 0 else 1.0
        weighted_score_sum += contribution * weight

        item = SkillGapItem(
            skill_id=skill_id,
            skill_name=rs["skill_name"],
            skill_slug=rs.get("slug"),
            category=rs.get("category", "General"),
            required_level=required,
            current_level=current,
            gap=gap,
            importance_weight=weight,
            priority=_priority(gap, weight) if gap > 0 else "low",
        )

        if gap > 0:
            gaps.append(item)
        else:
            strengths.append(item)

    readiness = (weighted_score_sum / weight_total * 100) if weight_total > 0 else 0.0

    # Sort gaps by priority then gap size
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    gaps.sort(key=lambda x: (priority_order[x.priority], -x.gap))
    top_missing = [g.skill_name for g in gaps if g.priority in {"critical", "high"}][:5]

    return SkillGapResponse(
        user_id=user_id,
        target_role_id=target_role_id,
        target_role_title=target_role_title,
        overall_readiness_score=round(readiness, 1),
        skills_matched=len(strengths),
        skills_total=len(role_skills),
        gaps=gaps,
        strengths=strengths,
        top_missing_skills=top_missing,
    )
