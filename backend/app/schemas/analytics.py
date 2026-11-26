"""Pydantic schemas for manager analytics endpoints."""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class TeamMemberSkillSummary(BaseModel):
    user_id: str
    full_name: str
    email: str
    target_role_title: Optional[str]
    readiness_score: float
    skills_count: int
    top_gaps: List[str]
    last_activity: Optional[str]


class TeamSkillHeatmapCell(BaseModel):
    skill_name: str
    category: str
    avg_proficiency: float
    coverage_pct: float  # % of team with this skill
    team_gap: float  # avg gap across team


class ManagerAnalyticsRequest(BaseModel):
    organization_id: str
    team_id: Optional[str] = None


class ManagerAnalyticsResponse(BaseModel):
    organization_id: str
    team_id: Optional[str]
    team_size: int
    avg_readiness_score: float
    members: List[TeamMemberSkillSummary]
    skill_heatmap: List[TeamSkillHeatmapCell]
    critical_skill_gaps: List[str]
    top_recommended_trainings: List[str]
