# API Overview & Reference
## Smart Cloud Resource Waste Detector REST API

Interactive OpenAPI documentation is automatically served at `/docs` (Swagger UI) and `/redoc` (ReDoc).

### Base URL
`http://localhost:8000/api`

---

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new administrator or standard user | No |
| `POST` | `/api/auth/login` | Authenticate with email/password and obtain JWT | No |
| `GET` | `/api/auth/me` | Fetch active user profile from token | Yes (Bearer) |

**Demo Administrator Credentials:**
- Email: `admin@cloudwise.io`
- Password: `DemoAdmin123!`

---

### Dashboard Telemetry (`/api/dashboard`)
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | `provider`, `environment` | Live aggregated statistics, active/idle count, savings, and top 5 wasteful assets |
| `GET` | `/api/dashboard/trends` | `days` (default 7) | Multi-day fleet CPU, memory, and spend trends |

---

### Cloud Resources Inventory (`/api/resources`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/resources` | Filter, search, and paginate managed cloud resources |
| `POST` | `/api/resources` | Register a new cloud resource |
| `GET` | `/api/resources/{resource_id}` | Retrieve individual resource profile |
| `PATCH` | `/api/resources/{resource_id}` | Update resource attributes or sizing |
| `DELETE` | `/api/resources/{resource_id}` | Remove resource and archive historical findings |
| `GET` | `/api/resources/export/csv` | Download complete asset inventory as CSV |
| `POST` | `/api/resources/import/csv` | Ingest bulk telemetry from CSV file |

---

### Waste Detection Engine (`/api/analysis`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analysis/run` | Trigger the rule-based waste detection engine |
| `GET` | `/api/analysis/findings` | List flagged waste findings with filters (severity, category) |
| `GET` | `/api/analysis/findings/{finding_id}` | Fetch detailed observation evidence for a finding |
| `PATCH` | `/api/analysis/findings/{finding_id}` | Update review status (new, acknowledged, resolved, dismissed) |

---

### Recommendations (`/api/recommendations`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recommendations` | List actionable rightsizing and shutdown recommendations |
| `PATCH` | `/api/recommendations/{id}` | Update status (`Approved`, `Under Review`, `Rejected`, `Completed`) |

---

### System & Health (`/api/health`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health-check endpoint verifying database connectivity |
| `GET` | `/api/settings` | Retrieve active heuristic thresholds |
| `PATCH` | `/api/settings` | Update heuristic thresholds dynamically |
| `GET` | `/api/settings/aws/status` | Verify AWS credential configuration |
| `POST` | `/api/settings/aws/sync` | Attempt live AWS inventory scan |
| `POST` | `/api/metrics/simulator/run` | Populate realistic demo data & regenerate metrics |
