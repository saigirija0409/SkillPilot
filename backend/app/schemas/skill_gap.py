"""Pydantic schemas for skill gap analysis endpoints."""
from typing import List, Optional
from pydantic import BaseModel, Field


class SkillGapItem(BaseModel):
    skill_id: Optional[str] = None
    skill_name: str
    skill_slug: Optional[str] = None
    category: str
    required_level: int = Field(ge=1, le=5)
    current_level: int = Field(ge=0, le=5)
    gap: int  # required - current; negative means user exceeds requirement
    importance_weight: float = Field(ge=0.0, le=1.0)
    priority: str  # "critical" | "high" | "medium" | "low"


class SkillGapRequest(BaseModel):
    user_id: str
    target_role_id: str


class SkillGapResponse(BaseModel):
    user_id: str
    target_role_id: str
    target_role_title: str
    overall_readiness_score: float = Field(ge=0.0, le=100.0)
    skills_matched: int
    skills_total: int
    gaps: List[SkillGapItem]
    strengths: List[SkillGapItem]
    top_missing_skills: List[str]
