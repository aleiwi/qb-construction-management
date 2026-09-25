// ثوابت الحسابات وتعريفات البنود

// تعريف البنود حسب الفئات
export const itemDefinitions = {
  foundations: [
    { id: "foundation_1", name: "صبة النظافة", steelRatio: 0 },
    { id: "foundation_2", name: "القواعد", steelRatio: 150 },
    { id: "foundation_3", name: "صبة اللبشة 2", steelRatio: 150 },
    { id: "foundation_4", name: "الميدا", steelRatio: 100 },
    { id: "foundation_5", name: "الأرضية بين الميدات", steelRatio: 40 },
    { id: "foundation_6", name: "جدار القبو", steelRatio: 150 },
  ],
  slabs: [
    { id: "slab_1", name: "الأرضي", steelRatio: 120 },
    { id: "slab_2", name: "الأول", steelRatio: 120 },
    { id: "slab_3", name: "الثاني", steelRatio: 120 },
    { id: "slab_4", name: "المتكرر", steelRatio: 120 },
    { id: "slab_5", name: "الملحق", steelRatio: 120 },
    { id: "slab_6", name: "أدوار القبو", steelRatio: 120 },
  ],
  columns: [{ id: "column_1", name: "مسطح الأعمدة", steelRatio: 250 }],
  tanks: [
    { id: "tank_1", name: "الأسقف", steelRatio: 130 },
    { id: "tank_2", name: "الجدران", steelRatio: 130 },
    { id: "tank_3", name: "اللبشة", steelRatio: 100 },
  ],
  wells: [
    { id: "well_1", name: "السقف", steelRatio: 130 },
    { id: "well_2", name: "الأعمدة", steelRatio: 250 },
    { id: "well_3", name: "الطرنشات", steelRatio: 100 },
  ],
  others: [
    { id: "other_1", name: "المقلوب", steelRatio: 100 },
    { id: "other_2", name: "أعمدة السور", steelRatio: 100 },
    { id: "other_3", name: "السور / كرنيش السور", steelRatio: 100 },
    { id: "other_4", name: "كل المصاعد", steelRatio: 100 },
  ],
};

// أسماء الفئات بالعربية
export const categoryNames = {
  foundations: "الأساسات",
  slabs: "الأسقف",
  columns: "الأعمدة",
  tanks: "الخزانات",
  wells: "الآبار",
  others: "أخرى",
};

// ألوان الفئات
export const categoryColors = {
  foundations: "border-amber-500 text-amber-700 bg-amber-50",
  slabs: "border-blue-500 text-blue-700 bg-blue-50",
  columns: "border-green-500 text-green-700 bg-green-50",
  tanks: "border-purple-500 text-purple-700 bg-purple-50",
  wells: "border-cyan-500 text-cyan-700 bg-cyan-50",
  others: "border-gray-500 text-gray-700 bg-gray-50",
};

// البنود التي كمية البلوك فيها دائماً 0
export const zeroBlockItems = new Set([
  "صبة النظافة",
  "القواعد",
  "صبة اللبشة2",
  "صبة اللبشة 2",
  "الارضية بين الميدات",
  "الأرضية بين الميدات",
  "مسطح الاعمدة",
  "مسطح الأعمدة",
  "الاسقف",
  "الأسقف",
  "اللبشة",
  "السقف",
  "الاعمدة",
  "الأعمدة",
  "الطرنشات",
  "المقلوب",
  "اعمدة السور",
  "أعمدة السور",
  "السور / كرنيش السور",
  "السور /كرنيش السور",
  "كل المصاعد",
]);

// البنود التي كمية البلوك فيها = الطول/0.4
export const lengthBasedBlockItems = new Set([
  "الميدا",
  "جدار القبو",
  "الجدران",
]);

// معاملات التحويل للبنود المختلفة
export const conversionFactors = {
  "صبة النظافة": 1,
  "القواعد": 1,
  "صبة اللبشة 2": 1,
  "صبة اللبشة2": 1,
  "الميدا": 1,
  "الأرضية بين الميدات": 1,
  "الارضية بين الميدات": 1,
  "جدار القبو": 1,
  "مسطح الأعمدة": 1000,
  "مسطح الاعمدة": 1000,
  "الأرضي": 1,
  "الارضي": 1,
  "الأول": 1,
  "اول": 1,
  "الثاني": 1,
  "المتكرر": 1,
  "الملحق": 1,
  "أدوار القبو": 1,
  "ادوار القبو": 1,
};

// القيم الافتراضية للمشروع
export const defaultProjectData = {
  name: "",
  description: "",
  concretePrice: "",
  steelPrice: "",
  blockPrice: "",
  factoryRate: "",
  overheadRate: "",
  profitRate: "",
};

// القيم الافتراضية للدفان
export const defaultBackfillData = {
  quantity: "",
  price: "",
};

// القيم الافتراضية للعزل
export const defaultInsulationData = {
  quantity: "",
  price: "",
};