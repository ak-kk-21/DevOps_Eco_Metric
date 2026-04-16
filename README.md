# 🌱 Eco-Metric API

> Estimate the carbon footprint of computing tasks — from GPU training runs to cloud server fleets.

A lightweight REST API built for the **Green Computing** DevOps project. Send it a hardware type, runtime duration, and cloud region — get back a CO₂ estimate in grams alongside a human-readable equivalent like *"driving 2.1 km in a petrol car"*.

---

## Why this exists

Developers have no quick way to measure the environmental cost of their code or infrastructure. Running a large language model, a nightly ETL pipeline, or a fleet of microservices all produce measurable carbon emissions — but this data is invisible during the design phase. This API makes it visible.

---

## Tech stack

| Layer | Tool |
|---|---|
| Language | Python 3.11 |
| Framework | FastAPI |
| Package manager | Poetry |
| Testing | Pytest + pytest-cov |
| Code quality | SonarCloud |
| Containerisation | Docker |
| CI/CD | GitHub Actions |
| Registry | Docker Hub |
| Deployment | Render |

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ "status": "ok" }` |
| `POST` | `/calculate/task` | Estimate CO₂ for a computing workload |
| `GET` | `/factors` | List all valid hardware and region values |

Full interactive docs available at `/docs` (Swagger UI) when the server is running.

---

## Running locally

**Prerequisites:** Python 3.11+, Poetry

```bash
# Clone the repo
git clone https://github.com/your-username/eco-metric-api.git
cd eco-metric-api

# Install dependencies
poetry install

# Start the server
poetry run uvicorn app.main:app --reload
```

Open **http://localhost:8000/docs** to explore the API in your browser.

---

## Example request

```bash
curl -X POST http://localhost:8000/calculate/task \
  -H "Content-Type: application/json" \
  -d '{
    "hardware": "A100",
    "hours": 2.5,
    "region": "us-east-1",
    "utilization": 0.85
  }'
```

```json
{
  "hardware": "A100",
  "hardware_description": "NVIDIA A100 80GB",
  "region": "us-east-1",
  "region_name": "N. Virginia, USA",
  "hours": 2.5,
  "utilization": 0.85,
  "energy_kwh": 0.85,
  "carbon_intensity_used": 386,
  "co2_grams": 328.1,
  "equivalent_to": "driving 1.9 km in a petrol car"
}
```

Try swapping `"region"` to `"eu-north-1"` (Sweden, 8 gCO₂/kWh) vs `"ap-south-1"` (Mumbai, 708 gCO₂/kWh) to see how much cloud region choice affects emissions.

---

## The calculation

```
energy_kwh = (tdp_watts × utilization × hours) / 1000
co2_grams  = energy_kwh × carbon_intensity (gCO₂/kWh)
```

Hardware TDP values are sourced from manufacturer spec sheets. Carbon intensity values per region are sourced from [Electricity Maps](https://www.electricitymaps.com/) and EPA eGRID 2023. All reference data lives in `app/data/` as JSON fixtures baked into the container — no external API calls, no database.

---

## Running tests

```bash
poetry run pytest
```

Runs all unit and integration tests and prints a coverage report. The pipeline requires **≥ 80% coverage** to pass.

```bash
# Run with verbose output
poetry run pytest -v

# Run only unit tests
poetry run pytest tests/test_calculator.py
```

---

## Running with Docker

```bash
# Build the image
docker build -t eco-metric-api .

# Run the container
docker run -p 8000:8000 eco-metric-api
```

---

## CI/CD pipeline

Every push to any branch triggers:

1. `poetry install` — install dependencies
2. `pytest` — run all tests; fail if coverage drops below 80%
3. SonarCloud scan — block the PR if code smells or coverage regressions are introduced

Every merge to `main` additionally triggers:

4. Build Docker image and push to Docker Hub
5. Render auto-deploys the new image (live within ~60 seconds)

Branch protection on `main` requires all three checks to be green before any merge is allowed.

---

## Project structure

```
eco-metric-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app and route definitions
│   ├── calculator.py        # Core CO₂ math logic (pure functions)
│   ├── models.py            # Pydantic request/response schemas
│   └── data/
│       ├── hardware.json    # TDP values for CPUs, GPUs, TPUs
│       └── regions.json     # Carbon intensity by cloud region
├── tests/
│   ├── test_calculator.py   # Unit tests for math functions
│   └── test_routes.py       # Integration tests for all endpoints
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions pipeline
├── Dockerfile
├── pyproject.toml
└── sonar-project.properties
```

---

## GitHub Secrets required (for CI/CD)

| Secret | Where to get it |
|---|---|
| `SONAR_TOKEN` | SonarCloud → My Account → Security |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security → Access Tokens |
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → Deploy Hook |

---

## Supported hardware

| Key | Description | TDP |
|---|---|---|
| `A100` | NVIDIA A100 80GB | 400W |
| `H100` | NVIDIA H100 SXM5 | 700W |
| `RTX4090` | NVIDIA RTX 4090 | 450W |
| `RTX3090` | NVIDIA RTX 3090 | 350W |
| `V100` | NVIDIA V100 32GB | 300W |
| `t3.medium` | AWS t3.medium (2 vCPU) | 18W |
| `m5.xlarge` | AWS m5.xlarge (4 vCPU) | 60W |
| `TPUv4` | Google TPU v4 | 170W |

Full list available at `GET /factors`.

---

## Notable regions by carbon intensity

| Region | Location | gCO₂/kWh |
|---|---|---|
| `eu-north-1` | Stockholm, Sweden | 8 |
| `sa-east-1` | São Paulo, Brazil | 74 |
| `us-west-2` | Oregon, USA | 139 |
| `us-east-1` | N. Virginia, USA | 386 |
| `ap-south-1` | Mumbai, India | 708 |

Sweden (8) vs Mumbai (708) — same workload, **88× difference in emissions**.

---

*Built as part of a DevOps college course. Demonstrates Poetry, FastAPI, Pytest, SonarCloud, Docker, GitHub Actions, and Render.*
