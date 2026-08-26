# NEXOSHI Technical Documentation

**Project:** NEXOSHI - Adaptive Cyber Risk & Deception Investment Optimizer  
**Version:** 1.0.0  
**Status:** Synthetic-data prototype for SIH 2026  
**Last reviewed:** 2026-08-26

## 1. Purpose

NEXOSHI demonstrates a closed-loop cyber-risk workflow:

```text
RISK -> VALIDATE -> INVEST -> VERIFY -> LEARN
```

It calculates a normalized cyber-risk score, models attack paths, uses isolated synthetic deception assets to generate behavioral evidence, recommends security controls under a budget, and simulates post-investment verification.

This is a demonstration system. It does not scan real infrastructure, connect to threat-intelligence providers, use real credentials, or deploy controls to production systems.

## 2. Architecture

```text
Browser
  |
  | React Router pages and fetch('/api/v1/...')
  v
Vite dev proxy :3000  ----> FastAPI :8001
                                  |
                                  +--> SQLAlchemy ORM
                                  +--> SQLite database (nexoshi.db)
                                  +--> risk, attack graph, deception,
                                       evidence, investment, verification modules
```

### Frontend

- Location: `frontend/`
- Framework: React 19 with TypeScript and Vite
- Routing: `react-router-dom`
- Styling: Tailwind CSS through `@tailwindcss/vite`
- Charts: Apache ECharts through `echarts-for-react`
- Attack graph: `@xyflow/react`
- API wrapper: `frontend/src/api.ts`
- Development URL: `http://localhost:3000`
- Vite proxies `/api` to `http://127.0.0.1:8001`.

### Backend

- Location: `backend/`
- Framework: FastAPI
- ORM: SQLAlchemy
- Validation and serialization: Pydantic models
- Default database: SQLite
- Development API URL: `http://127.0.0.1:8001`
- OpenAPI documentation: `http://127.0.0.1:8001/docs`
- ReDoc documentation: `http://127.0.0.1:8001/redoc`

The backend creates database tables and seeds the demo catalog at startup. The frontend can also reset the complete demo state with the Reset demo environment action.

## 3. Frontend screens

Routes are registered in `frontend/src/App.tsx`.

| Route | Page | Main behavior |
| --- | --- | --- |
| `/` | Dashboard | Executive metrics, current risk, history, recommendations, and recent interactions |
| `/assets` | Asset Inventory | View/filter synthetic assets and vulnerabilities; add an asset |
| `/attack-graph` | Attack Graph | View React Flow nodes, attack edges, critical paths, and choke points |
| `/risk` | Risk Quantification | View score, confidence, financial exposure, threat likelihood, drivers, and snapshots |
| `/deception` | Deception Validation | Deploy decoys, simulate events, correlate evidence, and recalibrate risk |
| `/investment` | Investment Optimizer | Select a budget and calculate a control portfolio |
| `/verification` | Deploy & Verify | Simulate control deployment and compare before/after risk and loss |

The frontend sends JSON requests with `Content-Type: application/json`. It does not attach an API key, bearer token, session cookie, or other authentication credential.

## 4. Backend API

All application endpoints use the `/api/v1` prefix. Responses are JSON unless noted otherwise. The API currently has no authentication or authorization middleware.

### Demo and dashboard

| Method | Endpoint | Request | Response/purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/demo/reset` | None | Deletes demo records, reseeds data, regenerates paths, and returns `{status, baseline_risk}` |
| `GET` | `/api/v1/metrics` | None | Returns dashboard KPIs: score, loss, critical assets, risky paths, active decoys, interactions, and investment projections |

### Assets, vulnerabilities, and threats

| Method | Endpoint | Request | Response/purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/assets` | None | List all assets |
| `POST` | `/api/v1/assets` | `AssetCreate` | Create an asset and calculate criticality/exposure/risk contribution |
| `GET` | `/api/v1/assets/{asset_id}` | Path ID | Return one asset; `404` if missing |
| `GET` | `/api/v1/vulnerabilities` | None | List vulnerabilities |
| `POST` | `/api/v1/vulnerabilities` | `VulnerabilityCreate` | Create a vulnerability |
| `GET` | `/api/v1/threats` | None | List synthetic threats |
| `POST` | `/api/v1/threats` | `ThreatCreate` | Create a threat |

