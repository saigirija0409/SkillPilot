"""
ML recommendation engine using sentence-transformers for semantic similarity.
Matches user skill gaps to learning opportunities via cosine similarity.
Falls back to tag-overlap scoring when embeddings are unavailable.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, Dict, List, Optional

from app.schemas.recommendations import RecommendedOpportunity, RecommendationResponse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Embedding model (lazy-loaded, cached)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
    """Lazily load and cache the sentence-transformer model."""
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformer model: %s", model_name)
        return SentenceTransformer(model_name)
    except Exception as exc:
        logger.warning("Could not load sentence-transformer: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x ** 2 for x in a) ** 0.5
    mag_b = sum(x ** 2 for x in b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _tag_overlap_score(skill_gaps: List[str], opp_tags: List[str]) -> float:
    """Fallback: Jaccard similarity between missing skills and opportunity tags."""
    gap_set = {s.lower() for s in skill_gaps}
    tag_set = {t.lower() for t in opp_tags}
    if not gap_set or not tag_set:
        return 0.0
    intersection = gap_set & tag_set
    union = gap_set | tag_set
    return len(intersection) / len(union)


# ---------------------------------------------------------------------------
# Main recommendation function
# ---------------------------------------------------------------------------

def recommend_opportunities(
    user_id: str,
    skill_gaps: List[str],           # names of missing/weak skills
    opportunities: List[Dict[str, Any]],  # rows from the opportunities table
    *,
    limit: int = 10,
    max_cost_inr: Optional[float] = None,
    preferred_formats: Optional[List[str]] = None,
    embedding_model_name: str = "all-MiniLM-L6-v2",
) -> RecommendationResponse:
    """
    Rank opportunities by semantic similarity to the user's skill gaps.

    Strategy:
    1. Try sentence-transformer embeddings for semantic match.
    2. Fall back to tag-overlap Jaccard if model unavailable.
    """
    if not opportunities or not skill_gaps:
        return RecommendationResponse(
            user_id=user_id,
            recommendations=[],
            algorithm="none",
            total_found=0,
        )

    # Apply hard filters
    filtered = opportunities
    if max_cost_inr is not None:
        filtered = [o for o in filtered if float(o.get("cost_inr", 0)) <= max_cost_inr]
    if preferred_formats:
        fmt_set = {f.lower() for f in preferred_formats}
        filtered = [o for o in filtered if o.get("format", "").lower() in fmt_set]

    gap_query = ", ".join(skill_gaps)

    model = _get_embedding_model(embedding_model_name)
    algorithm = "semantic_embedding"

    scored: List[tuple[float, Dict[str, Any]]] = []

    if model is not None:
        try:
            # Encode gap query once
            query_embedding = model.encode(gap_query).tolist()
            # Encode each opportunity description
            for opp in filtered:
                opp_text = f"{opp.get('title', '')} {opp.get('description', '')} {' '.join(opp.get('skill_tags', []))}"
                opp_embedding = model.encode(opp_text).tolist()
                score = _cosine_similarity(query_embedding, opp_embedding)
                scored.append((score, opp))
        except Exception as exc:
            logger.warning("Embedding scoring failed, falling back to tags: %s", exc)
            model = None

    if model is None:
        algorithm = "tag_overlap"
        for opp in filtered:
            score = _tag_overlap_score(skill_gaps, opp.get("skill_tags", []))
            scored.append((score, opp))

    # Sort descending by score
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]

    recommendations = []
    for score, opp in top:
        match_reason = _build_match_reason(skill_gaps, opp.get("skill_tags", []), score)
        recommendations.append(
            RecommendedOpportunity(
                opportunity_id=str(opp["id"]),
                title=opp.get("title", ""),
                provider=opp.get("provider", ""),
                opportunity_type=opp.get("opportunity_type", "course"),
                description=opp.get("description", ""),
                skill_tags=opp.get("skill_tags", []),
                difficulty_level=opp.get("difficulty_level", "beginner"),
                estimated_hours=float(opp.get("estimated_hours", 0)),
                cost_inr=float(opp.get("cost_inr", 0)),
                format=opp.get("format", "online"),
                url=opp.get("url"),
                relevance_score=round(score, 3),
                match_reason=match_reason,
            )
        )

    return RecommendationResponse(
        user_id=user_id,
        recommendations=recommendations,
        algorithm=algorithm,
        total_found=len(filtered),
    )


def _build_match_reason(gaps: List[str], tags: List[str], score: float) -> str:
    matched = [t for t in tags if any(g.lower() in t.lower() or t.lower() in g.lower() for g in gaps)]
    if matched:
        return f"Covers {', '.join(matched[:3])} — key skills in your gap analysis."
    if score > 0.5:
        return "Highly relevant to your target role based on content analysis."
    if score > 0.3:
        return "Moderately relevant to your skill development goals."
    return "May support your overall learning journey."
