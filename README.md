# PressLens ⚽🔍

**PressLens** is an AI-powered tactical football analysis application that transforms match events, tracking data, and pressing dynamics into actionable tactical insights.

---

## Architecture Overview

The repository is structured into two primary components:

- **`backend/`**: FastAPI service running on Python 3.13+. Handles tactical geometry and spatial calculations, Groq LLM orchestration (`llama-3.3-70b-versatile`), FastEmbed local vector embeddings (`BAAI/bge-small-en-v1.5`), structured Pydantic schema validation, and PostgreSQL data persistence with SQLAlchemy 2.0 Async.
- **`frontend/`**: Modern React 19 single-page application built with TypeScript, Vite, SVG tactical pitch board, and Lucide icons for interactive pressing visualizations and fan-focused tactical breakdowns.

---

## Standards and Agent Guidelines

This project enforces strict engineering and agent guidelines. Refer to the standards directories before contributing or executing tasks:

- **Main Agent Instructions:** [`AGENTS.md`](AGENTS.md)
- **Engineering & AI Standards:** [`.agents/`](.agents/)
  - [`engineering-standards.md`](.agents/engineering-standards.md) – 10 mandatory engineering standards.
  - [`ai-agent-standards.md`](.agents/ai-agent-standards.md) – FDE & AI Agent engineering principles.
  - [`git-conventions.md`](.agents/git-conventions.md) – Git author identity & Conventional Commits.
  - [`execution-workflow.md`](.agents/execution-workflow.md) – Task execution & verification workflow.
- **Reusable Agent Skills:** [`.skills/`](.skills/)
  - [`code-quality`](.skills/code-quality/SKILL.md) – Linting and type checking procedures.
  - [`tactical-analysis-ai`](.skills/tactical-analysis-ai/SKILL.md) – AI prompt engineering & domain grounding.
  - [`verification-runner`](.skills/verification-runner/SKILL.md) – Mandatory verification steps.
  - [`git-commits`](.skills/git-commits/SKILL.md) – Git workflow runbook.

---

## Local Setup & Development

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   ```bash
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   # macOS / Linux
   source .venv/bin/activate
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Configure your `DATABASE_URL` (PostgreSQL) and `GROQ_API_KEY`.
4. Run database migrations (or rely on automated table initialization during startup):
   ```bash
   alembic upgrade head
   ```
5. Run the development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   API interactive documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Access the frontend at `http://localhost:5173` (or `http://127.0.0.1:5173`).
4. Verify code quality (zero ESLint errors policy):
   ```bash
   npm run lint
   npm run build
   ```

---

## Production Deployment Guide

PressLens is engineered to run seamlessly both in local development and across modern cloud platforms.

### Backend Cloud Deployment (Render, Railway, Fly.io, Heroku, AWS App Runner)
- **Runtime**: Python 3.11+
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}` (or use the provided [`Procfile`](Procfile))
- **Environment Variables**:
  - `APP_ENV`: `production`
  - `DATABASE_URL`: Your managed PostgreSQL connection URL (e.g. Supabase, Neon, AWS RDS, Railway Postgres). Cloud URLs prefixed with `postgres://` or `postgresql://` are automatically adapted to `postgresql+asyncpg://` at runtime.
  - `GROQ_API_KEY`: Your Groq API key.
  - `CORS_ORIGINS`: Your deployed frontend origin(s), e.g. `["https://your-frontend.vercel.app"]` or comma-separated string.
- **Auto-Initialization**: On startup, the backend automatically verifies database connectivity, creates any missing tables via `Base.metadata.create_all`, and auto-seeds initial tactical scenarios and literature chunks if the database is fresh.

### Frontend Cloud Deployment (Vercel, Netlify, Cloudflare Pages)
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Routing**: Single-page application route rewrites are pre-configured via [`vercel.json`](frontend/vercel.json) and [`public/_redirects`](frontend/public/_redirects) so direct links (e.g. `/analysis/:id`) resolve smoothly without 404s.
- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL of your deployed backend API, e.g. `https://your-backend.onrender.com/api/v1`. If deploying frontend and backend on the same domain or behind a reverse proxy, leave this unset to automatically use relative `/api/v1`.

---

## Git Conventions

- **Author Identity:** Configured locally as `Jay <jayeshsutar312@gmail.com>`.
- **Commit Messages:** Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`).
