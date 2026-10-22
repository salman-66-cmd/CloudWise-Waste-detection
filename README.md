# CloudWise: Smart Cloud Resource Waste Detector & Cost Optimizer
### Intelligent Multi-Cloud Resource Governance & Waste Detection System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Language-Python_3.11+-3776AB.svg?style=flat&logo=python)](https://www.python.org)
[![Tests](https://img.shields.io/badge/Tests-Passing_100%25-brightgreen.svg)]()

---

## 1. Project Overview & Problem Statement

Modern cloud infrastructure sprawls rapidly across enterprise teams, resulting in substantial **cloud waste**—often comprising 30% to 45% of total monthly cloud expenditure. Common culprits include:
- Compute instances left running 24/7 in development or QA environments without traffic.
- Over-provisioned virtual machines and databases sized for peak loads that never materialize.
- Detached, abandoned block storage volumes (e.g., EBS/Persistent Disks) lingering after instances are terminated.
- Inactive load balancers routing negligible packets while incurring static hourly provision fees.

**CloudWise** is a full-stack, production-grade cloud governance platform that continuously monitors cloud assets, executes multi-reading rule-based heuristic waste detection, calculates exact avoidable dollar costs, and orchestrates human-in-the-loop optimization workflows.

---

## 2. Key Objectives & Features

1. **Realistic Zero-Cost Simulation**: Generates multi-day diurnal time-series metrics (CPU, RAM, Network, Storage) across Virtual Machines, Containers, Databases, and Storage Volumes without requiring a paid cloud account.
2. **Optional AWS Integration**: Read-only Boto3 adapter for live EC2 and EBS discovery with safe credential isolation.
3. **Algorithmic Waste Engine (Rules A–H)**:
   - **Rule A (Idle VMs)**: Average CPU < 5% across observation window.
   - **Rule B (Underutilized VMs)**: Average CPU < 20% triggering rightsizing calculations.
   - **Rule C (Low Memory)**: RAM < 25% evaluated safely only when agent telemetry exists.
   - **Rule E (Unattached Storage)**: Storage detached > 7 days (100% avoidable).
   - **Rule F (Oversized Databases)**: DB CPU < 15% and low connection load.
   - **Rule G (Low-Traffic LBs)**: Network throughput < 0.5 MB/s.
   - **Rule H (Stale Resources)**: Inactivity > 14 days.
4. **Avoidable Savings Calculation**: Deduplicated savings based strictly on the avoidable portion of resource fees over 730 monthly billable hours.
5. **Human-in-the-Loop Governance**: Review-only workflow (`New` $\rightarrow$ `Under Review` $\rightarrow$ `Approved` / `Rejected` $\rightarrow$ `Completed`) with operational rollback notes and audit logging.
6. **Dark Glassmorphism Interface**: Tailored dark navy/slate dashboard with Recharts visualizations, interactive inventory filters, CSV import/export, and PDF-ready reporting.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Axios, React Router.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Jose JWT, Bcrypt, Boto3.
- **Databases**: SQLite (zero-setup local fallback) / PostgreSQL 16 (production container).
- **Testing**: Pytest (backend unit/integration tests) & Vitest (frontend component tests).
- **Infrastructure**: Docker & Docker Compose with multi-stage builds and healthchecks.

---

## 4. System Architecture & Data Flow

```mermaid
graph TD
    User["DevOps / Cloud Architect"]
    UI["CloudWise React Dashboard (Port 5173 / 3000)"]
    API["FastAPI Backend Server (Port 8000)"]
    DB[("PostgreSQL 16 / SQLite Database")]
    Engine["Waste Detection Engine (Rules A - H)"]
    Cost["Cost & Savings Calculator (730h)"]
    Sim["Telemetry & Asset Simulator"]
    AWS["Optional AWS Boto3 Adapter"]

    User -->|Interacts via Browser| UI
    UI -->|JWT Bearer Auth & REST APIs| API
    API -->|Session Management| DB
    API -->|Triggers Scans| Engine
    Engine -->|Reads Multi-Day Metrics| DB
    Engine -->|Stores Findings & Alerts| DB
    Engine -->|Invokes Formula| Cost
    Sim -->|Generates Diurnal Telemetry| DB
    AWS -.->|Read-Only Inspection| API
```

---

## 5. Quick Start & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Local Full-Stack Setup (Zero-Cost Local Mode)

#### 1. Clone & Enter Project
```bash
cd "c:\Users\Admin\Documents\Project 16"
```

#### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start backend server (starts on http://localhost:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Note: On first startup, the database `cloudwise.db` is initialized automatically, the demo administrator account `admin@cloudwise.io` is seeded, and sample multi-cloud resources and telemetry are populated!*

#### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install packages
npm install

# Start Vite development server (starts on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 6. Demo Account Credentials

A pre-configured development demo administrator account is available out-of-the-box:
- **Email**: `admin@cloudwise.io`
- **Password**: `DemoAdmin123!`
*(Or click the one-click **"Fill Demo Credentials"** button on the login screen!)*

---

## 7. Running Tests

### Backend Automated Test Suite
From the project root:
```bash
python -m pytest backend/tests -v
```
*(All 11 tests covering authentication, resource CRUD, waste detection heuristics, simulator seeding, and recommendation workflows pass with 100% success).*

### Frontend Component & Build Tests
```bash
cd frontend
npm test
npm run build
```
*(Vitest unit tests and Vite production bundle build succeed with 0 errors).*

---

## 8. Docker Compose Deployment

To deploy the entire multi-container stack with PostgreSQL:

```bash
docker-compose up --build -d
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **PostgreSQL Database**: `localhost:5432`

---

## 9. Optional AWS Integration Setup

If you wish to test with real AWS resources (read-only):
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your read-only IAM credentials:
   ```env
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_DEFAULT_REGION=us-east-1
   AWS_ENABLED=true
   ```
3. Navigate to **Settings** $\rightarrow$ click **"Test AWS Connection & Sync"**.
*No AWS keys are ever logged or exposed via API responses.*

---

## 10. Application Screens & Capturing Screenshots

The application includes 9 fully functioning pages:
1. **Overview Dashboard** (`/`): Summary cards, savings trend bar chart, fleet utilization line chart, inventory breakdown pie chart, top 5 wasteful assets, recent system events.
2. **Cloud Resources** (`/resources`): Searchable, filterable multi-cloud inventory with CPU/RAM load bars, Add/Edit modals, and CSV Import/Export.
3. **Waste Detection** (`/waste`): Algorithmic engine findings with severity badges, rule descriptions, telemetry evidence, and review status dropdowns.
4. **Cost Analytics** (`/cost`): Hourly/daily/monthly cost metrics, before-and-after optimization comparison, and provider spend breakdown.
5. **Optimization Recommendations** (`/recommendations`): Governance review workflow (`Approved`, `Under Review`, `Rejected`, `Completed`) with operational rollback notes.
6. **Alerts** (`/alerts`): Anomaly triggers, read/unread states, and resolve/reopen actions.
7. **Reports** (`/reports`): Audit certificate, summary statistics, printable/PDF view, and CSV report export.
8. **Settings** (`/settings`): Configurable heuristic thresholds and AWS connection status.
9. **User Profile** (`/profile`): User account details, session security, and password modification.

---

## 11. Limitations & Future Enhancements

- **Current Limitations**: Cloud cost estimation assumes continuous running (730 hours/month baseline). Automated destructive cloud mutation is intentionally disallowed to protect production assets.
- **Future Enhancements**: Integration with Azure Resource Graph and Google Cloud Asset Inventory; automated Terraform PR generation for approved rightsizing actions.
