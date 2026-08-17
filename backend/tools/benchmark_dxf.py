"""مولد مخططات DXF اصطناعية ببيانات مرجعية معروفة (ground truth).

يولّد آلاف المخططات بقيم معروفة بدقة (عدد الجدران، أبعادها، أنواعها...)
ثم يمررها على نظام QB ويقارن المخرجات بالحقيقة المرجعية.

الاستخدام:
    python tools/benchmark_dxf.py --count 1000 --out results.json
"""
import argparse
import json
import math
import random
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.boq_extraction_service import extract_elements_from_dxf

# ---------------- مولد المخططات ----------------

LAYER_NAMES = {
    "wall": ["A-WALL", "WALLS", "a-wall", "WALL", "جدار", "A-WALLS", "shearwall", "WALL-STRUCT"],
    "column": ["COLUMN", "A-COLUMN", "COL", "COLS", "عمود", "RCC-COLUMN", "COLUMN-STRUCT"],
    "slab": ["SLAB", "A-SLAB", "FLOOR SLAB", "ROOF SLAB", "بلاطة", "SLAB-STRUCT", "DECK"],
    "beam": ["BEAM", "A-BEAM", "BEAMS", "RCC-BEAM", "كمرة", "BEAM-STRUCT"],
    "foundation": ["FOOTING", "FOUNDATION", "A-FOUNDATION", "FND", "أساس", "ISOLATED FOOTING"],
    "door": ["DOOR", "DOORS", "باب", "DOOR-FRAME"],
    "window": ["WINDOW", "WINDOWS", "نافذة", "GLAZING", "WIN"],
    "stair": ["STAIR", "STAIRS", "درج", "STAIRCASE", "RAMP"],
    "roof": ["ROOF", "ROOFING", "تسقيف"],
    "partition": ["PARTITION", "DRYWALL", "GYPSUM", "حاجز", "PART"],
}


