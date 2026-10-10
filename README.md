# 🏆 RITI - AI-Powered Academic Scheduler

**Built for the col-gl Hackathon**

RITI is an intelligent, high-density dashboard and algorithmic engine designed to solve the NP-Hard problem of academic exam scheduling. It eliminates scheduling conflicts and integrates AI to ensure faculty fairness and zero-friction emergency recovery.

## ✨ Key Features
1. **Greedy Backtracking Engine:** A pure-JS deterministic solver that cross-references capacity limits, time overlaps, and faculty availability to automatically generate a zero-conflict exam schedule.
2. **Zero-Friction Emergency Repair:** When a room floods or faculty calls in sick, the UI calculates a surgical "minimal-impact replacement" that repairs the schedule without causing cascading timeline disruptions.
3. **AI Chief Academic Officer:** Integrated with the **MiMo LLM API**, the system audits the raw scheduling data to identify hidden human-factor issues (e.g., faculty burnout, massive rooms used for tiny classes, unfair clustering).
4. **Impeccable UI:** Built with React, Tailwind CSS v4, and Shadcn, the interface focuses on high-density scannability and premium UX, utilizing a centralized architecture.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Shadcn UI, React-Markdown
- **Backend:** Node.js, Express.js
- **Database:** Neon Serverless PostgreSQL, Drizzle ORM
- **AI Integration:** Xiaomi MiMo LLM API

## 🚀 How to Demo
1. **View Baseline Data:** Click through the Exams, Rooms, and Faculty tabs to observe the raw constraints (Capacities, Availability).
2. **Generate Schedule:** Click the "Generate Schedule" button. The JS engine will instantly map exams to rooms/faculty and populate the allocations.
3. **Trigger an Emergency:** On any generated allocation, click "Faculty Sick". The system will instantly suggest an available substitute who is *not* double-booked during that exact timeframe. Click "Approve & Repair".
4. **Run AI Audit:** Navigate to the `AI Auditor` tab. Click "Initialize Audit" to invoke the MiMo LLM and receive a heuristic summary of the human-impact of the current schedule.

## ⚙️ Local Development
1. Clone the repository.
2. `cd backend && npm install`
3. Add your Neon DB URL and MIMO API key to `backend/.env`.
4. `npm run seed` to load the 15+ complex test exams.
5. `npm run dev` in both the `frontend/` and `backend/` directories.
