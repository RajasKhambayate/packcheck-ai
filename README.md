# PackCheck AI

**AI-Powered Legal Metrology Compliance & Product Label Verification Platform**

Built for **Smart India Hackathon 2026** — Problem Statement **#26034**
*Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.*

**Organization:** Ministry of Consumer Affairs, Food & Public Distribution
**Department:** Department of Consumer Affairs (DoCA)
**Team:** Team Forge

---

## What it does

PackCheck AI lets an enforcement inspector (or an e-commerce compliance team) photograph a packaged commodity's label and, in seconds, get:

1. **Extracted mandatory declarations** — manufacturer/packer/importer name & address, net quantity, MRP, month/year of manufacture, consumer care details, country of origin.
2. **A rule-by-rule compliance verdict** against the **Legal Metrology (Packaged Commodities) Rules, 2011** — missing declarations, malformed MRP/net-quantity formats, and a readability/font-size heuristic.
3. **A compliance score (0–100)** and a **Compliant / Needs Review / Non-Compliant** status.
4. **A downloadable PDF or DOCX compliance report**, with photographic evidence attached.
5. A **dashboard** with scan volume, violation trends, and category breakdowns for enforcement officials.
6. A **searchable repository** of every scan and its inspection history.

## Tech stack (matches the team's Technical Approach slide)

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS (Vite) |
| Backend | Python + FastAPI |
| AI / OCR | OpenCV (preprocessing) + Tesseract OCR (multilingual text extraction) |
| Database | PostgreSQL (production) / SQLite (zero-config local dev) |
| Rule Engine | Python, codifying Legal Metrology (Packaged Commodities) Rules, 2011 |
| Reports | ReportLab (PDF), python-docx (DOCX) |
| Auth | JWT, role-based (Admin / Inspector) |
| Deployment | Docker, Docker Compose, GitHub Actions CI, Render Blueprint |