class DrawingGenerator:
    """يولّد مخطط DXF بمعرفة كاملة بمحتواه."""

    def __init__(self, seed: int):
        self.seed = seed
        self.rng = random.Random(seed)

    def _rect_polyline(self, msp, x0, y0, w, h, layer):
        pts = [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)]
        msp.add_lwpolyline(pts, format="xy", close=True, dxfattribs={"layer": layer})

    def _rect_line(self, msp, x0, y0, w, h, layer):
        msp.add_line((x0, y0), (x0 + w, y0), dxfattribs={"layer": layer})
        msp.add_line((x0 + w, y0), (x0 + w, y0 + h), dxfattribs={"layer": layer})
        msp.add_line((x0 + w, y0 + h), (x0, y0 + h), dxfattribs={"layer": layer})
        msp.add_line((x0, y0 + h), (x0, y0), dxfattribs={"layer": layer})

    def _line(self, msp, x0, y0, x1, y1, layer):
        msp.add_line((x0, y0), (x1, y1), dxfattribs={"layer": layer})

    def _circle(self, msp, cx, cy, r, layer):
        msp.add_circle((cx, cy), r, dxfattribs={"layer": layer})

    def _linear_dim(self, msp, x1, y1, x2, y2, offset=-0.8):
        """قياس خطي (DIMLINEAR) موازٍ للقطعة (x1,y1)-(x2,y2) بإزاحة offset."""
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy)
        if length == 0:
            return
        nx, ny = -dy / length, dx / length  # العمودي
        base = (x1 + nx * offset, y1 + ny * offset)
        dim = msp.add_linear_dim(base=base, p1=(x1, y1), p2=(x2, y2),
                                 dxfattribs={"layer": "DIMS"})
        dim.render()

    def _text(self, msp, x, y, text, layer="TEXT"):
        msp.add_text(text, dxfattribs={"layer": layer}).set_placement((x, y))

    def _unit_block(self, doc, name="QB_OPEN_1X1"):
        """ج7: كتلة مستطيل وحدة 1×1 — تُدرج بمقياس (عرض×سماكة) كفتحة/باب."""
        if name in doc.blocks:
            return name
        blk = doc.blocks.new(name)
        blk.add_lwpolyline([(0, 0), (1, 0), (1, 1), (0, 1)], close=True, dxfattribs={"layer": "0"})
        return name

    def generate(self, dxf_path: Path, scenario: dict) -> dict:
        """يولّد مخططًا ويعيد الحقيقة المرجعية الخاصة به."""
        import ezdxf

        doc = ezdxf.new("R2010")
        msp = doc.modelspace()

        truth = {"walls": [], "columns": [], "slabs": [], "beams": [], "foundations": [],
                 "doors": 0, "windows": 0, "stairs": 0, "partitions": [], "roofs": []}
        x_cursor = 0.0
        y_base = 0.0

        use_closed_polyline = scenario.get("closed_polyline", True)
        wall_thickness = scenario.get("wall_thickness", 0.2)
        wall_height = scenario.get("wall_height", 3.0)

        # ---- جدران ----
        n_walls = scenario.get("n_walls", self.rng.randint(2, 8))
        layer = self.rng.choice(LAYER_NAMES["wall"])
        use_dims = scenario.get("with_dims", False)
        wall_height = scenario.get("wall_height", 3.0)
        wall_thickness = scenario.get("wall_thickness", 0.2)
        if use_dims:
            wall_height = round(self.rng.uniform(2.8, 3.6), 2)
            wall_thickness = round(self.rng.uniform(0.15, 0.30), 2)
        wall_rects = []  # (x0, y0, length, thickness, truth_index) لرسم الفتحات على الجدران
        for i in range(n_walls):
            length = round(self.rng.uniform(3.0, 12.0), 2)
            x0 = x_cursor + i * (length + 0.5)
            if use_closed_polyline:
                self._rect_polyline(msp, x0, y_base, length, wall_thickness, layer)
            else:
                self._rect_line(msp, x0, y_base, length, wall_thickness, layer)
            if use_dims:
                self._linear_dim(msp, x0, y_base, x0 + length, y_base, offset=-0.8)
                self._text(msp, x0 + 0.2, y_base + wall_thickness + 0.3,
                           f"H={wall_height} T={wall_thickness}", layer=layer)
            truth["walls"].append({
                "length": length,
                "height": wall_height,
                "thickness": wall_thickness,
                "volume": round(length * wall_height * wall_thickness, 4),
                "layer": layer,
            })
            wall_rects.append((x0, y_base, length, wall_thickness, len(truth["walls"]) - 1))

        # ---- أعمدة ----
        n_cols = scenario.get("n_columns", self.rng.randint(2, 10))
        layer = self.rng.choice(LAYER_NAMES["column"])
        for i in range(n_cols):
            size = round(self.rng.uniform(0.25, 0.6), 2)
            cx = 20.0 + i * 2.5
            cy = 15.0 + self.rng.uniform(0, 5)
            self._circle(msp, cx, cy, size / 2, layer)
            col_height = scenario.get("col_height", 3.0)
            truth["columns"].append({
                "diameter": round(size, 2),
                "height": col_height,
                "volume": round(math.pi * (size / 2) ** 2 * col_height, 4),
                "layer": layer,
            })

        # ---- بلاطات ----
        n_slabs = scenario.get("n_slabs", self.rng.randint(1, 4))
        layer = self.rng.choice(LAYER_NAMES["slab"])
        slab_thickness = scenario.get("slab_thickness", 0.2)
        if use_dims:
            slab_thickness = round(self.rng.uniform(0.15, 0.35), 2)
        for i in range(n_slabs):
            w = round(self.rng.uniform(6.0, 15.0), 2)
            h = round(self.rng.uniform(4.0, 10.0), 2)
            x0 = 40.0 + i * 16.0
            y0 = 10.0
            self._rect_polyline(msp, x0, y0, w, h, layer)
            if use_dims:
                self._linear_dim(msp, x0, y0, x0 + w, y0, offset=-0.8)
                self._linear_dim(msp, x0, y0, x0, y0 + h, offset=-0.8)
                self._text(msp, x0 + 0.3, y0 + 0.4, f"T={slab_thickness}", layer=layer)
            truth["slabs"].append({
                "area": round(w * h, 4),
                "thickness": slab_thickness,
                "volume": round(w * h * slab_thickness, 4),
                "layer": layer,
            })

        # ---- كمرات ----
        n_beams = scenario.get("n_beams", self.rng.randint(1, 5))
        layer = self.rng.choice(LAYER_NAMES["beam"])
        beam_w = scenario.get("beam_width", 0.3)
        beam_d = scenario.get("beam_depth", 0.5)
        if use_dims:
            beam_w = round(self.rng.uniform(0.2, 0.45), 2)
            beam_d = round(self.rng.uniform(0.4, 0.8), 2)
        for i in range(n_beams):
            length = round(self.rng.uniform(4.0, 10.0), 2)
            x0 = 10.0 + i * 12.0
            y0 = 30.0
            self._rect_polyline(msp, x0, y0, length, beam_w, layer)
            if use_dims:
                self._linear_dim(msp, x0, y0, x0 + length, y0, offset=-0.8)
                self._text(msp, x0 + 0.2, y0 + beam_w + 0.3, f"W={beam_w} D={beam_d}", layer=layer)
            truth["beams"].append({
                "length": length,
                "width": beam_w,
                "depth": beam_d,
                "volume": round(length * beam_w * beam_d, 4),
                "layer": layer,
            })

        # ---- أساسات ----
        n_fnd = scenario.get("n_foundations", self.rng.randint(1, 4))
        layer = self.rng.choice(LAYER_NAMES["foundation"])
        fnd_depth = scenario.get("fnd_depth", 0.5)
        for i in range(n_fnd):
            size = round(self.rng.uniform(1.0, 3.0), 2)
            x0 = 55.0 + i * 6.0
            y0 = 25.0
            self._rect_polyline(msp, x0, y0, size, size, layer)
            truth["foundations"].append({
                "area": round(size * size, 4),
                "depth": fnd_depth,
                "volume": round(size * size * fnd_depth, 4),
                "layer": layer,
            })

        # ---- أبواب ونوافذ (كتل أو طبقة) ----
        fixtures_as_blocks = scenario.get("fixtures_as_blocks", False)
        n_doors = scenario.get("n_doors", self.rng.randint(1, 8))
        layer = self.rng.choice(LAYER_NAMES["door"])
        if fixtures_as_blocks:
            block_name = self._unit_block(doc, f"QB_DOOR_{self.seed}")
            for i in range(n_doors):
                msp.add_blockref(block_name, (5.0 + i * 1.5, 35.0),
                                 dxfattribs={"layer": layer, "xscale": 0.9, "yscale": 2.1})
        else:
            for i in range(n_doors):
                self._rect_polyline(msp, 5.0 + i * 1.5, 35.0, 0.9, 2.1, layer)
        truth["doors"] = n_doors

        n_windows = scenario.get("n_windows", self.rng.randint(1, 8))
        layer = self.rng.choice(LAYER_NAMES["window"])
        if fixtures_as_blocks:
            block_name = self._unit_block(doc, f"QB_WIN_{self.seed}")
            for i in range(n_windows):
                msp.add_blockref(block_name, (5.0 + i * 1.6, 40.0),
                                 dxfattribs={"layer": layer, "xscale": 1.2, "yscale": 1.2})
        else:
            for i in range(n_windows):
                self._rect_polyline(msp, 5.0 + i * 1.6, 40.0, 1.2, 1.2, layer)
        truth["windows"] = n_windows

        # ---- ج6+ج7: فتحات داخل الجدران (تُخصم من حجم الجدار) ----
        if scenario.get("openings_in_walls", False):
            door_layer = self.rng.choice(LAYER_NAMES["door"])
            window_layer = self.rng.choice(LAYER_NAMES["window"])
            door_h = round(self.rng.uniform(2.0, 2.2), 2)
            window_h = round(self.rng.uniform(1.2, 1.6), 2)
            use_blocks = scenario.get("openings_as_blocks", False)
            if use_blocks:
                open_block = self._unit_block(doc, f"QB_OPEN_{self.seed}")
            # نصوص الارتفاع على طبقة الفتحات (تطبق على كل عناصر الطبقة)
            self._text(msp, 0.3, 1.0, f"H={door_h}", layer=door_layer)
            self._text(msp, 0.3, 1.5, f"H={window_h}", layer=window_layer)
            for (x0, y0, length, thk, wall_idx) in wall_rects:
                if length < 2.5:
                    continue
                n_open = self.rng.randint(0, 2)
                for _ in range(n_open):
                    is_door = self.rng.random() < 0.5
                    if is_door:
                        w = round(self.rng.uniform(0.8, 1.2), 2)
                        h = door_h
                        open_layer = door_layer
                    else:
                        w = round(self.rng.uniform(1.0, 1.8), 2)
                        h = window_h
                        open_layer = window_layer
                    if w >= length - 0.6:
                        continue
                    off = round(self.rng.uniform(0.3, length - w - 0.3), 2)
                    # مستطيل الفتحة بعرض w يغطي سماكة الجدار (يقع داخل الجدار)
                    if use_blocks:
                        msp.add_blockref(open_block, (x0 + off, y0),
                                         dxfattribs={"layer": open_layer, "xscale": w, "yscale": thk})
                    else:
                        self._rect_polyline(msp, x0 + off, y0, w, thk, open_layer)
                    wall = truth["walls"][wall_idx]
                    wall["volume"] = round(wall["volume"] - w * h * thk, 4)
                    wall.setdefault("openings", []).append({"w": w, "h": h, "is_door": is_door})
                    if is_door:
                        truth["doors"] += 1
                    else:
                        truth["windows"] += 1

        # ---- سلالم ----
        n_stairs = scenario.get("n_stairs", self.rng.randint(0, 2))
        layer = self.rng.choice(LAYER_NAMES["stair"])
        for i in range(n_stairs):
            self._rect_polyline(msp, 70.0 + i * 8.0, 30.0, 2.5, 1.2, layer)
        truth["stairs"] = n_stairs

        # ---- فواصل ----
        n_part = scenario.get("n_partitions", self.rng.randint(0, 4))
        layer = self.rng.choice(LAYER_NAMES["partition"])
        for i in range(n_part):
            length = round(self.rng.uniform(2.0, 6.0), 2)
            self._rect_polyline(msp, 80.0 + i * 7.0, 20.0, length, 0.1, layer)
            truth["partitions"].append({"length": length, "height": 3.0, "layer": layer})

        # ---- أسقف ----
        n_roofs = scenario.get("n_roofs", self.rng.randint(0, 2))
        layer = self.rng.choice(LAYER_NAMES["roof"])
        for i in range(n_roofs):
            w = round(self.rng.uniform(5.0, 10.0), 2)
            h = round(self.rng.uniform(4.0, 8.0), 2)
            self._rect_polyline(msp, 90.0 + i * 12.0, 35.0, w, h, layer)
            truth["roofs"].append({"area": round(w * h, 4), "layer": layer})

        # ---- نصوص تعريفية (أحيانًا) ----
        if scenario.get("add_text", True) and self.rng.random() < 0.5:
            for i, w in enumerate(truth["walls"][:3]):
                self._text(msp, 1.0 + i * 3.0, 1.0, f"WALL {i+1} 3.0m", layer="TEXT")

        doc.saveas(dxf_path)
        return truth


