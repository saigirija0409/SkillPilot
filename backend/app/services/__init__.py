"""
Service layer for SkillPilot backend.
- gemini_service:         Google Gemini client and status checks
- supabase_service:       Supabase client factory (anon + user-scoped)
- resume_service:         PDF extraction + AI/rule-based skill parsing
- skill_gap_service:      Readiness scoring and gap prioritisation
- recommendation_service: Semantic ML-based opportunity ranking
- roadmap_service:        Gemini-generated 30/60/90-day learning plans
- analytics_service:      Manager team skill heatmaps and aggregations
"""
