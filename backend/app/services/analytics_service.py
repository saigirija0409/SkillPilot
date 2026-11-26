"""
Manager analytics service.
Aggregates team skill data, computes heatmaps, and identifies
critical skill gaps across the team.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional

from app.schemas.analytics import (
    ManagerAnalyticsResponse,
    TeamMemberSkillSummary,
    TeamSkillHeatmapCell,
)

logger = logging.getLogger(__name__)


def compute_manager_analytics(
    organization_id: str,
    members_data: List[Dict[str, Any]],  # [{user_id, full_name, email, target_role_title, user_skills, role_skills}]
    team_id: Optional[str] = None,
) -> ManagerAnalyticsResponse:
    """
    Aggregate skill data for all team members into a manager dashboard payload.

    Each member dict must include:
      - user_id, full_name, email
      - target_role_title (optional)
      - user_skills: [{skill_id, skill_name, proficiency}]
      - role_skills: [{skill_id, skill_name, required_level, importance_weight}]
      - last_activity: ISO string or None
    """
    member_summaries: List[TeamMemberSkillSummary] = []
    all_readiness: List[float] = []

    # Aggregate per-skill stats across the team
    skill_stats: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"name": "", "category": "", "proficiencies": [], "required": []}
    )

    for member in members_data:
        uid = member["user_id"]
        user_map = {s["skill_id"]: s["proficiency"] for s in member.get("user_skills", [])}
        role_skills = member.get("role_skills", [])

        # Compute per-member readiness
        weighted_sum, weight_total = 0.0, 0.0
        top_gaps = []
        for rs in role_skills:
            sid = rs["skill_id"]
            req = rs["required_level"]
            cur = user_map.get(sid, 0)
            w = float(rs.get("importance_weight", 0.15))
            weight_total += w
            weighted_sum += min(cur / req, 1.0) * w if req > 0 else w
            if cur < req:
                top_gaps.append(rs["skill_name"])

            # Accumulate for heatmap
            skill_stats[sid]["name"] = rs["skill_name"]
            skill_stats[sid]["category"] = rs.get("category", "General")
            skill_stats[sid]["proficiencies"].append(cur)
            skill_stats[sid]["required"].append(req)

        readiness = (weighted_sum / weight_total * 100) if weight_total > 0 else 0.0
        all_readiness.append(readiness)

        # Sort gaps by importance (simple: alphabetical for now; real impl uses gap size)
        top_gaps_sorted = top_gaps[:5]

        member_summaries.append(
            TeamMemberSkillSummary(
                user_id=uid,
                full_name=member.get("full_name", ""),
                email=member.get("email", ""),
                target_role_title=member.get("target_role_title"),
                readiness_score=round(readiness, 1),
                skills_count=len(user_map),
                top_gaps=top_gaps_sorted,
                last_activity=member.get("last_activity"),
            )
        )

    # Sort members by readiness (ascending — most at risk first)
    member_summaries.sort(key=lambda m: m.readiness_score)

    avg_readiness = sum(all_readiness) / len(all_readiness) if all_readiness else 0.0

    # Build skill heatmap
    heatmap: List[TeamSkillHeatmapCell] = []
    team_size = len(members_data)
    for sid, stat in skill_stats.items():
        profs = stat["proficiencies"]
        reqs = stat["required"]
        avg_prof = sum(profs) / len(profs) if profs else 0.0
        coverage = sum(1 for p in profs if p > 0) / team_size if team_size > 0 else 0.0
        avg_req = sum(reqs) / len(reqs) if reqs else 0.0
        heatmap.append(
            TeamSkillHeatmapCell(
                skill_name=stat["name"],
                category=stat["category"],
                avg_proficiency=round(avg_prof, 2),
                coverage_pct=round(coverage * 100, 1),
                team_gap=round(max(avg_req - avg_prof, 0.0), 2),
            )
        )

    # Sort heatmap by gap descending
    heatmap.sort(key=lambda c: c.team_gap, reverse=True)
    critical = [c.skill_name for c in heatmap if c.team_gap >= 2.0][:5]

    top_trainings = [
        f"Team training on {c.skill_name}"
        for c in heatmap[:3]
        if c.team_gap > 0
    ]

    return ManagerAnalyticsResponse(
        organization_id=organization_id,
        team_id=team_id,
        team_size=team_size,
        avg_readiness_score=round(avg_readiness, 1),
        members=member_summaries,
        skill_heatmap=heatmap,
        critical_skill_gaps=critical,
        top_recommended_trainings=top_trainings,
    )
