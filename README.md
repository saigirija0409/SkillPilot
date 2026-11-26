# SkillPilot — Agentic AI-Powered Upskilling and Workforce Intelligence Platform

SkillPilot helps employees and students identify career skill gaps, discover personalized learning opportunities, generate adaptive 30/60/90-day roadmaps, apply acquired skills through practical tasks, and track verified vs. inferred professional development—while giving managers real-time team skill intelligence.

## Repository Structure

```text
SKILL PILOT/
├── frontend/               # Next.js (TypeScript, Tailwind CSS, App Router)
│   ├── src/
│   │   ├── app/            # Next.js pages & layouts
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/supabase/   # Supabase browser & server client helpers
│   │   ├── services/       # Dedicated backend API client modules
│   │   └── types/          # Shared TypeScript interfaces
│   └── .env.example        # Template for frontend/.env.local
├── backend/                # Python FastAPI backend & ML services
│   ├── app/
│   │   ├── api/routes/     # FastAPI route handlers (health, etc.)
│   │   ├── core/           # Pydantic Settings & CORS config
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # Gemini & Supabase service wrappers
│   │   └── main.py         # FastAPI entry point
│   ├── requirements.txt    # Verified Python 3.13 dependencies
│   └── .env.example        # Template for backend/.env
├── supabase/               # SQL migrations (0001..0004) & demo seed data
└── .gitignore              # Excludes .env files, .venv, node_modules, .next
```

---

## Prerequisites (Windows)

- **Node.js** 20+ (verified with Node `v24.19.0` and `npm 11.17.0`)
- **Python 3.13** (verified with Python `3.13.15` — recommended for prebuilt Windows ML wheels for `pymupdf`, `scikit-learn`, and `sentence-transformers`)
- **Git**

> **Note for Windows:** If running `python` in PowerShell hits a Microsoft Store alias error, invoke Python 3.13 directly via its install path (for example, `C:\Users\<YourUser>\AppData\Local\Programs\Python\Python313\python.exe`) when creating the virtual environment.

---

## 1. Environment Setup (Secrets Stay Local)

Create your local environment files from the templates **before** running the app. Neither `.env` nor `.env.local` is tracked by Git.

### Backend (`backend\.env`)

In PowerShell from the repository root:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` and fill in your credentials:

- `SUPABASE_URL`: Your Supabase Project URL
- `SUPABASE_PUBLISHABLE_KEY`: Your Supabase Publishable (anon) Key
- `GEMINI_API_KEY`: Your Google Gemini API Key (kept strictly server-side)
- *(Note: If port `8000` is already in use on your machine, set `APP_PORT=8001` or pass `--port 8001` when starting Uvicorn, and match `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.)*

### Frontend (`frontend\.env.local`)

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

Edit `frontend\.env.local` and fill in:

- `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Publishable Key

---

## 2. Backend Setup & Execution (Windows PowerShell)

Open a PowerShell terminal in the repository root:

```powershell
cd backend
```

If `backend\.venv` does not exist yet, create it with Python 3.13:

```powershell
& "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe" -m venv .venv
```

Activate the virtual environment and install dependencies:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Start the FastAPI development server (excluding `.venv` from file watching):

```powershell
python run_dev.py
```

Or run Uvicorn directly:

```powershell
uvicorn app.main:app --reload --reload-dir app --reload-exclude ".venv" --host 127.0.0.1 --port 8000
```

Verify backend health in your browser or PowerShell:

- Health endpoint: `http://127.0.0.1:8000/api/v1/health`
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`

---

## 3. Frontend Setup & Execution (Windows PowerShell)

Open a **second** PowerShell terminal in the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser to view SkillPilot and verify live frontend-to-backend connectivity.

---

## 4. Supabase Database & Auth Setup (For New Project Clones)

Before signing up or testing onboarding on a fresh Supabase project, run the SQL files inside **Supabase Dashboard → SQL Editor** in this exact order (see `supabase/README.md`):

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_and_auth_triggers.sql`
3. `supabase/migrations/0003_storage_resumes.sql`
4. `supabase/migrations/0004_table_permissions.sql`
5. `supabase/seed/0001_seed_data.sql`

In **Supabase Dashboard → Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to **Redirect URLs**.

---

## Development Roadmap

- **Phase 1 (Complete):** Monorepo setup, Next.js + FastAPI initialization, Python 3.13 ML dependency verification, CORS, health check, Supabase & Gemini service configs, connectivity UI.
- **Phase 2 (Complete):** Normalized 15-table PostgreSQL schema, Row Level Security (RLS), least-privilege table grants, private PDF resume storage, Supabase Auth + FastAPI JWKS JWT verification, and 4-step onboarding.
- **Phase 3:** Resume PDF parsing (`PyMuPDF`), Gemini skill extraction, deterministic skill-gap engine, and semantic hybrid recommendation engine (`sentence-transformers` + `scikit-learn`).
- **Phase 4:** Adaptive 30/60/90-day roadmaps, rescheduling, and Skill Passport progress tracking.
- **Phase 5:** Agentic Gemini function-calling career assistant, Realtime manager analytics dashboard, and career intelligence feed.
- **Phase 6:** Premium UI integration (v0, 21st.dev, Magic UI, React Bits) & Recharts visualizations.
- **Phase 7:** End-to-end testing and deployment (Vercel + Render).
