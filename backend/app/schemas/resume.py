"""Pydantic schemas for resume parsing and skill extraction endpoints."""
from typing import List, Optional
from pydantic import BaseModel, Field


class ExtractedSkill(BaseModel):
    name: str
    category: str
    proficiency: int = Field(ge=1, le=5, description="Inferred proficiency 1-5")
    confidence: float = Field(ge=0.0, le=1.0)
    source: str = "resume"


class ResumeParseRequest(BaseModel):
    resume_id: str
    storage_path: str


class ResumeParseResponse(BaseModel):
    resume_id: str
    parse_status: str
    extracted_text_length: int
    skills: List[ExtractedSkill]
    summary: str
    education: List[str]
    experience_years: Optional[float] = None
    contact: Optional[dict] = None
    raw_sections: Optional[dict] = None


class SkillExtractionRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Raw text to extract skills from")
    target_role: Optional[str] = None


class SkillExtractionResponse(BaseModel):
    skills: List[ExtractedSkill]
    suggested_target_roles: List[str] = []
    experience_level: Optional[str] = None
