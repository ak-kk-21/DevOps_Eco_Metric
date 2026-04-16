"""
test_routes.py
Integration tests for all FastAPI endpoints.
Uses FastAPI's built-in TestClient — no real server needed.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


class TestHealthEndpoint:
    def test_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_returns_ok_status(self):
        data = client.get("/health").json()
        assert data["status"] == "ok"

    def test_returns_version(self):
        data = client.get("/health").json()
        assert "version" in data
        assert isinstance(data["version"], str)


# ---------------------------------------------------------------------------
# POST /calculate/task
# ---------------------------------------------------------------------------


class TestCalculateTaskEndpoint:
    def _valid_payload(self, **overrides) -> dict:
        base = {
            "hardware": "A100",
            "hours": 2.5,
            "region": "us-east-1",
            "utilization": 0.85,
        }
        return {**base, **overrides}

    def test_valid_request_returns_200(self):
        response = client.post("/calculate/task", json=self._valid_payload())
        assert response.status_code == 200

    def test_response_contains_co2_grams(self):
        data = client.post("/calculate/task", json=self._valid_payload()).json()
        assert "co2_grams" in data
        assert data["co2_grams"] > 0

    def test_response_contains_energy_kwh(self):
        data = client.post("/calculate/task", json=self._valid_payload()).json()
        assert "energy_kwh" in data

    def test_response_contains_equivalent_to(self):
        data = client.post("/calculate/task", json=self._valid_payload()).json()
        assert "equivalent_to" in data
        assert isinstance(data["equivalent_to"], str)

    def test_response_echoes_hardware_and_region(self):
        data = client.post("/calculate/task", json=self._valid_payload()).json()
        assert data["hardware"] == "A100"
        assert data["region"] == "us-east-1"

    def test_default_utilization_accepted(self):
        payload = {"hardware": "A100", "hours": 1.0, "region": "us-east-1"}
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 200

    def test_unknown_hardware_returns_404(self):
        payload = self._valid_payload(hardware="NonExistentGPU")
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 404

    def test_unknown_region_returns_404(self):
        payload = self._valid_payload(region="pluto-north-1")
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 404

    def test_missing_hardware_returns_422(self):
        payload = {"hours": 1.0, "region": "us-east-1"}
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 422

    def test_missing_hours_returns_422(self):
        payload = {"hardware": "A100", "region": "us-east-1"}
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 422

    def test_zero_hours_returns_422(self):
        payload = self._valid_payload(hours=0)
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 422

    def test_negative_hours_returns_422(self):
        payload = self._valid_payload(hours=-5)
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 422

    def test_utilization_above_one_returns_422(self):
        payload = self._valid_payload(utilization=1.5)
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 422

    def test_utilization_below_zero_returns_422(self):
        payload = self._valid_payload(utilization=-0.1)
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 422

    def test_t3_medium_cpu_task(self):
        """Realistic: a t3.medium batch job running for 8 hours."""
        payload = {"hardware": "t3.medium", "hours": 8, "region": "us-east-1"}
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["co2_grams"] > 0

    def test_low_carbon_region_less_than_high_carbon(self):
        """Same task in Sweden vs Mumbai — Sweden should always win."""
        sweden = client.post(
            "/calculate/task",
            json=self._valid_payload(region="eu-north-1"),
        ).json()
        mumbai = client.post(
            "/calculate/task",
            json=self._valid_payload(region="ap-south-1"),
        ).json()
        assert sweden["co2_grams"] < mumbai["co2_grams"]

    def test_tpu_hardware(self):
        payload = {"hardware": "TPUv4", "hours": 1.0, "region": "us-central1"}
        response = client.post("/calculate/task", json=payload)
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# GET /factors
# ---------------------------------------------------------------------------


class TestFactorsEndpoint:
    def test_returns_200(self):
        response = client.get("/factors")
        assert response.status_code == 200

    def test_contains_hardware_key(self):
        data = client.get("/factors").json()
        assert "hardware" in data

    def test_contains_regions_key(self):
        data = client.get("/factors").json()
        assert "regions" in data

    def test_hardware_includes_a100(self):
        data = client.get("/factors").json()
        assert "A100" in data["hardware"]

    def test_regions_includes_us_east_1(self):
        data = client.get("/factors").json()
        assert "us-east-1" in data["regions"]

    def test_contains_units_metadata(self):
        data = client.get("/factors").json()
        assert "units" in data

    def test_contains_sources_metadata(self):
        data = client.get("/factors").json()
        assert "sources" in data
