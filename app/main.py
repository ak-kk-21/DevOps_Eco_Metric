"""
main.py
FastAPI application entry point. Defines all routes.
Business logic lives in calculator.py — this file only handles HTTP concerns.
"""
from fastapi.middleware.cors import CORSMiddleware


from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.calculator import HARDWARE_DATA, REGION_DATA, estimate_task_footprint
from app.models import ErrorResponse, HealthResponse, TaskRequest, TaskResponse

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Eco-Metric API",
    description=(
        "Estimates the carbon footprint of computing tasks. "
        "Submit a hardware type, runtime, and cloud region — get back CO2 in grams "
        "alongside a human-readable equivalent."
    ),
    version="1.0.0",
    contact={
        "name": "Eco-Metric",
        "url": "https://github.com/your-username/eco-metric-api",
    },
    license_info={"name": "MIT"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["System"],
)
def health_check() -> HealthResponse:
    """
    Returns the API status and version.
    Used by Render (and any load balancer) to verify the container is running.
    """
    return HealthResponse(status="ok", version="1.0.0")


@app.post(
    "/calculate/task",
    response_model=TaskResponse,
    summary="Estimate carbon footprint of a computing task",
    tags=["Carbon Estimation"],
    responses={
        422: {"model": ErrorResponse, "description": "Validation error — bad request body"},
        404: {"model": ErrorResponse, "description": "Hardware or region not recognised"},
    },
)
def calculate_task(request: TaskRequest) -> TaskResponse:
    """
    Calculates the estimated CO2 emissions for a single computing workload.

    **Formula:**
    ```
    energy_kwh = (tdp_watts × utilization × hours) / 1000
    co2_grams  = energy_kwh × carbon_intensity (gCO2/kWh)
    ```

    Returns the raw figures plus a human-readable `equivalent_to` field
    (e.g. "driving 2.1 km in a petrol car").
    """
    try:
        result = estimate_task_footprint(
            hardware=request.hardware,
            hours=request.hours,
            region=request.region,
            utilization=request.utilization,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return TaskResponse(**result)


@app.get(
    "/factors",
    summary="List all emission factors",
    tags=["Reference Data"],
)
def get_factors() -> dict:
    """
    Returns all hardware TDP values and regional carbon intensities
    used by the calculation engine.

    Useful for understanding which hardware/region combinations are supported,
    and for verifying the raw data behind any estimate.
    """
    return {
        "hardware": HARDWARE_DATA,
        "regions": REGION_DATA,
        "units": {
            "tdp_watts": "Watts (W)",
            "gco2_per_kwh": "Grams of CO2 per kilowatt-hour (gCO2/kWh)",
        },
        "sources": {
            "hardware_tdp": "Manufacturer spec sheets",
            "carbon_intensity": "Electricity Maps / EPA eGRID 2023",
        },
    }
