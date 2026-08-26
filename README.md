# NEXOSHI — Adaptive Cyber Risk & Deception Investment Optimizer
SIH 2026 prototype. AI-powered continuous cyber-risk quantification with deception-validated risk (DVR) and closed-loop security investment optimization.

Full technical documentation: [docs/NEXOSHI_DOCUMENTATION.md](docs/NEXOSHI_DOCUMENTATION.md)

**Loop:** RISK → VALIDATE → INVEST → VERIFY → LEARN

## Run

### Production (single process)
```powershell
.\deploy.ps1            # builds frontend, serves SPA + API on http://localhost:8080
```

### Docker Compose (any Linux/Docker host)
```bash
docker compose up --build     # app on http://localhost:8080
```

### Development
Backend (port 8001):
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Frontend (port 3000):
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Demo flow (5 screens)
1. **Dashboard** — overall risk, expected loss, KPIs, trend
2. **Attack Graph** — NetworkX digital twin via React Flow, critical paths, choke points
3. **Deception Validation** — deploy decoys/honeytokens, simulate attacker events, evidence correlation, risk recalibration (confidence medium → high)
4. **Investment Optimizer** — ₹10L budget → greedy control portfolio by value/₹ with path coverage
5. **Verify & Feedback** — simulated deployment → before/after risk & loss → feedback into next cycle

Reset demo state at any time: `POST /api/v1/demo/reset`

## Safety
Fully synthetic data and simulated attacker behaviour. No real scanning, secrets or exposed vulnerable services.