### Attack graph and risk

| Method | Endpoint | Request | Response/purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/attack-graph/generate` | None | Regenerate attack paths; returns generated count |
| `GET` | `/api/v1/attack-graph` | None | Return graph nodes, edges, and path summaries |
| `GET` | `/api/v1/attack-graph/choke-points` | None | Return assets ranked as attack-path choke points |
| `POST` | `/api/v1/risk/calculate` | None | Calculate and store a `current` risk snapshot |
| `GET` | `/api/v1/risk/current` | None | Return the latest risk snapshot or calculate one |
| `POST` | `/api/v1/risk/recalculate` | `{"evidence_confidence_boost": 0.2}` | Apply evidence adjustment and store a `validated` snapshot |
| `GET` | `/api/v1/risk/history` | None | Return up to 30 snapshots in ascending order |

### Deception and evidence

| Method | Endpoint | Request/query | Response/purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/deception/deploy` | `DeceptionDeployRequest` | Create or activate one decoy |
| `POST` | `/api/v1/deception/deploy-all` | None | Activate all `ready` decoys |
| `GET` | `/api/v1/deception/assets` | Optional `?status=ready\|active` | List deception assets |
| `POST` | `/api/v1/deception/simulate-event` | `SimulateEventRequest` | Store a specified synthetic interaction |
| `POST` | `/api/v1/deception/simulate-random` | `{"deception_asset_id": 1}` | Store a random event preset |
| `GET` | `/api/v1/deception/events` | Optional `?deception_id=1&limit=50` | Return newest interaction events |
| `GET` | `/api/v1/deception/summary` | None | Return totals, active/ready counts, engagement, and type counts |
| `GET` | `/api/v1/evidence/correlate` | None | Match event techniques to attack paths and calculate evidence metrics |

### Investment and verification

| Method | Endpoint | Request | Response/purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/controls` | None | List available security controls |
| `POST` | `/api/v1/investment/optimize` | `{"budget": 1000000}` | Calculate and store a budget-constrained control plan; budget must be positive |
| `GET` | `/api/v1/investment/recommendations` | None | Return the latest stored plan or `plan: null` |
| `POST` | `/api/v1/verification/run` | None | Simulate deployment, recalculate risk, mark the latest plan applied, and return feedback |
| `GET` | `/api/v1/verification/history` | None | Alias for risk history |

## 5. Request schemas

The canonical schemas are in `backend/app/schemas/schemas.py`.

### Create an asset

```json
{
  "name": "Analytics Server",
  "asset_type": "server",
  "ip_address": "10.0.5.10",
  "business_function": "Analytics",
  "criticality": "medium",
  "internet_exposed": false,
  "data_sensitivity": 3
}
```

`criticality` is normally `low`, `medium`, `high`, or `critical`. `data_sensitivity` is intended to be on a 1-5 scale.

### Create a vulnerability

```json
{
  "asset_id": 1,
  "cve_id": "CVE-2026-0001",
  "severity": 8.2,
  "exploitability": 0.7,
  "mitre_technique": "T1190",
  "description": "Synthetic vulnerability description"
}
```

### Deploy a decoy

```json
{
  "name": "QA Honeytoken",
  "deception_type": "honeytoken",
  "location": "QA VLAN"
}
```

### Simulate an interaction

```json
{
  "deception_asset_id": 1,
  "event_type": "credential_use",
  "technique": "T1078",
  "severity": 0.9,
  "source_ip": "203.0.113.7",
  "description": "Synthetic interaction"
}
```

### Optimize an investment

```json
{
  "budget": 1000000
}
```

### Recalculate with evidence

```json
{
  "evidence_confidence_boost": 0.25
}
```

## 6. Risk and optimization logic

### Asset risk

For each asset, the prototype combines criticality, exposure, and maximum vulnerability severity:

```text
asset risk = 100 * (0.45 * criticality score
                    + 0.25 * exposure score
                    + 0.30 * (maximum severity / 10))