> **Note on scope:** The methodology diagram in the SIH slide deck references a YOLO object-detection stage for locating the label/principal-display-panel before OCR, and calibrated font-size measurement in millimetres. This prototype implements a fully working OpenCV + Tesseract pipeline with a defensible readability heuristic (see `backend/app/services/compliance_engine.py`) so the app runs completely out-of-the-box with no GPU or trained model weights required. Swapping in a trained YOLO checkpoint for panel localization, and a calibrated pixel→mm conversion (e.g. via a reference marker in-frame), are documented next steps — see [Roadmap](#roadmap).

---

## Quick start (local, no Docker)

Requires: Python 3.11+, Node.js 20+, and the `tesseract-ocr` binary installed on your system (`sudo apt install tesseract-ocr` / `brew install tesseract`).

```bash
git clone <your-repo-url>
cd packcheck-ai
./setup.sh
```

Then in two terminals:

```bash
# Terminal 1
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173**. Log in with:

- **Admin:** `admin@packcheck.ai` / `Admin@123`
- **Inspector:** `inspector@packcheck.ai` / `Inspect@123`

*(Change these before any real deployment — see [Security](#security-checklist-before-going-live).)*

---

## Quick start (Docker — recommended, fully self-contained)

Requires only **Docker** and **Docker Compose**.

```bash
git clone <your-repo-url>
cd packcheck-ai
docker compose up --build
```

This spins up Postgres, the FastAPI backend (auto-seeded with the demo accounts above), and the React frontend served via nginx.

Open **http://localhost**.

To stop: `docker compose down` (add `-v` to also wipe the database volume).

---

## Deploying to GitHub in a few clicks

1. Create a new empty repository on GitHub.
2. From this project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: PackCheck AI - SIH 2026 PS#26034"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. That's it — pushing to `main` automatically triggers `.github/workflows/ci.yml`, which builds and sanity-checks both the backend and frontend (and both Docker images) on every push, so you always know the repo is in a runnable state.

## One-click hosted deploy (Render)

A `render.yaml` **Blueprint** is included, which provisions the database, backend, and frontend automatically:

1. Push the repo to GitHub (above).
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Select your repository. Render reads `render.yaml` and provisions:
   - a free Postgres database,
   - the FastAPI backend as a Docker web service (auto-seeded on deploy),
   - the React frontend as a Docker web service.
4. Once both services are live, open the frontend's Render URL, and in its dashboard set the `BACKEND_URL` environment variable to the backend service's Render URL, then redeploy the frontend service (this points its nginx proxy at your live backend).

The same `backend/Dockerfile` and `frontend/Dockerfile` also work unmodified on Railway, Fly.io, Azure App Service, or any Docker-based PaaS — set `DATABASE_URL`, `SECRET_KEY`, and (for the frontend) `BACKEND_URL` as environment variables on whichever platform you choose.

---

## Project structure

```
packcheck-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, routers, static mounts
│   │   ├── config.py               # Env-driven settings
│   │   ├── models.py               # SQLAlchemy models
│   │   ├── schemas.py              # Pydantic request/response schemas
│   │   ├── security.py             # JWT + password hashing
│   │   ├── deps.py                 # Auth dependencies / role guards
│   │   ├── seed.py                 # Creates default admin/inspector accounts
│   │   ├── routers/
│   │   │   ├── auth.py             # /api/auth/*
│   │   │   ├── scan.py             # POST /api/scan  (upload + run pipeline)
│   │   │   ├── products.py         # /api/products/*  (repository/search)
│   │   │   ├── dashboard.py        # /api/dashboard/stats
│   │   │   └── reports.py          # /api/reports/{id}/pdf|docx
│   │   ├── services/
│   │   │   ├── ocr_service.py      # OpenCV preprocessing + Tesseract OCR
│   │   │   ├── compliance_engine.py# Extraction + rule checks + scoring
│   │   │   └── report_generator.py # PDF / DOCX report generation
│   │   └── rules/
│   │       └── legal_metrology_rules.py  # Codified LM Rules 2011 + regex extractors
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Login, Dashboard, ScanProduct, ProductHistory, ReportDetail
│   │   ├── components/             # AppShell, StatCard, StatusPill, etc.
│   │   ├── context/AuthContext.jsx
│   │   └── api/client.js
│   ├── Dockerfile
│   ├── nginx.conf.template
│   └── package.json
├── docker-compose.yml
├── render.yaml
├── .github/workflows/ci.yml
└── setup.sh
```

## API overview

Interactive API docs are auto-generated at `/docs` (Swagger UI) once the backend is running.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a user (admin/inspector/viewer) |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/scan` | Upload a label image + product info → runs OCR + compliance engine |
| GET | `/api/products` | Search/filter the scan repository |
| GET | `/api/products/{id}` | Full scan detail incl. violations |
| PATCH | `/api/products/{id}` | Correct/annotate a scan record |
| GET | `/api/dashboard/stats` | Aggregate stats for the dashboard |
| GET | `/api/reports/{id}/pdf` | Download PDF compliance report |
| GET | `/api/reports/{id}/docx` | Download DOCX compliance report |

## How the compliance engine works

```
Image upload
   │
   ▼
OpenCV preprocessing (denoise, adaptive threshold, resize)
   │
   ▼
Tesseract OCR  →  raw text + word-level bounding boxes
   │
   ▼
Declaration Extraction Engine (regex rule set per field)
   │
   ▼
Compliance Checks:
   • Presence check   — is each Rule 6(1) declaration detected at all?
   • Format check     — is MRP numeric? Is net quantity in a standard unit?
                         Does consumer care contain a valid phone/email?
   • Readability check— are any text elements below a minimum legible-size
                         heuristic relative to the image frame?
   │
   ▼
Rule Engine  →  weighted score (100 − Σ penalties) + verdict
              (Compliant / Needs Review / Non-Compliant)
   │
   ▼
Stored scan record + violations  →  Dashboard, Repository, PDF/DOCX report
```

## Roadmap

- Swap the regex-based declaration extractor for a fine-tuned NER/layout model for higher accuracy on cluttered labels.
- Add a YOLO-based principal-display-panel/logo/QR detector ahead of OCR, as sketched in the original methodology diagram.
- Calibrate font-size checks against a physical reference (coin/ruler) or the package's declared area, per Rule 8's mm-based thresholds.
- Multilingual OCR tuning for regional-language labels (Tesseract already supports this; add trained language packs).
- Bulk/batch scanning for e-commerce listing crawls.

## Security checklist before going live

- [ ] Change `SECRET_KEY` in `backend/.env` (or the platform's env vars) to a long random value.
- [ ] Change the seeded admin/inspector passwords immediately after first login.
- [ ] Set `CORS_ORIGINS` to your actual frontend domain instead of `*`.
- [ ] Switch `DATABASE_URL` to a managed Postgres instance with backups enabled.
- [ ] Put the API behind HTTPS (Render/Railway/most PaaS do this automatically).

## Disclaimer

This is a hackathon prototype intended as a **first-pass screening aid** for enforcement officials, not a legally binding determination. All "Non-Compliant" verdicts should be manually verified by a Legal Metrology officer before any enforcement action, per standard due process.

## License

MIT — see [LICENSE](LICENSE).
