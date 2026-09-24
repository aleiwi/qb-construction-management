// Single source of truth for BOQ element types (P1 fix).
// Canonical keys MUST match backend ElementType (wall/column/slab/beam/
// foundation/door/window/stairs/roof/partition/opening/other).
// Aliases (footing/staircase) exist only for legacy cached data.

export const ELEMENT_TYPE_LABELS = {
  wall: 'جدار',
  column: 'عمود',
  slab: 'بلاطة',
  beam: 'كمرة',
  foundation: 'أساس',
  door: 'باب',
  window: 'نافذة',
  stairs: 'درج',
  roof: 'سقف',
  partition: 'فاصل',
  opening: 'فتحة',
  furniture: 'أثاث',
  other: 'أخرى',
};

export const ELEMENT_TYPE_ALIASES = {
  footing: 'foundation',
  staircase: 'stairs',
};

export const ELEMENT_TYPE_KEYS = Object.keys(ELEMENT_TYPE_LABELS);

export function normalizeElementType(key) {
  if (!key) return 'other';
  if (ELEMENT_TYPE_LABELS[key]) return key;
  return ELEMENT_TYPE_ALIASES[key] || 'other';
}

export function elementLabel(key) {
  return ELEMENT_TYPE_LABELS[normalizeElementType(key)] || key || '—';
}
