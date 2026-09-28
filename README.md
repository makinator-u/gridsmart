# GridSmart — Rural Feeder Decision Support & Load Management System

> 📖 **Comprehensive Project Documentation & Mathematical Guide:** See [PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md) for full architectural diagrams, MILP formulations, ML anomaly detection models, and pointer-by-pointer breakdown.

**GridSmart** is a full-stack distribution-grid operator decision support system designed for rural electricity networks. It empowers control room operators to monitor feeder health, detect overloads and power shortages, identify statistical load anomalies using AI, and generate safe, fair load management plans using Mixed-Integer Linear Programming (MILP).

> **Architectural Note:**
> "The prototype does not assume access to live utility infrastructure. It uses simulated and manually supplied data to reproduce the type of operating conditions a distribution control room may encounter. The software architecture separates the data source from the decision engine, allowing future integration with SCADA, AMI, IoT or utility APIs."

---

## 🌟 Key Features

1. **Data Source Abstraction & Labeling**:
   - Explicit UI status badge (`Data Source: Demo Simulation` / `Manual Entry` / `CSV Upload`).
   - Clean `BaseDataSource` interface for future SCADA (DNP3 / IEC 60870-5-104) and AMI integration without touching the optimization logic.

2. **Data Ingestion Methods**:
   - **Demo Simulator**: One-click generation of a 6-feeder, 10-village rural network with 1000+ consumers.
   - **Manual Wizard**: 6-step setup wizard for Substation, Feeders, Consumer Groups, Priorities, and Initial Loads.
   - **CSV Upload**: Import custom Feeders CSV and Consumer Groups CSV with downloadable sample templates.

3. **Live Feeder Simulation Engine**:
   - Real-time time progression (1x, 5x, 10x speeds) with diurnal curves for Residential, Agricultural, Commercial, and Critical loads.
   - **Interactive Event Injection**: Inject Agri demand surges, domestic peaks, generation drops, feeder fault trips, or maintenance outages live.

4. **AI Anomaly Detection**:
   - Uses **scikit-learn Isolation Forest** to detect statistical feeder load anomalies (spikes/unusual draws) for decision support without taking automated control actions.

5. **MILP Optimization Engine (PuLP CBC)**:
   - Solves supply-demand deficits using Mixed-Integer Linear Programming.
   - **Objectives**:
     1. Protect Priority 1 Critical Loads (Hospitals, Water Supply) at 100%.
     2. Keep feeder loads within thermal capacity limits.
     3. Minimize total load reduction while favoring flexible loads (Agriculture/Commercial).
     4. **Outage Fairness**: Factors historical village interruption hours into penalty weighting to prevent systemic bias.

6. **Operator Decision Support & Review**:
   - Displays clear actionable plans (`REDUCE`, `SHIFT`, `KEEP ON`, `RESTORE`) with operational timeline Gantt charts.
   - Requires human operator review and explicit `Approve` or `Reject` click before updating simulator grid state.

---

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Axios
- **Backend**: Python 3.14, FastAPI, Pydantic v2, SQLAlchemy, Pandas, NumPy, Scikit-learn (Isolation Forest), PuLP (MILP CBC Solver)
- **Database**: SQLite (default out-of-the-box local database) or PostgreSQL (via `DATABASE_URL` environment variable)

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 1. Install Backend Dependencies
```bash
cd backend
python -m pip install -r requirements.txt
```

### 2. Start Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
*API interactive documentation will be available at `http://127.0.0.1:8000/docs`.*

### 3. Install Frontend Dependencies & Start App
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🎬 Complete User Demonstration Journey

1. **Open GridSmart**: View top header displaying `Data Source: Demo Simulation` and current simulation clock.
2. **Load Demo Grid**: Click **"Load Demo Grid"** to initialize 6 feeders (F01–F06) and 10 villages.
3. **Start Simulation**: Click `▶ Start` on the dashboard or Simulation page.
4. **Inject Event**: Navigate to **Simulation** or **Dashboard** and click **"Inject Agri Demand"** on Feeder F02 (+1.5 MW).
5. **System Detects Shortage**: Alert appears: `Feeder F02 Overloaded` and `Substation Supply Deficit`.
6. **AI Anomaly Monitor**: View **Alerts & AI** tab to see scikit-learn Isolation Forest flag unusual load behavior.
7. **Generate MILP Recommended Plan**: Click **"Generate MILP Plan"**.
8. **Operator Review**: Inspect the recommended action plan: Agriculture load reduced on F02, Critical Hospital/Water Supply kept 100% ON. View the operational timeline.
9. **Operator Approval**: Click **[Approve Plan]**. The simulator state updates instantly, returning feeder loading below capacity.
10. **Audit Log & Outage Equity**: Check **Outage Equity** and **Event History** tabs to verify recorded decisions and village balance.
