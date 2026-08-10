from typing import Optional, Tuple
from app.models.boq_element import ElementType, ClassificationStatus


def score_classification(
    element_type: ElementType,
    rule_result: Optional[Tuple[ElementType, float]],
    llm_result: Optional[Tuple[ElementType, float]],
    context_features: dict,
) -> Tuple[ElementType, ClassificationStatus, float]:
    """
    Combine rule-based and LLM results into final classification.
    Returns: (element_type, classification_status, confidence)
    """
    final_type = element_type
    final_confidence = 0.0

    rule_et, rule_conf = rule_result if rule_result else (None, 0.0)
    llm_et, llm_conf = llm_result if llm_result else (None, 0.0)

    if rule_et is not None and rule_conf >= 0.85:
        # High-confidence rule match — use it directly
        final_type = rule_et
        final_confidence = rule_conf
        status = ClassificationStatus.AUTO_CLASSIFIED
        return (final_type, status, final_confidence)

    if rule_et is not None and llm_et is not None:
        # Both available — combine
        if rule_et == llm_et:
            # Agreement: boost confidence
            final_type = rule_et
            final_confidence = min((rule_conf + llm_conf) / 2.0 + 0.15, 0.95)
            status = ClassificationStatus.AUTO_CLASSIFIED
        else:
            # Disagreement: use higher confidence source
            if rule_conf >= llm_conf:
                final_type = rule_et
                final_confidence = rule_conf * 0.8
                status = ClassificationStatus.UNCLASSIFIED if rule_conf < 0.7 else ClassificationStatus.AUTO_CLASSIFIED
            else:
                final_type = llm_et
                final_confidence = llm_conf * 0.8
                status = ClassificationStatus.UNCLASSIFIED if llm_conf < 0.7 else ClassificationStatus.AUTO_CLASSIFIED
        return (final_type, status, final_confidence)

    if rule_et is not None:
        # Rules only
        final_type = rule_et
        final_confidence = rule_conf
        status = ClassificationStatus.AUTO_CLASSIFIED if rule_conf >= 0.6 else ClassificationStatus.UNCLASSIFIED
        return (final_type, status, final_confidence)

    if llm_et is not None:
        # LLM only
        final_type = llm_et
        final_confidence = llm_conf
        status = ClassificationStatus.AUTO_CLASSIFIED if llm_conf >= 0.7 else ClassificationStatus.UNCLASSIFIED
        return (final_type, status, final_confidence)

    # Nothing matched — keep as OTHER
    return (ElementType.OTHER, ClassificationStatus.UNCLASSIFIED, 0.0)


def calculate_auto_confidence(element_type: ElementType, features: dict) -> float:
    """Calculate base confidence from features when no classifier matches."""
    base = 0.3
    boosts = []

    if features.get("is_rectangular"):
        boosts.append(0.05)
    if features.get("has_text"):
        boosts.append(0.05)
    if features.get("is_large_area"):
        if element_type in (ElementType.SLAB, ElementType.ROOF):
            boosts.append(0.15)
    if features.get("is_long"):
        if element_type in (ElementType.WALL, ElementType.BEAM):
            boosts.append(0.10)
    if features.get("is_circular"):
        if element_type in (ElementType.COLUMN, ElementType.FOUNDATION):
            boosts.append(0.10)
    if element_type == ElementType.OTHER:
        return 0.0

    return min(base + sum(boosts), 0.85)
