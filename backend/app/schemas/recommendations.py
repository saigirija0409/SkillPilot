"""Pydantic schemas for ML recommendation engine endpoints."""
from typing import List, Optional
from pydantic import BaseModel, Field


class RecommendedOpportunity(BaseModel):
    opportunity_id: str
    title: str
    provider: str
    opportunity_type: str
    description: str
    skill_tags: List[str]
    difficulty_level: str
    estimated_hours: float
    cost_inr: float
    format: str
    url: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)
    match_reason: str


class RecommendationRequest(BaseModel):
    user_id: str
    target_role_id: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=50)
    max_cost_inr: Optional[float] = None
    preferred_formats: Optional[List[str]] = None


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecommendedOpportunity]
    algorithm: str = "semantic_embedding"
    total_found: int
