# System Architecture & Technical Specifications
## Smart Cloud Resource Waste Detector (CloudWise)

### 1. High-Level Architectural Overview

The **Smart Cloud Resource Waste Detector** is designed as a decoupled, production-grade microservice architecture comprising:
1. **Frontend Presentation Layer**: Built with React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, and Recharts. Features a dark-navy glassmorphism UI styled after enterprise cloud operations centers.
2. **Backend Application Layer**: Built with Python FastAPI, Pydantic v2 validation, and SQLAlchemy ORM. Exposes RESTful endpoints, background analysis jobs, structured logging, and an algorithmic waste engine.
3. **Database Persistence Layer**: PostgreSQL for containerized deployments with automatic SQLite zero-setup local fallback.
4. **Cloud Telemetry Ingestion & Simulation**: Dual-mode engine supporting deterministic multi-wave simulation and optional read-only AWS integration via Boto3.

```mermaid
graph TD
    Client["React 19 / Vite Web Dashboard"]
    API["FastAPI REST Application Layer"]
    DB[("PostgreSQL / SQLite Database")]
    Engine["Waste Detection Engine (Rules A - H)"]
    Cost["Cost Estimation Engine (730h/mo)"]
    Sim["Time-Series Simulator"]
    AWS["Optional AWS Adapter (Boto3)"]

    Client -->|JWT Bearer Auth & REST| API
    API -->|Session Dependency| DB
    API -->|Trigger Scan| Engine
    Engine -->|Queries Historical Telemetry| DB
    Engine -->|Generates Findings & Recs| DB
    Engine -->|Invokes Cost Deduplication| Cost
    Sim -->|Generates Realistic Telemetry| DB
    AWS -.->|Read-Only Ingestion| API
```

### 2. Multi-Cloud Resource & Waste Engine Flow

The rule-based analysis engine implements 8 enterprise heuristics (Rules A through H):

```mermaid
flowchart TD
    Start["Initiate Fleet Scan"] --> Query["Fetch Resources & 30-Day Metrics"]
    Query --> CheckEBS{"Is Block Storage Detached?"}
    CheckEBS -- Yes (Days >= 7) --> FlagE["Rule E: Unattached Storage (100% Avoidable)"]
    CheckEBS -- No --> CheckVM{"Is Compute Running?"}
    
    CheckVM -- Yes --> MetricCheck{"Metrics Count >= Min Threshold?"}
    MetricCheck -- Yes --> EvalAvgCPU{"Average CPU Analysis"}
    
    EvalAvgCPU -- CPU < 5% --> FlagA["Rule A: Idle Compute (Stop / Schedule)"]
    EvalAvgCPU -- 5% <= CPU < 20% --> FlagB["Rule B: Underutilized Compute (Downsize 45%)"]
    EvalAvgCPU -- CPU >= 20% --> CheckRAM{"Memory Telemetry Available?"}
    
    CheckRAM -- RAM < 25% --> FlagC["Rule C: Low Memory Utilization (Rebalance)"]
    CheckRAM -- Normal --> CheckDB{"Is Managed Database?"}
    
    CheckDB -- Low CPU & Conn --> FlagF["Rule F: Oversized Database Tier"]
    CheckDB -- Normal --> CheckLB{"Is Load Balancer?"}
    
    CheckLB -- Net < 0.5 MB/s --> FlagG["Rule G: Inactive Load Balancer"]
    CheckLB -- Normal --> CheckStale{"Inactivity > 14 Days?"}
    CheckStale -- Yes --> FlagH["Rule H: Stale Inactive Resource"]
    
    FlagA --> RecEngine["Generate De-duplicated Recommendations"]
    FlagB --> RecEngine
    FlagC --> RecEngine
    FlagE --> RecEngine
    FlagF --> RecEngine
    FlagG --> RecEngine
    FlagH --> RecEngine
    RecEngine --> Audit["Audit Log & Human-in-the-Loop Review"]
```

### 3. Cost Model & Avoidable Savings Formulation

Continuous running resources are calculated on the industry standard of **730 billable hours per month**:
$$\text{Monthly Cost} = \text{Hourly Rate} \times 730$$

Avoidable savings are calculated using strict proportioning:
- **Detached Block Storage**: 100% of volume fee is avoidable.
- **Idle Non-Production Compute**: 100% of instance fee is avoidable if stopped, or 75% if scheduled outside working hours.
- **Underutilized Compute (Downsizing)**: 45% conservative reduction based on standard AWS/GCP instance stepping.
- **Low-Traffic Load Balancers**: 100% baseline fee reduction upon consolidation.
- **Deduplication**: If a resource triggers both Rule A and Rule B, only the higher single avoidable saving is credited to prevent double-counting.
