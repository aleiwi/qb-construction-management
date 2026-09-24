"""Quick villa estimator (merged from the legacy QuantumBuild calculator).

Formulas ported verbatim from the legacy `calculatorLogic.js`
(steel ratios per item, block rules, area/profit math) so estimates match
what the old tool produced. Stateless: no DB writes, pure computation.

Conventions (legacy):
- concrete m³ = L × W × T (elevatorsum: L × W — concrete()).
- steel tons  = concrete × steel_ratio(kg/m³) / 1000.
- blocks      = item-specific rule (Mida special, zero-set, length-based).
- final price = costs × (1 + profit%), per-m² = costs / total area.
"""
from typing import Dict, List

# name -> (group, steel_ratio kg/m³). Ported from calculationConstants.js.
# Reachable dropdown names carry the legacy getSteelRatio values verbatim;
# spelling aliases (no-hamza etc., unreachable in the legacy dropdown) take
# the sensible ratio instead of the legacy dead-path default of 100.
ITEMS: Dict[str, Dict] = {
    "صبة النظافة": {"group": "foundations", "steel_ratio": 0},
    "القواعد": {"group": "foundations", "steel_ratio": 150},
    "صبة اللبشة 2": {"group": "foundations", "steel_ratio": 150},
    "صبة اللبشة2": {"group": "foundations", "steel_ratio": 150},
    "الميدا": {"group": "foundations", "steel_ratio": 100},
    "الأرضية بين الميدات": {"group": "foundations", "steel_ratio": 40},
    "الارضية بين الميدات": {"group": "foundations", "steel_ratio": 40},
    "جدار القبو": {"group": "foundations", "steel_ratio": 150},
    "الأرضي": {"group": "slabs", "steel_ratio": 120},
    "الاول": {"group": "slabs", "steel_ratio": 120},
    "الأول": {"group": "slabs", "steel_ratio": 120},
    "ارضي": {"group": "slabs", "steel_ratio": 120},
    "اول": {"group": "slabs", "steel_ratio": 120},
    "الثاني": {"group": "slabs", "steel_ratio": 120},
    "المتكرر": {"group": "slabs", "steel_ratio": 120},
    "الملحق": {"group": "slabs", "steel_ratio": 120},
    "أدوار القبو": {"group": "slabs", "steel_ratio": 120},
    "ادوار القبو": {"group": "slabs", "steel_ratio": 120},
    "مسطح الأعمدة": {"group": "columns", "steel_ratio": 250},
    "مسطح الاعمدة": {"group": "columns", "steel_ratio": 250},
    "الأعمدة": {"group": "columns", "steel_ratio": 250},
    "الاعمدة": {"group": "columns", "steel_ratio": 250},
    "الأسقف": {"group": "tanks", "steel_ratio": 130},
    "الاسقف": {"group": "tanks", "steel_ratio": 130},
    "الجدران": {"group": "tanks", "steel_ratio": 130},
    "اللبشة": {"group": "tanks", "steel_ratio": 100},
    "السقف": {"group": "wells", "steel_ratio": 130},
    "الطرنشات": {"group": "wells", "steel_ratio": 100},
    "المقلوب": {"group": "others", "steel_ratio": 100},
    "أعمدة السور": {"group": "others", "steel_ratio": 100},
    "اعمدة السور": {"group": "others", "steel_ratio": 100},
    "السور / كرنيش السور": {"group": "others", "steel_ratio": 100},
    "السور /كرنيش السور": {"group": "others", "steel_ratio": 100},
    "كل المصاعد": {"group": "others", "steel_ratio": 100},
}

ITEM_GROUPS: Dict[str, str] = {
    "foundations": "الأساسات",
    "slabs": "الأسقف",
    "columns": "الأعمدة",
    "tanks": "الخزانات",
    "wells": "الآبار",
    "others": "أخرى",
}

_ZERO_BLOCK = {
    "صبة النظافة", "القواعد", "صبة اللبشة2", "صبة اللبشة 2",
    "الارضية بين الميدات", "الأرضية بين الميدات",
    "مسطح الاعمدة", "مسطح الأعمدة", "الاسقف", "الأسقف",
    "اللبشة", "السقف", "الاعمدة", "الأعمدة", "الطرنشات",
    "المقلوب", "اعمدة السور", "أعمدة السور",
    "السور / كرنيش السور", "السور /كرنيش السور", "كل المصاعد",
}

