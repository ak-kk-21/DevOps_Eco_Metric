"""
test_calculator.py
Unit tests for the pure calculation functions in calculator.py.
These tests are fast, have no I/O, and are the primary driver of coverage.
"""

import pytest

from app.calculator import (
    HARDWARE_DATA,
    REGION_DATA,
    build_equivalent_to,
    calculate_co2_grams,
    calculate_energy_kwh,
    estimate_task_footprint,
)


# ---------------------------------------------------------------------------
# calculate_energy_kwh
# ---------------------------------------------------------------------------


class TestCalculateEnergyKwh:
    def test_known_values_a100(self):
        """A100 at 85% utilisation for 2.5 hours → 0.85 kWh."""
        result = calculate_energy_kwh(tdp_watts=400, utilization=0.85, hours=2.5)
        assert round(result, 3) == 0.85

    def test_full_utilization(self):
        """100W for 10 hours at full load → 1.0 kWh."""
        result = calculate_energy_kwh(tdp_watts=100, utilization=1.0, hours=10)
        assert result == 1.0

    def test_zero_utilization_returns_zero(self):
        """Hardware doing nothing produces no energy."""
        result = calculate_energy_kwh(tdp_watts=400, utilization=0.0, hours=10)
        assert result == 0.0

    def test_zero_hours_returns_zero(self):
        """Zero runtime produces zero energy."""
        result = calculate_energy_kwh(tdp_watts=400, utilization=1.0, hours=0)
        assert result == 0.0

    def test_result_is_always_non_negative(self):
        result = calculate_energy_kwh(tdp_watts=0, utilization=0, hours=0)
        assert result >= 0

    def test_negative_tdp_raises(self):
        with pytest.raises(ValueError):
            calculate_energy_kwh(tdp_watts=-10, utilization=1.0, hours=1)

    def test_negative_hours_raises(self):
        with pytest.raises(ValueError):
            calculate_energy_kwh(tdp_watts=100, utilization=1.0, hours=-1)

    def test_utilization_above_one_raises(self):
        with pytest.raises(ValueError):
            calculate_energy_kwh(tdp_watts=100, utilization=1.5, hours=1)

    def test_negative_utilization_raises(self):
        with pytest.raises(ValueError):
            calculate_energy_kwh(tdp_watts=100, utilization=-0.1, hours=1)

    def test_proportional_to_hours(self):
        """Doubling hours should double energy."""
        e1 = calculate_energy_kwh(tdp_watts=200, utilization=0.5, hours=1)
        e2 = calculate_energy_kwh(tdp_watts=200, utilization=0.5, hours=2)
        assert e2 == pytest.approx(e1 * 2)

    def test_proportional_to_utilization(self):
        """Halving utilisation should halve energy."""
        e1 = calculate_energy_kwh(tdp_watts=300, utilization=1.0, hours=5)
        e2 = calculate_energy_kwh(tdp_watts=300, utilization=0.5, hours=5)
        assert e2 == pytest.approx(e1 * 0.5)


# ---------------------------------------------------------------------------
# calculate_co2_grams
# ---------------------------------------------------------------------------


class TestCalculateCo2Grams:
    def test_known_values(self):
        """1 kWh at 386 gCO2/kWh → 386 grams."""
        assert calculate_co2_grams(energy_kwh=1.0, intensity=386) == 386.0

    def test_zero_energy_returns_zero(self):
        assert calculate_co2_grams(energy_kwh=0.0, intensity=500) == 0.0

    def test_zero_intensity_returns_zero(self):
        """100% renewable grid — no emissions."""
        assert calculate_co2_grams(energy_kwh=5.0, intensity=0) == 0.0

    def test_proportional_to_intensity(self):
        """Four times the intensity should mean four times the CO2."""
        low = calculate_co2_grams(energy_kwh=1.0, intensity=100)
        high = calculate_co2_grams(energy_kwh=1.0, intensity=400)
        assert high == low * 4

    def test_negative_energy_raises(self):
        with pytest.raises(ValueError):
            calculate_co2_grams(energy_kwh=-1.0, intensity=386)

    def test_negative_intensity_raises(self):
        with pytest.raises(ValueError):
            calculate_co2_grams(energy_kwh=1.0, intensity=-10)

    def test_result_always_non_negative(self):
        assert calculate_co2_grams(energy_kwh=0, intensity=0) >= 0


