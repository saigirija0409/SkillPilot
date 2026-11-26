"""
Resume parsing service using PyMuPDF for text extraction
and Google Gemini for NLP-based structured skill extraction.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# PDF TEXT EXTRACTION
# ---------------------------------------------------------------------------

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract plain text from raw PDF bytes using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise RuntimeError(
            "PyMuPDF is not installed. Add `pymupdf` to requirements.txt."
        )

    text_parts: List[str] = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text("text"))
    return "\n".join(text_parts).strip()


# ---------------------------------------------------------------------------
# GEMINI-POWERED SKILL EXTRACTION
# ---------------------------------------------------------------------------

_SKILL_EXTRACTION_PROMPT = """\
You are an expert technical recruiter and HR analyst. Analyse the following resume text and extract structured information.

Return a JSON object with exactly these fields:
{{
  "skills": [
    {{
      "name": "Python",
      "category": "Programming Languages",
      "proficiency": 4,
      "confidence": 0.95,
      "source": "resume"
    }}
  ],
  "education": ["B.Tech in Computer Science, XYZ University, 2022"],
  "experience_years": 3.5,
  "summary": "2-3 sentence professional summary of the candidate",
  "suggested_target_roles": ["Data Scientist", "ML Engineer"],
  "experience_level": "mid",
  "contact": {{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "optional"
  }}
}}

Rules:
- proficiency scale: 1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert
- confidence: 0.0–1.0 reflecting how certain you are the skill is real
- experience_level must be one of: student, entry, mid, senior, lead
- Extract ONLY real skills mentioned; do not hallucinate
- Provide at most 30 skills
- Target role: {target_role}

Resume text:
---
{resume_text}
---

Respond with ONLY the JSON object, no markdown, no explanation.
"""


def extract_skills_with_gemini(
    text: str,
    target_role: Optional[str] = None,
    *,
    gemini_client: Any,
    model_name: str = "gemini-2.5-flash",
) -> Dict[str, Any]:
    """
    Use Gemini to extract structured skills and metadata from resume text.
    Returns a parsed dict matching the JSON schema above.
    Falls back to a minimal response on any error.
    """
    prompt = _SKILL_EXTRACTION_PROMPT.format(
        resume_text=text[:12000],  # stay within token limits
        target_role=target_role or "not specified",
    )

    try:
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        raw = response.text.strip()
        # Strip possible markdown code fences
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("Gemini skill extraction failed: %s", exc)
        return {"skills": [], "education": [], "summary": "", "suggested_target_roles": []}


# ---------------------------------------------------------------------------
# RULE-BASED FALLBACK SKILL EXTRACTOR
# ---------------------------------------------------------------------------

_KNOWN_SKILLS: Dict[str, str] = {
    # Programming languages
    "python": "Programming Languages",
    "java": "Programming Languages",
    "javascript": "Programming Languages",
    "typescript": "Programming Languages",
    "c++": "Programming Languages",
    "c#": "Programming Languages",
    "go": "Programming Languages",
    "rust": "Programming Languages",
    "kotlin": "Programming Languages",
    "swift": "Programming Languages",
    "r": "Data Science",
    "scala": "Programming Languages",
    # Data / ML
    "machine learning": "Machine Learning",
    "deep learning": "Machine Learning",
    "nlp": "Machine Learning",
    "natural language processing": "Machine Learning",
    "computer vision": "Machine Learning",
    "tensorflow": "ML Frameworks",
    "pytorch": "ML Frameworks",
    "keras": "ML Frameworks",
    "scikit-learn": "ML Frameworks",
    "pandas": "Data Science",
    "numpy": "Data Science",
    "matplotlib": "Data Science",
    "sql": "Databases",
    "postgresql": "Databases",
    "mysql": "Databases",
    "mongodb": "Databases",
    "redis": "Databases",
    # Cloud / DevOps
    "aws": "Cloud",
    "gcp": "Cloud",
    "azure": "Cloud",
    "docker": "DevOps",
    "kubernetes": "DevOps",
    "terraform": "DevOps",
    "ci/cd": "DevOps",
    "git": "Version Control",
    # Web
    "react": "Frontend",
    "next.js": "Frontend",
    "vue": "Frontend",
    "angular": "Frontend",
    "fastapi": "Backend",
    "django": "Backend",
    "flask": "Backend",
    "node.js": "Backend",
    "rest api": "Backend",
    "graphql": "Backend",
}


def extract_skills_rule_based(text: str) -> List[Dict[str, Any]]:
    """Simple keyword-matching fallback when Gemini is unavailable."""
    lower = text.lower()
    found = []
    for keyword, category in _KNOWN_SKILLS.items():
        if keyword in lower:
            found.append({
                "name": keyword.title() if not keyword[0].isupper() else keyword,
                "category": category,
                "proficiency": 3,
                "confidence": 0.6,
                "source": "resume_keyword",
            })
    return found
