# RITI - Agent Instructions & Project Context

## Project Overview
RITI is an automated examination scheduling system for educational institutions. The system allocates examinations, rooms, and invigilators while respecting room capacity, availability, accessibility requirements, and scheduling conflicts. The goal is a reliable, easy-to-use system that minimizes manual work and handles last-minute disruptions efficiently.

## Core Functional Requirements
1. **Resource Management:** Manage exams, student counts, room capacities, accessibility, and faculty availability.
2. **Intelligent Scheduling Engine:** A constraint-based solver.
   - **Hard Constraints (Must Not Violate):** Room capacity, no overlapping rooms, no overlapping faculty duties, respect faculty/room availability, fulfill accessibility needs, full invigilation coverage.
   - **Optimization (Soft Constraints):** Optimize room utilization, balance faculty workload, minimize changes to existing schedules.
3. **Administrative Dashboard:** Intuitive UI for schedule generation, reviewing allocations, and conflict identification.
4. **Emergency Conflict Resolution:** Handle last-minute invigilator unavailability by finding a suitable replacement with minimal disruption.
5. **AI-Powered Insights:** Use MiMo LLM API for summaries and insights (must not replace deterministic scheduling).

## Prioritization Rules (Highest to Lowest)
1. Correctness of scheduling constraints.
2. Data integrity and reliable backend behavior.
3. Successful end-to-end scheduling workflow.
4. Emergency conflict resolution.
5. Clear and usable administrative interface.
6. AI-generated insights.
7. Optional optimizations and visual enhancements.

## Engineering Standards
- **Strictly use JavaScript (JS) only.** Do NOT use TypeScript (TS).
- **Backend:** Node.js, Express, Neon DB Serverless.
- **Frontend:** React, Vite, Tailwind CSS v4, Shadcn UI.
- Separate scheduling logic from presentation logic.
- The deterministic solver handles constraints; AI provides descriptive insights only.
- Preserve database consistency and validate all user inputs.
- Never claim a feature is complete without appropriate verification.
