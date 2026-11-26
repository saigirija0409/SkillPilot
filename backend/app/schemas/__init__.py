"""Pydantic schemas for SkillPilot API."""
from app.schemas.auth import AuthenticatedUserResponse, ProfileSummary
from app.schemas.health import HealthResponse, IntegrationStatus
from app.schemas.resume import ExtractedSkill, ResumeParseResponse, SkillExtractionRequest, SkillExtractionResponse
from app.schemas.skill_gap import SkillGapItem, SkillGapRequest, SkillGapResponse
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapGenerateResponse, RoadmapItemSchema, RoadmapProgressUpdate
from app.schemas.recommendations import RecommendationRequest, RecommendationResponse, RecommendedOpportunity
from app.schemas.analytics import ManagerAnalyticsRequest, ManagerAnalyticsResponse