_ZERO_AREA = {
    # Legacy zeroAreaItems verbatim (area math) — NOT the same as _ZERO_BLOCK.
    # Alias spellings (no-hamza etc.) are intentionally absent here, exactly
    # as in the legacy code, so they keep area = length × factor.
    "صبة النظافة", "القواعد", "صبة اللبشة 2", "الميدا",
    "الأرضية بين الميدات", "جدار القبو", "مسطح الاعمدة", "مسطح الأعمدة",
    "الجدران", "اللبشة", "الاعمدة", "الأعمدة", "الطرنشات",
    "اعمدة السور", "أعمدة السور",
}

# Legacy zeroConversionItems verbatim (UI shows locked "0 (ثابت)").
_FACTOR_LOCKED = {
    "صبة النظافة", "القواعد", "صبة اللبشة 2", "الميدا",
    "الأرضية بين الميدات", "جدار القبو", "مسطح الأعمدة",
    "الجدران", "اللبشة", "الأعمدة", "الطرنشات", "أعمدة السور",
}


def block_quantity(name: str, length: float, thickness: float) -> float:
    if name == "الميدا":
        return (0.4 / length) * 2 if length > 0 else 0.0
    if name in _ZERO_BLOCK:
        return 0.0
    if name == "جدار القبو":
        return length * thickness * 12.5
    if name in ("ادوار القبو", "أدوار القبو"):
        return length * 2 * 12.5
    if name in ("ارضي", "الأرضي", "اول", "الأول"):
        return length * 3 * 12.5
    if name in ("الثاني", "المتكرر", "الملحق"):
        return length * 2 * 12.5
    if name in ("الجدران", "الطرنشات", "السور / كرنيش السور", "السور /كرنيش السور"):
        return length * thickness * 12.5
    return 0.0


def calculate_item(name: str, length: float, width: float, thickness: float,
                   concrete_price: float, steel_price: float, block_price: float,
                   pre_area: float = 0.0, conversion_factor: float = 1.0) -> Dict:
    concrete = length * width if name == "كل المصاعد" else length * width * thickness
    steel = concrete * ITEMS[name]["steel_ratio"] / 1000
    blocks = block_quantity(name, length, thickness)
    if name == "كل المصاعد":
        area = pre_area * conversion_factor  # legacy: manual area × editable factor
    else:
        # legacy: factor forced 0 for zero-area items, else user factor (default 1)
        area = 0.0 if name in _ZERO_AREA else length * conversion_factor
    total = concrete * concrete_price + steel * steel_price + blocks * block_price
    return {
        "name": name,
        "group": ITEMS[name]["group"],
        "concrete_m3": round(concrete, 2),
        "volume_m3": round(concrete, 2),
        "steel_tons": round(steel, 3),
        "blocks": round(blocks, 2),
        "area_m2": round(area, 2),
        "concrete_cost": round(concrete * concrete_price, 2),
        "steel_cost": round(steel * steel_price, 2),
        "block_cost": round(blocks * block_price, 2),
        "total_cost": round(total, 2),
    }


def calculate_totals(items: List[Dict], factory_rate: float, overhead: float,
                     profit_rate: float, backfill_qty: float, backfill_price: float,
                     insulation_qty: float, insulation_price: float) -> Dict:
    concrete = sum(i["concrete_m3"] for i in items)
    steel = sum(i["steel_tons"] for i in items)
    blocks = sum(i["blocks"] for i in items)
    materials = sum(i["total_cost"] for i in items)
    area = sum(i["area_m2"] for i in items)
    contractor = area * factory_rate
    backfill = backfill_qty * backfill_price
    insulation = insulation_qty * insulation_price
    additional = contractor + overhead + backfill + insulation
    before_profit = materials + additional
    final = before_profit * (1 + profit_rate / 100)
    profit = final - before_profit
    return {
        "concrete_m3": round(concrete, 2),
        "steel_tons": round(steel, 3),
        "blocks": round(blocks, 2),
        "area_m2": round(area, 2),
        "materials_cost": round(materials, 2),
        "contractor_cost": round(contractor, 2),
        "overhead": round(overhead, 2),
        "backfill_cost": round(backfill, 2),
        "insulation_cost": round(insulation, 2),
        "total_before_profit": round(before_profit, 2),
        "profit": round(profit, 2),
        "final_price": round(final, 2),
        "cost_per_m2": round(before_profit / area, 2) if area > 0 else 0.0,
    }


def catalog() -> List[Dict]:
    return [
        {"name": name, "group": meta["group"],
         "group_label": ITEM_GROUPS[meta["group"]],
         "steel_ratio": meta["steel_ratio"],
         "factor_locked": name in _FACTOR_LOCKED}
        for name, meta in ITEMS.items()
    ]
