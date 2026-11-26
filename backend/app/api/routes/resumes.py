"""
Resume upload and parsing endpoints.
POST /api/v1/resumes/upload   — upload a PDF, store in Supabase Storage, trigger parse
POST /api/v1/resumes/extract  — extract skills from plain text (no file needed)
GET  /api/v1/resumes/{resume_id}/status — check parse status
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.resume import (
    ExtractedSkill,
    ResumeParseResponse,
    SkillExtractionRequest,
    SkillExtractionResponse,
)
from app.services.gemini_service import get_gemini_client, is_gemini_configured
from app.services.resume_service import (
    extract_skills_rule_based,
    extract_skills_with_gemini,
    extract_text_from_pdf_bytes,
)
from app.services.supabase_service import create_user_supabase_client

router = APIRouter(prefix="/resumes", tags=["resumes"])
logger = logging.getLogger(__name__)

MAX_PDF_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/upload", response_model=ResumeParseResponse, status_code=status.HTTP_201_CREATED)
async def upload_and_parse_resume(
    file: UploadFile = File(..., description="PDF resume file (max 5 MB)"),
    user: AuthenticatedUser = Depends(get_current_user),
) -> ResumeParseResponse:
    """
    Upload a PDF resume to Supabase Storage, extract text, and run AI skill extraction.
    The result is stored in the resumes table with parse_status='parsed'.
    """
    settings = get_settings()

    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only PDF files are accepted.",
        )

    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.max_resume_size_mb} MB.",
        )

    # Extract text
    try:
        raw_text = extract_text_from_pdf_bytes(pdf_bytes)
    except Exception as exc:
        logger.error("PDF text extraction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from the uploaded PDF.",
        ) from exc

    if len(raw_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Extracted PDF text is too short. Ensure the PDF contains selectable text.",
        )

    # AI extraction
    parsed_data: dict = {}
    if is_gemini_configured():
        gemini = get_gemini_client()
        parsed_data = extract_skills_with_gemini(
            raw_text,
            gemini_client=gemini,
            model_name=settings.gemini_model,
        )
    else:
        fallback = extract_skills_rule_based(raw_text)
        parsed_data = {"skills": fallback, "education": [], "summary": ""}

    skills = [ExtractedSkill(**s) for s in parsed_data.get("skills", [])]

    # Persist resume metadata + extracted summary to Supabase
    client = create_user_supabase_client(user.access_token)
    storage_path = f"{user.user_id}/{file.filename}"

    try:
        # Upload to storage
        client.storage.from_("resumes").upload(
            path=storage_path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
    except Exception as exc:
        logger.warning("Storage upload failed: %s — continuing without storage.", exc)
        storage_path = f"{user.user_id}/local_{file.filename}"

    # Upsert resume record
    resume_row = {
        "user_id": user.user_id,
        "storage_path": storage_path,
        "file_name": file.filename,
        "mime_type": "application/pdf",
        "file_size_bytes": len(pdf_bytes),
        "parse_status": "parsed",
        "is_active": True,
        "extracted_summary": {
            "summary": parsed_data.get("summary", ""),
            "education": parsed_data.get("education", []),
            "experience_years": parsed_data.get("experience_years"),
            "experience_level": parsed_data.get("experience_level"),
            "skills_count": len(skills),
        },
    }

    resume_result = client.table("resumes").insert(resume_row).execute()
    resume_id = resume_result.data[0]["id"] if resume_result.data else "unknown"

    return ResumeParseResponse(
        resume_id=resume_id,
        parse_status="parsed",
        extracted_text_length=len(raw_text),
        skills=skills,
        summary=parsed_data.get("summary", ""),
        education=parsed_data.get("education", []),
        experience_years=parsed_data.get("experience_years"),
        contact=parsed_data.get("contact"),
        raw_sections=None,
    )


@router.post("/extract", response_model=SkillExtractionResponse)
async def extract_skills_from_text(
    request: SkillExtractionRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> SkillExtractionResponse:
    """
    Extract skills from arbitrary text (paste resume text directly).
    Useful for onboarding without a PDF file.
    """
    settings = get_settings()

    if is_gemini_configured():
        gemini = get_gemini_client()
        parsed_data = extract_skills_with_gemini(
            request.text,
            target_role=request.target_role,
            gemini_client=gemini,
            model_name=settings.gemini_model,
        )
    else:
        parsed_data = {
            "skills": extract_skills_rule_based(request.text),
            "suggested_target_roles": [],
            "experience_level": None,
        }

    skills = [ExtractedSkill(**s) for s in parsed_data.get("skills", [])]

    return SkillExtractionResponse(
        skills=skills,
        suggested_target_roles=parsed_data.get("suggested_target_roles", []),
        experience_level=parsed_data.get("experience_level"),
    )


@router.get("/{resume_id}/status")
async def get_resume_status(
    resume_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Get the parse status of a previously uploaded resume."""
    client = create_user_supabase_client(user.access_token)
    result = (
        client.table("resumes")
        .select("id, parse_status, file_name, uploaded_at, extracted_summary")
        .eq("id", resume_id)
        .eq("user_id", user.user_id)
        .maybe_single()
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return result.data