# ---------------- منطق المقارنة مع نظام QB ----------------

def expected_quantity(truth_item, kind: str) -> float:
    """الكمية المتوقعة من النظام إن عمل محرك الكميات بدقة."""
    return truth_item.get("volume", 0)


def system_computed_quantity(element_type: str, extracted_qty: float, unit: str, dims: dict) -> float:
    """يحاكي بالضبط ما يفعله boq_aggregator: compute_quantity على العنصر المستخرج."""
    from app.models.boq_element import ElementType
    from app.services.quantity_engine import compute_quantity

    try:
        et = ElementType(element_type) if isinstance(element_type, str) else element_type
    except ValueError:
        et = ElementType.OTHER

    qty, _, _ = compute_quantity(
        et,
        geometry_area=extracted_qty if unit in ("م2", "m2") else 0,
        geometry_length=extracted_qty if unit in ("م", "m") else 0,
        dimensions=dims or {},
    )
    return qty


def compare_truth_to_extracted(truth: dict, extracted: list) -> dict:
    """يقارن الحقيقة المرجعية بمخرجات الاستخراج + محرك الكميات.

    يعيد: ملخص أخطاء التصنيف + أخطاء الكمية (بالمتر المكعب الحقيقي).
    """
    # عدد العناصر المتوقع من أنواع مساحية/حجمية (مفاتيح = قيم enum النصية)
    expected_counts = {
        "wall": len(truth["walls"]),
        "column": len(truth["columns"]),
        "slab": len(truth["slabs"]),
        "beam": len(truth["beams"]),
        "foundation": len(truth["foundations"]),
        "door": truth["doors"],
        "window": truth["windows"],
        "stairs": truth["stairs"],
        "partition": len(truth["partitions"]),
        "roof": len(truth["roofs"]),
    }

    # تجميع العناصر المستخرجة حسب النوع (قيمة enum النصية)
    got_counts = {}
    for e in extracted:
        et_val = e["element_type"].value if hasattr(e["element_type"], "value") else e["element_type"]
        got_counts[et_val] = got_counts.get(et_val, 0) + 1

    type_errors = {}
    total_expected = 0
    correct = 0
    for kind, expected_n in expected_counts.items():
        total_expected += expected_n
        got_n = got_counts.get(kind, 0)
        correct += min(expected_n, got_n)
        if expected_n != got_n:
            type_errors[kind] = {"expected": expected_n, "got": got_n}

    # أخطاء الكمية: الحجم الحقيقي (م3) مقابل ما يحسبه النظام
    truth_volumes = {
        "wall": sum(w["volume"] for w in truth["walls"]),
        "column": sum(c["volume"] for c in truth["columns"]),
        "slab": sum(s["volume"] for s in truth["slabs"]),
        "beam": sum(b["volume"] for b in truth["beams"]),
        "foundation": sum(f["volume"] for f in truth["foundations"]),
    }
    qty_errors = {}
    for kind, expected_v in truth_volumes.items():
        if expected_v == 0:
            continue
        got_v = 0.0
        for e in extracted:
            et_val = e["element_type"].value if hasattr(e["element_type"], "value") else e["element_type"]
            if et_val != kind:
                continue
            got_v += system_computed_quantity(
                et_val,
                float(e.get("quantity", 0)),
                e.get("unit", "م2"),
                e.get("dimensions_json") or {},
            )
        if got_v > 0:
            qty_errors[kind] = round((got_v - expected_v) / expected_v * 100, 2)
        else:
            qty_errors[kind] = -100.0  # لم يُحسب أي شيء (عناصر مفقودة)

    classification_accuracy = round(correct / total_expected * 100, 2) if total_expected else 100.0
    return {
        "classification_accuracy": classification_accuracy,
        "type_errors": type_errors,
        "quantity_error_pct": qty_errors,
    }


