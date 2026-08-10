from typing import List, Tuple, Optional
import math

class GeometryCalculator:
    @staticmethod
    def polygon_area(points: List[Tuple[float, float]]) -> float:
        if len(points) < 3:
            return 0.0
        area = 0.0
        n = len(points)
        for i in range(n):
            j = (i + 1) % n
            area += points[i][0] * points[j][1]
            area -= points[j][0] * points[i][1]
        return abs(area) / 2.0

    @staticmethod
    def polyline_length(points: List[Tuple[float, float]]) -> float:
        if len(points) < 2:
            return 0.0
        length = 0.0
        for i in range(len(points) - 1):
            dx = points[i + 1][0] - points[i][0]
            dy = points[i + 1][1] - points[i][1]
            length += math.sqrt(dx * dx + dy * dy)
        return length

    @staticmethod
    def arc_length(radius: float, start_angle: float, end_angle: float) -> float:
        return radius * abs(end_angle - start_angle)

    @staticmethod
    def ellipse_area(semi_major: float, semi_minor: float) -> float:
        return math.pi * semi_major * semi_minor

    @staticmethod
    def bounding_box(points: List[Tuple[float, float]]) -> Tuple[float, float, float, float]:
        if not points:
            return (0.0, 0.0, 0.0, 0.0)
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        return (min(xs), min(ys), max(xs), max(ys))

    @staticmethod
    def shape_aspect_ratio(points: List[Tuple[float, float]]) -> float:
        if len(points) < 3:
            return 0.0
        x_min, y_min, x_max, y_max = GeometryCalculator.bounding_box(points)
        width = x_max - x_min
        height = y_max - y_min
        if height == 0:
            return float("inf")
        return width / height

    @staticmethod
    def is_likely_wall(points: List[Tuple[float, float]]) -> bool:
        if len(points) < 4:
            return False
        ratio = GeometryCalculator.shape_aspect_ratio(points)
        return ratio > 3.0 or ratio < 0.33

    @staticmethod
    def is_likely_column(points: List[Tuple[float, float]]) -> bool:
        if len(points) < 4:
            return False
        ratio = GeometryCalculator.shape_aspect_ratio(points)
        area = GeometryCalculator.polygon_area(points)
        return 0.5 <= ratio <= 2.0 and area < 1.0

    @staticmethod
    def compute_volume_from_thickness(
        area: float,
        thickness: Optional[float] = None,
        height: Optional[float] = None,
        width: Optional[float] = None,
        depth: Optional[float] = None,
    ) -> float:
        if thickness:
            return area * thickness
        if height and width:
            return area * min(height, width)
        if depth:
            return area * depth
        return area * 0.3

    @staticmethod
    def circle_area(radius: float) -> float:
        return math.pi * radius * radius

    @staticmethod
    def rectangle_area(width: float, height: float) -> float:
        return width * height

    @staticmethod
    def triangle_area(base: float, height: float) -> float:
        return 0.5 * base * height

    @staticmethod
    def distance_between(x1: float, y1: float, x2: float, y2: float) -> float:
        return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
