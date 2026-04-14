"""
calculator.py
Core CO2 calculation logic for the Eco-Metric API.
All functions are pure (no side effects) to keep them easily testable.
"""

import json
import os
from typing import Optional

# ---------------------------------------------------------------------------
# Load fixture data once at module level
# ---------------------------------------------------------------------------

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _load_json(filename: str) -> dict:
    with open(os.path.join(_DATA_DIR, filename)) as f:
        return json.load(f)


HARDWARE_DATA: dict = _load_json("hardware.json")
REGION_DATA: dict = _load_json("regions.json")

# ---------------------------------------------------------------------------
# Equivalence constants
# ---------------------------------------------------------------------------

# Average petrol car emits ~170 gCO2 per km (EU average)
_GRAMS_CO2_PER_KM_CAR = 170.0

# Charging a smartphone to 100% uses ~8.5 Wh = 0.0085 kWh
# At 386 gCO2/kWh (US average) ≈ 3.28 g CO2 per charge
_GRAMS_CO2_PER_PHONE_CHARGE = 3.28

# One tree absorbs ~21,000 g CO2 per year → 21000/365 ≈ 57.5 g/day
_GRAMS_CO2_PER_TREE_DAY = 57.5

# ---------------------------------------------------------------------------
# Core calculation functions
# ---------------------------------------------------------------------------


def calculate_energy_kwh(tdp_watts: float, utilization: float, hours: float) -> float:
    """
    Calculate energy consumed in kilowatt-hours.

    Formula: energy_kwh = (tdp_watts × utilization × hours) / 1000

    Args:
        tdp_watts:   Thermal Design Power of the hardware in watts.
        utilization: Fraction of TDP in use, 0.0–1.0.
        hours:       Duration of the workload in hours.

    Returns:
        Energy consumed in kWh (always >= 0).
    """
    if tdp_watts < 0 or utilization < 0 or hours < 0:
        raise ValueError("tdp_watts, utilization, and hours must all be non-negative.")
    if utilization > 1.0:
        raise ValueError("utilization must be between 0.0 and 1.0.")

    return (tdp_watts * utilization * hours) / 1000.0


def calculate_co2_grams(energy_kwh: float, intensity: float) -> float:
    """
    Calculate CO2 emissions in grams.

    Formula: co2_grams = energy_kwh × carbon_intensity (gCO2/kWh)

    Args:
        energy_kwh: Energy consumed in kWh.
        intensity:  Grid carbon intensity in grams of CO2 per kWh.

    Returns:
        CO2 emitted in grams (always >= 0).
    """
    if energy_kwh < 0 or intensity < 0:
        raise ValueError("energy_kwh and intensity must be non-negative.")

    return energy_kwh * intensity


def build_equivalent_to(co2_grams: float) -> str:
    """
    Convert a raw CO2 figure into a human-readable equivalent.

    Picks the most meaningful unit based on magnitude.

    Args:
        co2_grams: CO2 emitted in grams.

    Returns:
        A descriptive string, e.g. "driving 2.1 km in a petrol car".
    """
    if co2_grams <= 0:
        return "no measurable emissions"

    km_driven = co2_grams / _GRAMS_CO2_PER_KM_CAR
    phone_charges = co2_grams / _GRAMS_CO2_PER_PHONE_CHARGE
    tree_days = co2_grams / _GRAMS_CO2_PER_TREE_DAY

    if co2_grams < 10:
        return f"charging {phone_charges:.1f} smartphones"
    elif co2_grams < 500:
        return f"driving {km_driven:.1f} km in a petrol car"
    elif co2_grams < 5000:
        return (
            f"driving {km_driven:.1f} km in a petrol car "
            f"(or {tree_days:.1f} days of CO2 absorbed by one tree)"
        )
    else:
        return (
            f"driving {km_driven:.0f} km in a petrol car "
            f"({tree_days:.0f} days of CO2 absorbed by one tree)"
        )


# ---------------------------------------------------------------------------
# High-level entry point
# ---------------------------------------------------------------------------


def estimate_task_footprint(
    hardware: str,
    hours: float,
    region: str,
    utilization: float = 1.0,
) -> dict:
    """
    Compute the full carbon footprint for a single computing task.

    Args:
        hardware:    Key from hardware.json, e.g. "A100".
        hours:       Duration in hours.
        region:      Key from regions.json, e.g. "us-east-1".
        utilization: CPU/GPU utilisation fraction, 0.0–1.0. Defaults to 1.0.

    Returns:
        A dict containing energy_kwh, carbon_intensity_used, co2_grams,
        and equivalent_to.

    Raises:
        KeyError: If hardware or region is not found in fixture data.
    """
    if hardware not in HARDWARE_DATA:
        raise KeyError(f"Hardware '{hardware}' not found. See GET /factors for valid options.")
    if region not in REGION_DATA:
        raise KeyError(f"Region '{region}' not found. See GET /factors for valid options.")

    hw = HARDWARE_DATA[hardware]
    rg = REGION_DATA[region]

    energy_kwh = calculate_energy_kwh(
        tdp_watts=hw["tdp_watts"],
        utilization=utilization,
        hours=hours,
    )
    co2_grams = calculate_co2_grams(
        energy_kwh=energy_kwh,
        intensity=rg["gco2_per_kwh"],
    )

    return {
        "hardware": hardware,
        "hardware_description": hw["description"],
        "region": region,
        "region_name": rg["name"],
        "hours": hours,
        "utilization": utilization,
        "energy_kwh": round(energy_kwh, 4),
        "carbon_intensity_used": rg["gco2_per_kwh"],
        "co2_grams": round(co2_grams, 2),
        "equivalent_to": build_equivalent_to(co2_grams),
    }
