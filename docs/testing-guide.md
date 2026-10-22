# Testing & Quality Assurance Guide
## Smart Cloud Resource Waste Detector

### 1. Test Architecture Overview

Quality verification is divided into two primary automated suites:
1. **Backend Integration & Unit Tests (`pytest`)**:
   - Authentication and authorization verification
   - Resource inventory CRUD and CSV exports
   - Simulator metric seeding and time-series consistency
   - Waste detection engine rules (Idle detection, unattached storage, rightsizing)
   - Cost deduplication and savings calculation formulas
   - Recommendation status transition workflow
2. **Frontend Component & Build Tests (`vitest` + `tsc` + `vite build`)**:
   - TypeScript static type checking
   - React component rendering and delta badge verification
   - Production bundle packaging and tree-shaking validation

---

### 2. Executing Backend Tests

From the project root:

```powershell
python -m pytest backend/tests -v
```

**Expected Result:**
```
======================= 11 passed in 1.96s =======================
```

**Test Coverage Highlights:**
- `test_health_check`: Verifies FastAPI starts and connects to the database.
- `test_login_success`: Validates JWT token minting for `admin@cloudwise.io`.
- `test_create_and_get_resource`: Confirms resource insertion, hourly-to-monthly cost calculation ($0.0416 \times 730 = \$30.37$).
- `test_csv_export`: Validates CSV MIME headers and column headers.
- `test_simulator_and_waste_detection`: Tests full pipeline from synthetic time-series generation to rule-based engine detection.
- `test_recommendation_workflow`: Tests human approval workflow with audit notes.

---

### 3. Executing Frontend Tests & Production Build

From the `frontend/` directory:

```powershell
cd frontend
npm test
npm run build
```

**Expected Result:**
```
✓ src/__tests__/StatCard.test.tsx (1 test) 106ms
Test Files  1 passed (1)
Tests  1 passed (1)

✓ built in 4.61s
dist/assets/index-*.css   51.21 kB
dist/assets/index-*.js   825.27 kB
```
