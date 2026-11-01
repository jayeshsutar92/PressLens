# PressLens ⚽🔍

**PressLens** is an AI-powered tactical football analysis application that transforms match events, tracking data, and pressing dynamics into actionable tactical insights.

---

## Architecture Overview

The repository is structured into two primary components:

- **`backend/`**: FastAPI service running on Python 3.13+. Handles tactical calculation logic, Groq LLM orchestration, structured Pydantic schema validation, and MongoDB data persistence.
- **`frontend/`**: Modern React 19 single-page application built with TypeScript, Vite, Tailwind CSS, and Lucide icons for interactive tactical pitch boards and match event visualizations.

---

## Standards and Agent Guidelines

This project enforces strict engineering and agent guidelines. Refer to the standards directories before contributing or executing tasks:

- **Main Agent Instructions:** [`AGENTS.md`](file:///d:/Personal%20Project/PressLens/AGENTS.md)
- **Engineering & AI Standards:** [`.agents/`](file:///d:/Personal%20Project/PressLens/.agents)
  - [`engineering-standards.md`](file:///d:/Personal%20Project/PressLens/.agents/engineering-standards.md) – 10 mandatory engineering standards.
  - [`ai-agent-standards.md`](file:///d:/Personal%20Project/PressLens/.agents/ai-agent-standards.md) – FDE & AI Agent engineering principles.
  - [`git-conventions.md`](file:///d:/Personal%20Project/PressLens/.agents/git-conventions.md) – Git author identity & Conventional Commits.
  - [`execution-workflow.md`](file:///d:/Personal%20Project/PressLens/.agents/execution-workflow.md) – Task execution & verification workflow.
- **Reusable Agent Skills:** [`.skills/`](file:///d:/Personal%20Project/PressLens/.skills)
  - [`code-quality`](file:///d:/Personal%20Project/PressLens/.skills/code-quality/SKILL.md) – Linting and type checking procedures.
  - [`tactical-analysis-ai`](file:///d:/Personal%20Project/PressLens/.skills/tactical-analysis-ai/SKILL.md) – AI prompt engineering & domain grounding.
  - [`verification-runner`](file:///d:/Personal%20Project/PressLens/.skills/verification-runner/SKILL.md) – Mandatory verification steps.
  - [`git-commits`](file:///d:/Personal%20Project/PressLens/.skills/git-commits/SKILL.md) – Git workflow runbook.

---

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```powershell
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   Configure your `GROQ_API_KEY` and `MONGODB_URL`.
4. Run the development server:
   ```bash
   fastapi dev app/main.py
   ```
   API documentation is available at `http://localhost:8000/docs`.

### Frontend Setup

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
4. Verify code quality (zero ESLint errors policy):
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

---

## Git Conventions

- **Author Identity:** Configured locally as `Jay <jayeshsutar312@gmail.com>`.
- **Commit Messages:** Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`).

