from typing import Dict, Optional, List, Tuple


# Default markup rates
DEFAULT_MARKUP = {
    "profit_margin": 0.15,         # 15% profit
    "overhead_percent": 0.10,      # 10% overhead
    "contingency_percent": 0.05,   # 5% contingency
    "vat_rate": 0.15,              # 15% VAT (Saudi Arabia)
}


def calculate_markup(
    base_cost: float,
    profit_margin: float = DEFAULT_MARKUP["profit_margin"],
    overhead_percent: float = DEFAULT_MARKUP["overhead_percent"],
    contingency_percent: float = DEFAULT_MARKUP["contingency_percent"],
    vat_rate: float = DEFAULT_MARKUP["vat_rate"],
) -> Dict[str, float]:
    if base_cost <= 0:
        return {"base_cost": 0, "overhead": 0, "profit": 0, "contingency": 0, "subtotal": 0, "vat": 0, "total": 0}

    overhead = base_cost * overhead_percent
    cost_with_overhead = base_cost + overhead
    profit = cost_with_overhead * profit_margin
    subtotal = cost_with_overhead + profit
    contingency = subtotal * contingency_percent
    pre_vat = subtotal + contingency
    vat = pre_vat * vat_rate
    total = pre_vat + vat

    return {
        "base_cost": round(base_cost, 2),
        "overhead": round(overhead, 2),
        "profit": round(profit, 2),
        "contingency": round(contingency, 2),
        "subtotal": round(subtotal, 2),
        "vat": round(vat, 2),
        "total": round(total, 2),
        "total_without_vat": round(subtotal + contingency, 2),
    }


def price_element(
    quantity: float,
    unit_price: float,
    unit: str,
    description: str = "",
    markup_config: Optional[Dict] = None,
) -> Dict:
    base_cost = quantity * unit_price
    markup = calculate_markup(base_cost, **(markup_config or {}))

    return {
        "quantity": round(quantity, 4),
        "unit_price": round(unit_price, 2),
        "unit": unit,
        "description": description,
        "base_cost": round(base_cost, 2),
        **markup,
    }


SEED_PRICES = [
    # Concrete works (SAR / m³)
    ("concrete_wall", "خرسانة مسلحة للجدران", "م3", 520.0),
    ("concrete_column", "خرسانة مسلحة للأعمدة", "م3", 570.0),
    ("concrete_slab", "خرسانة مسلحة للبلاطات", "م3", 470.0),
    ("concrete_beam", "خرسانة مسلحة للكمرات", "م3", 530.0),
    ("concrete_foundation", "خرسانة مسلحة للأساسات", "م3", 490.0),
    ("concrete_stairs", "خرسانة مسلحة للدرج", "م3", 550.0),
    # Reinforcement
    ("rebar", "حديد تسليح (سعر الطن)", "طن", 3200.0),
    ("rebar_wall", "حديد تسليح جدران", "طن", 3100.0),
    ("rebar_column", "حديد تسليح أعمدة", "طن", 3300.0),
    ("rebar_slab", "حديد تسليح بلاطات", "طن", 3000.0),
    # Masonry & partitions
    ("partition", "جدار طوب فاصل", "م2", 85.0),
    ("partition_gypsum", "جدار جبس بورد", "م2", 65.0),
    ("partition_plaster", "لياسة جدران", "م2", 30.0),
    # Finishes
    ("plastering", "لياسة أسمنتية", "م2", 28.0),
    ("painting", "دهان جدران", "م2", 20.0),
    ("tiling_floor", "بلاط أرضيات", "م2", 85.0),
    ("tiling_wall", "بلاط جدران", "م2", 75.0),
    ("ceiling", "سقف معلق", "م2", 95.0),
    # Doors & windows
    ("door_wood", "باب خشب داخلي", "قطعة", 850.0),
    ("door_metal", "باب حديد خارجي", "قطعة", 1200.0),
    ("door_aluminum", "باب ألمنيوم", "قطعة", 950.0),
    ("window_aluminum", "نافذة ألمنيوم", "قطعة", 650.0),
    ("window_glass", "زجاج سيكوريت", "م2", 180.0),
    # MEP
    ("electrical_point", "نقطة كهرباء", "نقطة", 75.0),
    ("plumbing_point", "نقطة سباكة", "نقطة", 120.0),
    ("ac_unit", "وحدة تكييف", "قطعة", 2500.0),
    # Site works
    ("excavation", "حفر", "م3", 35.0),
    ("backfill", "ردم", "م3", 25.0),
    ("leveling", "تسوية أرض", "م2", 12.0),
    # Waterproofing
    ("waterproofing", "عازل مائي", "م2", 45.0),
    ("insulation", "عازل حراري", "م2", 55.0),
]


def get_seed_prices() -> List[Tuple[str, str, str, float]]:
    return SEED_PRICES