# ---------------- المشغّل الرئيسي ----------------

def run_benchmark(count: int, out_dir: Path, seed_start: int = 1000) -> dict:
    gen = DrawingGenerator(seed_start)
    dxf_dir = out_dir / "dxf"
    dxf_dir.mkdir(parents=True, exist_ok=True)

    results = []
    start = time.time()

    for i in range(count):
        scenario = {
            "closed_polyline": i % 3 != 1,  # 1/3 مخططات بخطوط مفتوحة
            "with_dims": random.Random(seed_start + i * 29).random() < 0.5,  # نصف المخططات بأبعاد حقيقية
            "n_walls": random.Random(seed_start + i).randint(2, 8),
            "n_columns": random.Random(seed_start + i * 2).randint(2, 10),
            "n_slabs": random.Random(seed_start + i * 3).randint(1, 4),
            "n_beams": random.Random(seed_start + i * 5).randint(1, 5),
            "n_foundations": random.Random(seed_start + i * 7).randint(1, 4),
            "n_doors": random.Random(seed_start + i * 11).randint(1, 8),
            "n_windows": random.Random(seed_start + i * 13).randint(1, 8),
            "n_stairs": random.Random(seed_start + i * 17).randint(0, 2),
            "n_partitions": random.Random(seed_start + i * 19).randint(0, 4),
            "n_roofs": random.Random(seed_start + i * 23).randint(0, 2),
            "openings_in_walls": random.Random(seed_start + i * 31).random() < 0.5,
            "fixtures_as_blocks": random.Random(seed_start + i * 37).random() < 0.5,
            "openings_as_blocks": random.Random(seed_start + i * 41).random() < 0.5,
        }
        dxf_path = dxf_dir / f"plan_{i:05d}.dxf"
        truth = gen.generate(dxf_path, scenario)

        try:
            extracted = extract_elements_from_dxf(str(dxf_path))
        except Exception as e:
            results.append({"index": i, "error": str(e)})
            continue

        comparison = compare_truth_to_extracted(truth, extracted)
        comparison["index"] = i
        results.append(comparison)

        if (i + 1) % 250 == 0:
            print(f"  ... {i + 1}/{count}")

    elapsed = time.time() - start

    # التجميع
    accs = [r["classification_accuracy"] for r in results if "classification_accuracy" in r]
    qty_all = []
    for r in results:
        if "quantity_error_pct" in r:
            qty_all.extend(r["quantity_error_pct"].values())

    summary = {
        "total": count,
        "ok": len(accs),
        "errors": count - len(accs),
        "elapsed_sec": round(elapsed, 1),
        "avg_classification_accuracy": round(sum(accs) / len(accs), 2) if accs else None,
        "avg_quantity_error_pct": round(sum(qty_all) / len(qty_all), 2) if qty_all else None,
        "max_quantity_error_pct": round(max(qty_all), 2) if qty_all else None,
    }
    return {"summary": summary, "details": results}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QB DXF accuracy benchmark")
    parser.add_argument("--count", type=int, default=1000, help="عدد المخططات")
    parser.add_argument("--out", default="benchmark_results.json", help="ملف النتائج")
    args = parser.parse_args()

    out_dir = Path(__file__).resolve().parent.parent / "temp" / "benchmark"
    results = run_benchmark(args.count, out_dir)

    out_path = out_dir / args.out
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n===== ملخص القياس =====")
    for k, v in results["summary"].items():
        print(f"  {k}: {v}")
    print(f"\nالنتائج الكاملة: {out_path}")