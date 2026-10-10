# RITI - Session State

## Current Status
- **Active Phase:** Phase 4 (Conflict Management & Rescheduling)
- **Overall Progress:** ~65%

## Verified Progress
- Initialized Vite + React frontend (Tailwind v4, Shadcn).
- **Backend Restructured**: Strict MCR (Models, Controllers, Routes) architecture implemented for the API.
- Designed the database schema (Exams, Rooms, Faculty, Allocations) using Drizzle ORM in pure JS.
- **Completed Phase 2**: Built the constraint-based scheduling engine (`services/solver.js`) with greedy backtracking and double-booking validations.
- **Completed Phase 3**: Built the Frontend Dashboard.
- Dashboard implements `design-taste-frontend` skills (Operate mode: clean, high density, fast scanability).
- Wired frontend to backend API to view exams, rooms, faculty, and generate/display the schedule.

## Incomplete Work / Next Steps
- Implement manual override and conflict resolution UI (Phase 4).
- Add LLM insights (Phase 5).

## Unresolved Issues & Blockers
- Awaiting user to test the frontend and backend integration locally.

## Important Technical Decisions
- **Database:** Neon DB serverless driver.
- **Styling:** Tailwind CSS v4 + Shadcn UI.
- **Documentation:** Persistent tracking kept in `docs/` folder to maintain context across sessions.
