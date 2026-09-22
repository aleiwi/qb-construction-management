"""Unit tests for quantity_engine.py — KNOWN_ISSUES.md item #2.

Tests the _num() helper, compute_quantity() for all element types,
estimate_rebar(), and _dim_value_to_meters().
"""
import pytest
from decimal import Decimal
from app.services.quantity_engine import (
    _num, compute_quantity, estimate_rebar, _dim_value_to_meters,
    QUANTITY_RULES,
)
from app.models.boq_element import ElementType


# ---------------------------------------------------------------------------
# _num() helper (fixes KNOWN_ISSUES #4/#5: float + Decimal, Decimal * float)
# ---------------------------------------------------------------------------

class TestNumHelper:
    def test_float_returns_float(self):
        assert _num(5.0) == 5.0

    def test_int_returns_float(self):
        assert _num(5) == 5.0

    def test_decimal_to_float(self):
        assert _num(Decimal("3.5")) == 3.5

    def test_none_returns_zero(self):
        assert _num(None) == 0.0

    def test_string_numeric(self):
        assert _num("4.2") == 4.2

    def test_invalid_string_returns_zero(self):
        assert _num("abc") == 0.0

    def test_zero_float(self):
        assert _num(0.0) == 0.0


# ---------------------------------------------------------------------------
# compute_quantity() — all element types
# ---------------------------------------------------------------------------

class TestComputeQuantity:
    """Verify quantity computation for every ElementType."""

    def test_wall_computes_length_height_thickness(self):
        qty, unit, params = compute_quantity(
            ElementType.WALL,
            dimensions={"bbox_width": 6.0, "bbox_height": 3.0,
                        "dim_length": 6.0, "dim_thickness": 0.2},
        )
        assert unit == "م3"
        assert params["length"] == 6.0
        assert params["thickness"] == 0.2
        # qty = 6.0 * 3.0(default height) * 0.2 = 3.6
        assert qty == pytest.approx(3.6)

    def test_column_computes_width_depth_height(self):
        qty, unit, params = compute_quantity(
            ElementType.COLUMN,
            dimensions={"bbox_width": 0.5, "bbox_height": 3.0,
                        "dim_width": 0.3, "dim_depth": 0.3},
        )
        assert unit == "م3"
        assert params["width"] == 0.3
        assert params["depth"] == 0.3

    def test_slab_computes_area_times_thickness(self):
        qty, unit, params = compute_quantity(
            ElementType.SLAB,
            geometry_area=100.0,
            dimensions={"area": 100.0},
        )
        assert unit == "م3"
        assert params["area"] == 100.0

    def test_beam_computes_width_depth_length(self):
        qty, unit, params = compute_quantity(
            ElementType.BEAM,
            dimensions={"bbox_width": 0.3, "bbox_height": 0.5,
                        "dim_length": 5.0},
        )
        assert unit == "م3"
        assert params["length"] == 5.0

    def test_foundation_computes_area_depth(self):
        qty, unit, params = compute_quantity(
            ElementType.FOUNDATION,
            geometry_area=20.0,
            dimensions={"area": 20.0},
        )
        assert unit == "م3"
        assert params["area"] == 20.0

    def test_door_is_count_based(self):
        qty, unit, params = compute_quantity(ElementType.DOOR)
        assert qty == 1.0
        assert unit == "قطعة"
        assert params["count"] == 1

    def test_window_is_count_based(self):
        qty, unit, params = compute_quantity(ElementType.WINDOW)
        assert qty == 1.0
        assert unit == "قطعة"
        assert params["count"] == 1

    def test_stairs_computes_width_length_height_over_2(self):
        qty, unit, params = compute_quantity(
            ElementType.STAIRS,
            dimensions={"dim_width": 1.2, "dim_length": 3.0, "dim_height": 3.0},
        )
        assert unit == "م3"
        assert params["width"] == 1.2
        assert params["length"] == 3.0
        # qty = 1.2 * 3.0 * 3.0 / 2 = 5.4
        assert qty == pytest.approx(5.4)

    def test_partition_computes_length_height(self):
        qty, unit, params = compute_quantity(
            ElementType.PARTITION,
            geometry_length=5.0,
            dimensions={"dim_length": 5.0},
        )
        assert unit == "م2"
        assert params["length"] == 5.0

    def test_opening_computes_width_height(self):
        qty, unit, params = compute_quantity(
            ElementType.OPENING,
            dimensions={"dim_width": 1.0, "dim_height": 2.0},
        )
        assert unit == "م2"
        assert params["width"] == 1.0
        assert params["height"] == 2.0

    def test_roof_computes_area_times_thickness(self):
        qty, unit, params = compute_quantity(
            ElementType.ROOF,
            geometry_area=50.0,
            dimensions={"area": 50.0},
        )
        assert unit == "م3"
        assert params["area"] == 50.0

    def test_other_uses_geometry_area(self):
        qty, unit, params = compute_quantity(
            ElementType.OTHER,
            geometry_area=25.0,
        )
        assert unit == "م2"
        assert qty == pytest.approx(25.0)

    def test_wall_deduction_for_openings(self):
        """Wall with opening_deduction_m2 reduces quantity by deduction * thickness."""
        qty, _, _ = compute_quantity(
            ElementType.WALL,
            dimensions={"bbox_width": 6.0, "bbox_height": 3.0,
                        "dim_length": 6.0, "dim_thickness": 0.2,
                        "opening_deduction_m2": 1.0},
        )
        # qty = 6.0 * 3.0 * 0.2 - 1.0 * 0.2 = 3.6 - 0.2 = 3.4
        assert qty == pytest.approx(3.4)


# ---------------------------------------------------------------------------
# estimate_rebar()
# ---------------------------------------------------------------------------

class TestEstimateRebar:
    def test_wall_rebar_rate(self):
        weight, unit = estimate_rebar(ElementType.WALL, 10.0)
        assert weight == 800.0  # 10 * 80
        assert unit == "كجم"

    def test_column_rebar_rate(self):
        weight, unit = estimate_rebar(ElementType.COLUMN, 5.0)
        assert weight == 600.0  # 5 * 120
        assert unit == "كجم"

    def test_unknown_element_uses_default_rate(self):
        weight, unit = estimate_rebar(ElementType.OTHER, 10.0)
        assert weight == 500.0  # 10 * 50
        assert unit == "كجم"

    def test_zero_volume(self):
        weight, unit = estimate_rebar(ElementType.WALL, 0.0)
        assert weight == 0.0
        assert unit == "كجم"


# ---------------------------------------------------------------------------
# _dim_value_to_meters()
# ---------------------------------------------------------------------------

class TestDimValueToMeters:
    def test_mm_conversion(self):
        assert _dim_value_to_meters(1000.0, "1000mm") == 1.0

    def test_cm_conversion(self):
        assert _dim_value_to_meters(50.0, "50cm") == 0.5

    def test_meters_no_unit(self):
        assert _dim_value_to_meters(5.0, "5m") == 5.0

    def test_no_unit_large_value_mm_heuristic(self):
        assert _dim_value_to_meters(500.0, "") == 0.5  # > 100 → mm

    def test_no_unit_medium_value_cm_heuristic(self):
        assert _dim_value_to_meters(50.0, "") == 0.5  # > 10 → cm

    def test_no_unit_small_value_meters(self):
        assert _dim_value_to_meters(5.0, "") == 5.0  # ≤ 10 → meters
