"""
models.py
Pydantic schemas for request validation and response serialisation.
FastAPI uses these automatically — invalid input returns a 422 with clear messages.
"""

from pydantic import BaseModel, Field, field_validator


class TaskRequest(BaseModel):
    hardware: str = Field(
        ...,
        description="Hardware identifier. See GET /factors for all valid options.",
        examples=["A100", "t3.medium", "RTX4090"],
    )
    hours: float = Field(
        ...,
        gt=0,
        description="Duration of the workload in hours. Must be greater than 0.",
        examples=[2.5, 24.0, 0.5],
    )
    region: str = Field(
        ...,
        description="Cloud region code. See GET /factors for all valid options.",
        examples=["us-east-1", "eu-west-1", "ap-south-1"],
    )
    utilization: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Hardware utilisation as a decimal between 0.0 and 1.0. Defaults to 1.0 (full load).",
        examples=[0.85, 0.5, 1.0],
    )

    @field_validator("hardware")
    @classmethod
    def hardware_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("hardware must not be an empty string.")
        return v.strip()

    @field_validator("region")
    @classmethod
    def region_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("region must not be an empty string.")
        return v.strip()


class TaskResponse(BaseModel):
    hardware: str
    hardware_description: str
    region: str
    region_name: str
    hours: float
    utilization: float
    energy_kwh: float
    carbon_intensity_used: float = Field(
        description="Grid carbon intensity used for this calculation, in gCO2/kWh."
    )
    co2_grams: float = Field(description="Estimated CO2 emitted in grams.")
    equivalent_to: str = Field(description="Human-readable equivalent of the CO2 figure.")


class HealthResponse(BaseModel):
    status: str
    version: str


class ErrorResponse(BaseModel):
    detail: str
