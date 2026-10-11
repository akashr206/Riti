# RITI - The Art of Perfect Allocation

<div align="center">
  <h3>Team Arise | CBC 2.0 Hackathon</h3>
  <p>Problem 34: Exam Room & Invigilator Allocation | Domain: Software and Web Development</p>
  <p><b>UVCE & KSIT</b></p>
</div>

---

## The Problem

Educational institutions face a massive logistical challenge every semester: organizing examinations across multiple rooms while assigning invigilators. Room capacity, student counts, and invigilator availability must all be perfectly balanced.

**What is going wrong?**
- **The Chaos of Last-Minute Changes:** A professor calls in sick, and the replacement cannot reach the next exam hall on time, leaving 100 students unsupervised.
- **Unfair Duties & Inaccessible Rooms:** Manual methods are slow and error-prone, while basic software ignores travel time, accessibility needs, and faculty workload fairness.
- **The Cost of Inaction:** Wasted administrative time, exam delays, and high staff stress levels.

## Our Solution

We help educational institutions plan exams smoothly using smart algorithms that handle last-minute changes, ensure fair invigilator duties, and provide accessible rooms, unlike older systems that only flag errors.

### How it works:
1. **Input:** Admins feed in exam details, room capacity/accessibility, faculty availability, duty history, and student special needs.
2. **Process:** Our system automatically fixes last-minute changes, ensures fair duties, accounts for travel time, assigns accessible rooms, prevents cheating, and plans standby staff.
3. **Outcome:** Saves time and money, ensures fair faculty schedules, helps exams start on time, and completely removes the stress of exam day.

## Key Features

- **Smart Exam Scheduling:** Manage exams, room capacities, and faculty availability in one place to create conflict-free schedules powered by **Google OR-Tools**.
- **Instant Conflict Resolution:** Automatically find suitable replacements for absent faculty and intelligently suggest emergency swaps with minimal disruption.
- **Fair Duty Distribution:** Track past duties and seamlessly balance weekend, evening, and heavy-hall shifts to ensure fair workloads.
- **Travel-Aware Scheduling:** Consider physical distances between campus buildings to guarantee enough transit time between consecutive exam duties.
- **Accessible Room Allocation:** Identify students with special needs and strictly assign them to suitable rooms equipped with wheelchair access, ramps, or elevators.
- **AI-Powered Insights:** Generate natural-language strategic analysis of the daily schedule, like room utilization and faculty alignment, using the **MiMo LLM API**.

## Architecture Flow

- **User Layer:** Admin dashboard, faculty portal, schedule management, and emergency alerts.
- **Application Layer:** Express APIs, scheduling logic, conflict resolution, duty fairness, and accessibility checks.
- **Data & AI Layer:** Exam and faculty data, PostgreSQL, OR-Tools solver, standby predictions, and MiMo for descriptive insights.

## Tech Stack

- **Design:** Google Stitch
- **Frontend:** React (Vite), Tailwind CSS, Shadcn UI
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **AI & Optimization:** **Google OR-Tools** (for heavy constraint-satisfaction solving), **MiMo LLM API**

## Innovation & Differentiation

**Our unique edge:** We automatically resolve emergencies while ensuring fair faculty duties, practical campus travel times, and accessible exam rooms. Existing systems only flag conflicts, we actually fix them.

- **Ease of Use:** One-click allocation, smart drag-and-drop edits, and automated emergency rescheduling instead of tedious spreadsheet management.
- **Cost / Access:** An affordable, modular solution designed to integrate directly with existing university portals.
- **Personalization:** Fair duties based on workload, transit constraints, and subject expertise.
- **Scalability:** By handling complex scheduling calculations separately with OR-Tools, the system can grow from a small college department to large testing centers worldwide.

## Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/akashr206/Riti.git
   cd Riti
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables:**
   Create a `.env` file in the `backend` directory and add your configurations:
   ```env
   DATABASE_URL=<your-postgresql-url>
   MIMO_API_KEY=<your-mimo-api-key>
   ```

5. **Run the application:**
   Start the backend server (from the `backend` directory):
   ```bash
   npm run start
   ```
   Start the frontend server (from the `frontend` directory in a new terminal):
   ```bash
   npm run dev
   ```
