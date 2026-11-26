"""Pydantic schemas for roadmap generation endpoints."""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date


class RoadmapItemSchema(BaseModel):
    title: str
    item_type: str  # course | practical_task | workshop | project | assessment
    day_bucket: int  # 30 | 60 | 90
    estimated_minutes: int
    skill_name: str
    rationale: str
    opportunity_id: Optional[str] = None
    url: Optional[str] = None
    provider: Optional[str] = None
    cost_inr: float = 0.0
    sort_order: int = 0


class RoadmapGenerateRequest(BaseModel):
    user_id: str
    target_role_id: str
    duration_days: int = Field(default=90, description="30, 60, or 90")
    daily_minutes_budget: int = Field(default=45, ge=10, le=480)
    total_budget_inr: float = Field(default=0.0, ge=0.0)
    force_regenerate: bool = False


class RoadmapGenerateResponse(BaseModel):
    roadmap_id: Optional[str] = None
    user_id: str
    target_role_id: str
    target_role_title: str
    duration_days: int
    title: str
    items: List[RoadmapItemSchema]
    total_estimated_hours: float
    total_cost_inr: float
    generated_by: str = "gemini"


class RoadmapProgressUpdate(BaseModel):
    item_id: str
    status: str  # pending | in_progress | completed | skipped
    notes: Optional[str] = None