```

Criticality scores are `low=0.25`, `medium=0.5`, `high=0.75`, and `critical=1.0`. Internet exposure and sensitivity are converted to an exposure score in `backend/app/data/seed.py`.

### Overall risk

The overall score is a weighted asset risk plus the average of the top three attack-path risks:

```text
overall risk = 0.55 * weighted asset risk + 0.45 * top-three path risk average
```

The final value is capped at 100. Expected loss is the sum of attack-path financial impacts. Confidence is the mean path confidence and is classified as low (`<0.45`), medium (`0.45-0.69`), or high (`>=0.70`).

### Evidence recalibration

Evidence events are matched to paths by MITRE technique. The recalculation endpoint increases the score based on event count and the requested confidence boost, increases path confidence, and stores a `validated` snapshot. This is a deterministic demo heuristic, not a calibrated statistical model.

### Investment optimization

Controls are ranked using expected reduction per lakh, a path-coverage boost, and a small effort adjustment. The implementation greedily selects controls that fit the budget while avoiding excessive path overlap. It stores an `InvestmentPlan`; it does not call a procurement system or deploy a real control.

### Verification

Verification applies a simulated mitigation based on the number of selected controls, reduces path likelihood/risk/financial impact, calculates a `post_investment` snapshot, marks the plan as applied, and returns next-cycle recommendations.

## 7. Data model and persistence

SQLAlchemy models are defined in `backend/app/models/models.py`:

| Table | Purpose |
| --- | --- |
| `assets` | Business and infrastructure asset inventory |
| `vulnerabilities` | Asset-linked synthetic CVEs and exploitability |
| `threats` | Synthetic threat names, MITRE techniques, and likelihood |
| `attack_paths` | Generated source-to-target paths, likelihood, risk, impact, and confidence |
| `deception_assets` | Decoy servers, portals, and honeytokens |
| `interaction_events` | Synthetic touches against deception assets |
| `security_controls` | Candidate investments and path coverage |
| `investment_plans` | Stored optimizer results |
| `risk_snapshots` | Baseline, current, validated, and post-investment scores |

The default SQLite file is relative to the backend process working directory: `backend/nexoshi.db`. The database is created automatically. Docker Compose declares a volume for `/app/data`, but the default `DATABASE_URL` currently points to `sqlite:///./nexoshi.db`; set `DATABASE_URL` explicitly if the container must persist the database in the mounted path.

## 8. Mock and synthetic data

The catalog is in `backend/app/data/catalog.py` and is loaded by `backend/app/data/seed.py` only when the database has no assets.

The baseline catalog contains:

- 21 synthetic assets, including web, mail, database, identity, backup, SaaS, IoT, VPN, payment, and QA mock API assets.
- 9 synthetic vulnerabilities, including `CVE-MOCK-0001` for the QA mock payment API.
- 5 synthetic threats using MITRE techniques such as `T1190`, `T1566`, `T1078`, `T1068`, and `T1046`.
- 4 predefined attack paths: Web RCE to Customer DB, VPN bypass to Domain Admin, Phishing to Payment Fraud, and IoT foothold to Backup Theft.
- 3 ready deception assets: a finance decoy server, fake admin portal, and honeytoken credentials.
- 8 candidate security controls, including MFA, network segmentation, EDR, patch management, PAM, backup hardening, email security, and WAF.

Randomness is used only for demo behavior: decoy IP assignment, random event selection, source IP selection, and small confidence jitter. The data is not sourced from a live feed.

The reset operation deletes generated and seeded records, reloads the catalog, regenerates attack paths, and creates a new baseline snapshot. It does not delete the SQLite file itself.

## 9. API key and authentication statement

### Current implementation

No API key is used by this project.

Specifically:

