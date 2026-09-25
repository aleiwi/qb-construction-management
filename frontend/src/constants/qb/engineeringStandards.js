/**
 * مكتبة المعايير الهندسية المتقدمة
 * Saudi Building Code (SBC) & International Standards
 * آخر تحديث: 2025
 */

// ═══════════════════════════════════════════════════════════════
// 1. معايير الخرسانة (Concrete Standards)
// ═══════════════════════════════════════════════════════════════

export const concreteStandards = {
  // مقاومة الضغط (Compressive Strength)
  resistances: {
    C20: { strength: 20, usage: "بناء عادي، الدرجات والأرصفة" },
    C25: { strength: 25, usage: "المنشآت العادية والأعمدة" },
    C30: { strength: 30, usage: "الأساسات والبلاطات الرئيسية" },
    C35: { strength: 35, usage: "الأعمال الثقيلة والجسور" },
    C40: { strength: 40, usage: "الأعمال الخاصة والأبراج" },
    C50: { strength: 50, usage: "الأعمال الخاصة جداً والمشاريع المتقدمة" },
  },

  // نسب الخلط (Mix Design Ratios)
  mixDesign: {
    C20: { cement: 300, sand: 700, gravel: 1100, water: 180, ratio: "1:2.3:3.7" },
    C25: { cement: 320, sand: 680, gravel: 1080, water: 170, ratio: "1:2.1:3.4" },
    C30: { cement: 340, sand: 660, gravel: 1050, water: 160, ratio: "1:1.9:3.1" },
    C35: { cement: 370, sand: 630, gravel: 1000, water: 150, ratio: "1:1.7:2.7" },
    C40: { cement: 400, sand: 600, gravel: 950, water: 140, ratio: "1:1.5:2.4" },
  },

  // الأوزان الحجمية (Unit Weights)
  unitWeights: {
    normalConcrete: 2400, // كغ/م³
    lightConcrete: 1800, // كغ/م³
    heavyConcrete: 2800, // كغ/م³
  },

  // معاملات الأمان (Safety Factors)
  safetyFactors: {
    dead_load: 1.4,
    live_load: 1.6,
    seismic: 1.0,
  },
};

// ═══════════════════════════════════════════════════════════════
// 2. معايير الحديد (Steel Reinforcement Standards)
// ═══════════════════════════════════════════════════════════════

