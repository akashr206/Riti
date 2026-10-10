 # RITI - Development Plan

The overall development budget is approximately 20 hours. We will follow these phases strictly:

## Phase 1 — Setup and Foundation
- **Goal:** Establish the environment, DB configuration, data model, and seed data.
- **Tasks:**
  - [x] Configure frontend (Vite, React, Tailwind v4, Shadcn)
  - [x] Configure backend (Express, Neon DB serverless)
  - [x] Design database schema for Exams, Rooms, Faculty, Allocations, and Constraints
  - [x] Implement robust seed data generation
  - [x] Create basic CRUD endpoints
- **Completion Condition:** Application starts successfully, DB is accessible, seeded data is retrievable via backend.

## Phase 2 — Core Solver Engine
- **Goal:** Implement the constraint-based scheduling engine.
- **Tasks:**
  - [x] Build the scheduling algorithm prioritizing hard constraints.
  - [x] Integrate solver with backend.
  - [x] Handle infeasible inputs and validate allocations independently.
  - [x] Test edge cases (conflicting inputs, unavailable resources).
- **Completion Condition:** Engine generates valid allocations for feasible inputs and correctly rejects infeasible cases.

## Phase 3 — Frontend Dashboard Integration
- **Goal:** Build the administrative interface.
- **Tasks:**
  - [x] Build UI to view and manage exams, rooms, and faculty.
  - [x] Connect dashboard to backend scheduling API.
  - [x] Visualize schedule results, loading states, and errors clearly.
- **Completion Condition:** Administrator can initiate scheduling and review results through the UI.

## Phase 4 — High-Impact Features
- **Goal:** Emergency replacement and AI integration.
- **Tasks:**
  - [x] Implement emergency faculty replacement workflow (minimal-change repair strategy).
  - [x] Integrate MiMo LLM API for descriptive schedule summaries and insights.
- **Completion Condition:** Emergency workflow works for valid scenarios. AI insights run correctly on verified schedule data.

## Phase 5 — Testing, Polish, and Demonstration
- **Goal:** Stabilize the system.
- **Tasks:**
  - [x] Fix critical defects and verify main workflows.
  - [x] Ensure invalid schedules cannot be published.
  - [x] Prepare reproducible demo data and rehearse.
- **Completion Condition:** Complete demonstration runs reliably from a clean setup.