# ---------------------------------------------------------------------------
# build_equivalent_to
# ---------------------------------------------------------------------------


class TestBuildEquivalentTo:
    def test_zero_returns_no_emissions(self):
        assert build_equivalent_to(0) == "no measurable emissions"

    def test_small_value_uses_phone_charges(self):
        result = build_equivalent_to(5.0)
        assert "smartphone" in result

    def test_medium_value_uses_km(self):
        result = build_equivalent_to(170.0)
        assert "km" in result

    def test_large_value_mentions_tree(self):
        result = build_equivalent_to(2000.0)
        assert "tree" in result

    def test_very_large_value_mentions_tree(self):
        result = build_equivalent_to(50000.0)
        assert "tree" in result

    def test_returns_string(self):
        assert isinstance(build_equivalent_to(100.0), str)

    def test_negative_treated_as_zero(self):
        assert build_equivalent_to(-10) == "no measurable emissions"


# ---------------------------------------------------------------------------
# estimate_task_footprint (integration of all three functions)
# ---------------------------------------------------------------------------


class TestEstimateTaskFootprint:
    def test_valid_gpu_task(self):
        result = estimate_task_footprint(
            hardware="A100", hours=2.5, region="us-east-1", utilization=0.85
        )
        assert result["co2_grams"] > 0
        assert result["energy_kwh"] > 0
        assert "equivalent_to" in result
        assert result["hardware"] == "A100"
        assert result["region"] == "us-east-1"

    def test_valid_cpu_task(self):
        result = estimate_task_footprint(
            hardware="t3.medium", hours=24, region="eu-north-1", utilization=0.5
        )
        # Sweden has very low intensity — should be a small footprint
        assert result["co2_grams"] < 5

    def test_default_utilization_is_one(self):
        result_default = estimate_task_footprint(hardware="V100", hours=1, region="us-east-1")
        result_explicit = estimate_task_footprint(
            hardware="V100", hours=1, region="us-east-1", utilization=1.0
        )
        assert result_default["co2_grams"] == result_explicit["co2_grams"]

    def test_unknown_hardware_raises_key_error(self):
        with pytest.raises(KeyError, match="not found"):
            estimate_task_footprint(hardware="FakeGPU9000", hours=1, region="us-east-1")

    def test_unknown_region_raises_key_error(self):
        with pytest.raises(KeyError, match="not found"):
            estimate_task_footprint(hardware="A100", hours=1, region="mars-west-1")

    def test_high_intensity_region_produces_more_co2(self):
        """Mumbai (708) should produce more CO2 than Sweden (8) for identical tasks."""
        mumbai = estimate_task_footprint(hardware="A100", hours=1, region="ap-south-1")
        sweden = estimate_task_footprint(hardware="A100", hours=1, region="eu-north-1")
        assert mumbai["co2_grams"] > sweden["co2_grams"]

    def test_response_contains_all_expected_keys(self):
        result = estimate_task_footprint(hardware="RTX3090", hours=1, region="eu-west-1")
        expected_keys = {
            "hardware", "hardware_description", "region", "region_name",
            "hours", "utilization", "energy_kwh", "carbon_intensity_used",
            "co2_grams", "equivalent_to",
        }
        assert expected_keys.issubset(result.keys())

    def test_fixture_data_is_loaded(self):
        """Sanity check that JSON files loaded correctly."""
        assert len(HARDWARE_DATA) > 0
        assert len(REGION_DATA) > 0
        assert "A100" in HARDWARE_DATA
        assert "us-east-1" in REGION_DATA