export const steelStandards = {
  // أقطار الحديد المتاحة (Available Diameters)
  diameters: {
    6: { diameter: 6, area: 0.283, weight: 0.222, usage: "الأربطة والشبكات الخفيفة" },
    8: { diameter: 8, area: 0.503, weight: 0.395, usage: "الأربطة والبنود الخفيفة" },
    10: { diameter: 10, area: 0.785, weight: 0.617, usage: "الانحناءات الرئيسية الخفيفة" },
    12: { diameter: 12, area: 1.131, weight: 0.888, usage: "الانحناءات الرئيسية" },
    14: { diameter: 14, area: 1.539, weight: 1.208, usage: "الانحناءات الثقيلة" },
    16: { diameter: 16, area: 2.011, weight: 1.579, usage: "الانحناءات الرئيسية الثقيلة" },
    18: { diameter: 18, area: 2.545, weight: 2.000, usage: "الأعمدة والأساسات" },
    20: { diameter: 20, area: 3.142, weight: 2.466, usage: "الأعمدة والأساسات الثقيلة" },
    22: { diameter: 22, area: 3.801, weight: 2.984, usage: "الأعمال الخاصة" },
    25: { diameter: 25, area: 4.909, weight: 3.854, usage: "الأعمال الخاصة والجسور" },
    28: { diameter: 28, area: 6.158, weight: 4.834, usage: "الأعمال الخاصة الثقيلة" },
    32: { diameter: 32, area: 8.042, weight: 6.313, usage: "الجسور والمنشآت الخاصة" },
  },

  // مقاومة الشد (Tensile Strength)
  tensileStrength: {
    mild: { name: "حديد عادي", fy: 240, fsu: 370, elongation: 23 },
    high_yield: { name: "حديد عالي الخضوع", fy: 400, fsu: 600, elongation: 14 },
    extra_high: { name: "حديد عالي جداً", fy: 500, fsu: 725, elongation: 10 },
  },

  // نسب الحديد (Reinforcement Ratios)
  ratios: {
    min_tension: 0.0015, // الحد الأدنى للشد
    max_tension: 0.04, // الحد الأقصى للشد
    min_compression: 0.01, // الحد الأدنى للضغط
    max_compression: 0.06, // الحد الأقصى للضغط
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. معايير التصميم والأحمال (Design & Load Standards)
// ═══════════════════════════════════════════════════════════════

export const designStandards = {
  // الأحمال الحية (Live Loads) - SBC
  liveLoads: {
    residential: 1.5, // كيلو نيوتن/م²
    office: 2.5,
    shopping_mall: 4.0,
    warehouse: 5.0,
    parking: 2.5,
    stairways: 3.0,
    corridors: 3.0,
    roof: 0.6,
  },

  // الأحمال الميتة (Dead Loads)
  deadLoads: {
    concrete_floor: 0.024, // كيلو نيوتن/م² لكل سم
    brick_wall: 0.019, // كيلو نيوتن/م² لكل سم
    tile: 0.02,
    plaster: 0.018,
    roofing: 1.2,
  },

  // عمق التغطية الخرسانية (Concrete Cover)
  concreteCover: {
    exposure_normal: 40, // ملم
    exposure_harsh: 50,
    exposure_severe: 75,
    columns: 40,
    footings: 75,
    slabs: 20,
  },

  // المسافات بين الأساور (Stirrup Spacing)
  stirrupSpacing: {
    support_region: 0.1, // مرات العمق الفعال
    mid_span: 0.2,
    max_spacing: 0.3,
  },
};

// ═══════════════════════════════════════════════════════════════
// 4. معايير الترتيب والفراغات (Spacing & Arrangement)
// ═══════════════════════════════════════════════════════════════

export const spacingStandards = {
  // المسافات بين الحديد (Bar Spacing)
  barSpacing: {
    minimum: 25, // ملم - الفراغ الأدنى بين القضبان
    preferredForCasting: 100, // ملم - المسافة المفضلة للصب
    maximumTension: 500, // ملم - الحد الأقصى في الشد
    maximumCompression: 300, // ملم - الحد الأقصى في الضغط
  },

  // سُمك البلاطات الدنيا (Minimum Slab Thickness)
  slabThickness: {
    one_way_simply_supported: { base: 10, span: 1 }, // span/10
    one_way_continuous: { base: 8, span: 1 }, // span/8
    two_way_simply_supported: { base: 30, span: 1 }, // 30ملم + span/30
    two_way_continuous: { base: 25, span: 1 }, // 25ملم + span/35
  },

  // ارتفاع الأعمدة الدنيا (Minimum Column Height)
  columnHeight: {
    residential: 3.0, // متر
    commercial: 3.5,
    industrial: 4.0,
    minimum: 2.5,
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. الحسابات والمعادلات المتقدمة (Advanced Calculations)
// ═══════════════════════════════════════════════════════════════

export const advancedCalculations = {
  /**
   * حساب مساحة الحديد المطلوبة
   * As = Mu / (0.87 * fy * (d - d'/2))
   */
  calculateSteelArea: (moment, yield_strength, effective_depth) => {
    return moment / (0.87 * yield_strength * effective_depth);
  },

  /**
   * حساب عدد القضبان المطلوبة
   */
  calculateBarCount: (required_area, bar_diameter) => {
    const bar_area = steelStandards.diameters[bar_diameter]?.area || 0;
    return Math.ceil(required_area / bar_area);
  },

  /**
   * حساب السهم (Deflection)
   * δ = (5 * w * L⁴) / (384 * E * I)
   */
  calculateDeflection: (load, length, youngs_modulus, moment_of_inertia) => {
    return (5 * load * Math.pow(length, 4)) / (384 * youngs_modulus * moment_of_inertia);
  },

  /**
   * حساب الإجهاد في الخرسانة
   * f = M / Z
   */
  calculateStress: (moment, section_modulus) => {
    return moment / section_modulus;
  },

  /**
   * حساب الحمل الحرج (Critical Load) - Buckling
   * Pcr = (π² * E * I) / (L/r)²
   */
  calculateBucklingLoad: (youngs_modulus, moment_of_inertia, length, radius_of_gyration) => {
    return (Math.pow(Math.PI, 2) * youngs_modulus * moment_of_inertia) / 
           Math.pow(length / radius_of_gyration, 2);
  },

  /**
   * حساب نسبة التسليح الفعلية
   * ρ = As / (b * d)
   */
  calculateReinforcementRatio: (steel_area, width, effective_depth) => {
    return steel_area / (width * effective_depth);
  },

  /**
   * التحقق من الحد الأدنى والأقصى للتسليح
   */
  validateReinforcementRatio: (ratio, ratio_type = 'tension') => {
    const min = ratio_type === 'tension' ? 
      steelStandards.ratios.min_tension : 
      steelStandards.ratios.min_compression;
    const max = ratio_type === 'tension' ? 
      steelStandards.ratios.max_tension : 
      steelStandards.ratios.max_compression;

    return {
      isValid: ratio >= min && ratio <= max,
      min,
      max,
      ratio,
      status: ratio < min ? 'أقل من الحد الأدنى' : 
              ratio > max ? 'أعلى من الحد الأقصى' : 
              'ضمن الحدود المسموحة'
    };
  },
};

// ═══════════════════════════════════════════════════════════════
// 6. جداول المعايير السريعة (Quick Reference Tables)
// ═══════════════════════════════════════════════════════════════

export const quickReferences = {
  // جدول الحديد حسب النسبة المئوية
  steelPercentageTable: {
    "0.5%": { per_m2: 5, remark: "خفيف جداً" },
    "0.75%": { per_m2: 7.5, remark: "خفيف" },
    "1.0%": { per_m2: 10, remark: "متوسط" },
    "1.25%": { per_m2: 12.5, remark: "متوسط-ثقيل" },
    "1.5%": { per_m2: 15, remark: "ثقيل" },
    "2.0%": { per_m2: 20, remark: "ثقيل جداً" },
  },

  // جدول الخرسانة حسب المقاومة
  concreteYieldTable: {
    C20: { yield_7days: 10, yield_28days: 20, compaction_factor: 0.82 },
    C25: { yield_7days: 13, yield_28days: 25, compaction_factor: 0.85 },
    C30: { yield_7days: 16, yield_28days: 30, compaction_factor: 0.87 },
    C40: { yield_7days: 21, yield_28days: 40, compaction_factor: 0.90 },
  },

  // جدول معامل الخطأ (Safety Margins)
  safetyMargins: {
    design: 1.4,
    material: 1.5,
    execution: 1.2,
    total: 2.9, // ≈ 3
  },
};

// ═══════════════════════════════════════════════════════════════
// 7. التنبيهات والتوصيات (Warnings & Recommendations)
// ═══════════════════════════════════════════════════════════════

export const engineeringWarnings = {
  lowConcrete: {
    title: "تحذير: مقاومة خرسانة منخفضة",
    message: "استخدام C20 قد لا يكون مناسباً للأساسات الثقيلة",
    recommendation: "استخدم C30 أو أعلى"
  },

  highSteel: {
    title: "تحذير: نسبة تسليح عالية جداً",
    message: "نسبة التسليح تتجاوز 4% - قد تواجه صعوبات في الصب",
    recommendation: "قلل نسبة التسليح أو زد حجم المقطع"
  },

  thinSlab: {
    title: "تحذير: بلاطة رقيقة جداً",
    message: "سمك البلاطة أقل من الحد الأدنى الموصى به",
    recommendation: "تحقق من الحسابات أو زد سمك البلاطة"
  },

  longSpan: {
    title: "تحذير: فتحة كبيرة جداً",
    message: "الفتحة المطلوبة قد تسبب سهم كبير",
    recommendation: "أضف دعامات وسيطة أو استخدم حديد أقوى"
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. معايير خاصة بالمملكة العربية السعودية
// ═══════════════════════════════════════════════════════════════

export const saudiStandards = {
  seismicZone: {
    zone_1: { acceleration: 0.04, description: "منطقة منخفضة الخطورة" },
    zone_2: { acceleration: 0.12, description: "منطقة متوسطة الخطورة" },
    zone_3: { acceleration: 0.24, description: "منطقة عالية الخطورة" },
  },

  windLoad: {
    normal: 0.8, // كيلو نيوتن/م²
    moderate: 1.2,
    high: 1.6,
  },

  temperatureEffects: {
    dailyVariation: 30, // درجة مئوية
    seasonalVariation: 45,
    expansionCoefficient: 0.000012, // لكل درجة مئوية
  },
};

export default {
  concreteStandards,
  steelStandards,
  designStandards,
  spacingStandards,
  advancedCalculations,
  quickReferences,
  engineeringWarnings,
  saudiStandards,
};