- The frontend request helper sends only `Content-Type: application/json`.
- There is no `Authorization` header.
- There is no `X-API-Key` header.
- FastAPI routes do not use an authentication dependency.
- No JWT, OAuth, API gateway, or external provider integration is configured.
- `backend/app/core/config.py` defines `APP_NAME`, `APP_VERSION`, and `DATABASE_URL` only.

Therefore this application should be treated as an open demo API and must not be exposed to an untrusted network without adding authentication and authorization. The synthetic IP addresses and CVE names in the catalog are mock data, not API credentials.

### Recommended production approach

If an API key is required for a protected deployment, use a server-side environment variable such as `NEXOSHI_API_KEY`, require it in a FastAPI dependency, and compare it using a constant-time method. Clients should send it as `Authorization: Bearer <token>` or a documented `X-API-Key` header over HTTPS. Do not put a secret in the Vite frontend bundle, source code, or `.env` file that is shipped to browsers. Rotate and revoke keys, restrict CORS origins, rate-limit mutating endpoints, and add audit logging.

This recommendation describes work still needed; it is not functionality currently present in the repository.

## 10. Running locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The backend API is available at `http://127.0.0.1:8001`, including interactive docs at `/docs`.

### Production-style local run

```powershell
.\deploy.ps1 -Port 8080
```

The script builds the frontend, starts Uvicorn from `backend`, checks `/api/v1/metrics` and `/`, and opens `http://localhost:8080`.

### Docker Compose

```bash
docker compose up --build
```

The frontend is exposed at `http://localhost:8080`; Nginx proxies `/api/` to the backend service.

## 11. Environment configuration

The backend reads `.env` through Pydantic settings. Supported settings in the current code are:

| Variable | Default | Meaning |
| --- | --- | --- |
| `APP_NAME` | `NEXOSHI` | FastAPI application name |
| `APP_VERSION` | `1.0.0` | Application version |
| `DATABASE_URL` | `sqlite:///./nexoshi.db` | SQLAlchemy database URL |

There is currently no API-key environment variable and no frontend API URL environment variable. In development, the frontend always uses the relative `/api/v1` path and Vite's proxy. In the container, Nginx handles the same path.

## 12. Safety, limitations, and next steps

Current limitations:

- No authentication, authorization, tenant isolation, or audit trail.
- CORS is configured as `allow_origins=["*"]`.
- Risk and financial-loss calculations are explainable demo heuristics, not a validated risk model.
- Deception and verification are simulated database mutations; no real deployment occurs.
- The database has no migration system.
- Input validation is basic and there are no automated API contract tests in the repository.
- `deploy.ps1` stops matching Python/Node processes on development ports, so review that behavior before using it on a shared machine.

Before production use, add authentication, restrictive CORS, HTTPS, rate limits, database migrations and backups, structured logging, stronger validation, automated tests, secret management, and a real integration boundary for approved security data sources.

## 13. Useful source map

| Concern | Source |
| --- | --- |
| FastAPI routes and startup | `backend/app/main.py` |
| Settings | `backend/app/core/config.py` |
| Database session | `backend/app/core/database.py` |
| ORM models | `backend/app/models/models.py` |
| Pydantic schemas | `backend/app/schemas/schemas.py` |
| Mock catalog | `backend/app/data/catalog.py` |
| Seed and exposure calculation | `backend/app/data/seed.py` |
| Risk engine | `backend/app/modules/risk_engine.py` |
| Attack graph | `backend/app/modules/attack_graph.py` |
| Deception and events | `backend/app/modules/deception.py` |
| Evidence correlation | `backend/app/modules/evidence.py` |
| Investment optimizer | `backend/app/modules/investment.py` |
| Verification and history | `backend/app/modules/verification.py` |
| Frontend API wrapper | `frontend/src/api.ts` |
| Frontend routing/layout | `frontend/src/App.tsx` |
| Frontend pages | `frontend/src/pages/` |
| Development proxy | `frontend/vite.config.ts` |
| Container proxy | `frontend/nginx.conf` |
| Deployment script | `deploy.ps1` |
