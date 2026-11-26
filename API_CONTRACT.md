# SkillPilot — Backend API Contract

> **For:** Ananya (Frontend) & Saigi (Backend)  
> All endpoints require `Authorization: Bearer <supabase_access_token>` unless marked 🔓

## Base URL
```
Development:  http://127.0.0.1:8000/api/v1
Production:   https://<your-deployed-backend>/api/v1
```

---

## 🔓 Health Check
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/health` | None |

**Response:**
```json
{ "status": "ok", "version": "0.1.0", "supabase": { "configured": true }, "gemini": { "configured": true } }
```

---

## Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/me` | Get current user profile summary |
| GET | `/api/v1/auth/manager-check` | Verify manager role (403 if not manager) |

**GET /auth/me Response:**
```json
{
  "authenticated": true,
  "user_id": "uuid",
  "email": "user@example.com",
  "jwt_role": "authenticated",
  "profile": {
    "id": "uuid",
    "full_name": "Jane Doe",
    "account_type": "employee",
    "organization_id": "uuid | null",
    "onboarding_completed": true,
    "onboarding_step": 4
  }
}
```

---

## Resumes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/resumes/upload` | Upload PDF, extract skills |
| POST | `/api/v1/resumes/extract` | Extract skills from pasted text |
| GET  | `/api/v1/resumes/{resume_id}/status` | Check parse status |

**POST /resumes/upload** — `multipart/form-data`
- Field: `file` (PDF, max 5 MB)

**Response:**
```json
{
  "resume_id": "uuid",
  "parse_status": "parsed",
  "extracted_text_length": 3400,
  "skills": [
    { "name": "Python", "category": "Programming Languages", "proficiency": 4, "confidence": 0.95, "source": "resume" }
  ],
  "summary": "...",
  "education": ["B.Tech CSE, XYZ University, 2022"],
  "experience_years": 2.5
}
```

**POST /resumes/extract** — `application/json`
```json
{ "text": "Resume text here...", "target_role": "Data Scientist" }
```

---

## Skills
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/skills/gap?target_role_id=<uuid>` | Skill gap analysis |
| GET | `/api/v1/skills/roles` | All career roles catalog |
| GET | `/api/v1/skills/catalog?category=<str>` | Skills catalog |
| GET | `/api/v1/skills/my-skills` | Current user's skill profile |

**GET /skills/gap Response:**
```json
{
  "user_id": "uuid",
  "target_role_id": "uuid",
  "target_role_title": "Data Scientist",
  "overall_readiness_score": 62.5,
  "skills_matched": 4,
  "skills_total": 10,
  "gaps": [
    {
      "skill_name": "Machine Learning",
      "category": "Machine Learning",
      "required_level": 4,
      "current_level": 2,
      "gap": 2,
      "importance_weight": 0.25,
      "priority": "critical"
    }
  ],
  "strengths": [...],
  "top_missing_skills": ["Machine Learning", "PyTorch", "SQL"]
}
```

---

## Roadmaps
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/roadmaps/generate` | Generate AI-powered roadmap |
| GET | `/api/v1/roadmaps/my` | List user's roadmaps |
| GET | `/api/v1/roadmaps/{roadmap_id}` | Get roadmap + all items |
| PATCH | `/api/v1/roadmaps/items/{item_id}` | Update item status |

**POST /roadmaps/generate Request:**
```json
{
  "user_id": "uuid",
  "target_role_id": "uuid",
  "duration_days": 90,
  "daily_minutes_budget": 45,
  "total_budget_inr": 5000.0
}
```

**PATCH /roadmaps/items/{item_id} Request:**
```json
{ "item_id": "uuid", "status": "completed", "notes": "Finished Coursera course" }
```
Status values: `pending | in_progress | completed | skipped`

---

## Recommendations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/recommendations/opportunities` | Personalised opportunity list |

**Query params:** `target_role_id`, `limit` (1–50), `max_cost_inr`

**Response:**
```json
{
  "user_id": "uuid",
  "algorithm": "semantic_embedding",
  "total_found": 42,
  "recommendations": [
    {
      "opportunity_id": "uuid",
      "title": "Machine Learning A-Z",
      "provider": "Coursera",
      "relevance_score": 0.87,
      "match_reason": "Covers Machine Learning, Python — key skills in your gap analysis.",
      "cost_inr": 999.0,
      "estimated_hours": 40.0,
      "url": "https://..."
    }
  ]
}
```

---

## Manager Analytics *(manager/admin only)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/manager/analytics?organization_id=<uuid>` | Team dashboard data |
| GET | `/api/v1/manager/team-members?organization_id=<uuid>` | Team member list |

**GET /manager/analytics Response:**
```json
{
  "organization_id": "uuid",
  "team_size": 8,
  "avg_readiness_score": 54.3,
  "critical_skill_gaps": ["PyTorch", "Kubernetes"],
  "members": [
    { "user_id": "uuid", "full_name": "...", "readiness_score": 42.0, "top_gaps": ["..."] }
  ],
  "skill_heatmap": [
    { "skill_name": "Python", "avg_proficiency": 3.2, "coverage_pct": 87.5, "team_gap": 0.8 }
  ],
  "top_recommended_trainings": ["Team training on PyTorch"]
}
```

---

## Error Format
All errors follow standard HTTP status codes with:
```json
{ "detail": "Human-readable error message" }
```

| Code | Meaning |
|------|---------|
| 401 | Missing/invalid Supabase token |
| 403 | Insufficient role (e.g., non-manager hitting /manager/*) |
| 404 | Resource not found |
| 413 | PDF too large (> 5 MB) |
| 422 | Invalid input / PDF has no text |
| 503 | Gemini API not configured |
