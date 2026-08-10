// defaultCompletionData.js
// الهيكل والقيمة النموذجية للبيانات النموذجية المستخرجة من التقرير المعتمد
// 58 بنداً هندسياً: 29 بنداً للعظم + 29 بنداً للتشطيبات
// 8 قطاعات فرعية للتشطيبات + 9 مراحل للدفعات المالية (Landscape Executive Report)

export const defaultCompletionData = {
  // === أ. البيانات التعريفية والمؤشرات المالية ===
  companyName: 'مسقا الأولى للتطوير العقاري',
  projectName: 'مشروع مسقا 32',
  projectType: 'شقق سكنية',
  projectNumber: 'M32',
  location: 'حي السعادة — الرياض',
  unitsCount: 247,
  reportPeriod: 'يونيو 2026 (شهر 6)',
  docRef: 'PR-MSGA-32-2026-06',
  contractDurationMonths: 18,
  actualDurationMonths: 15,
  contractorBudget: 49452000,
  developerBudget: 7417500,
  totalBudget: 56869500,

  // === ب. قطاعات التشطيبات الفرعية (8 قطاعات) ===
  finishingSectors: [
    { id: 's1', name: 'التأسيسات الكهروميكانيكية', progress: 51 },
    { id: 's2', name: 'اللياسة والمعجون', progress: 37 },
    { id: 's3', name: 'الجبس والجبس بورد', progress: 61 },
    { id: 's4', name: 'الدهانات', progress: 42 },
    { id: 's5', name: 'الأرضيات والرخام والبلاط', progress: 0 },
    { id: 's6', name: 'الأبواب والألمنيوم', progress: 17 },
    { id: 's7', name: 'الأعمال المعدنية', progress: 53 },
    { id: 's8', name: 'العزل', progress: 0 },
  ],

  // === ج. بنود أعمال العظم — 29 بنداً مكتملة بنسبة 100% ===
  structureItems: [
    { id: 'st1',  name: 'السور المؤقت',                               progress: 100 },
    { id: 'st2',  name: 'اعمال الحفر للتأسيس',                        progress: 100 },
    { id: 'st3',  name: 'اعمال الخزانات والبيارات',                   progress: 100 },
    { id: 'st4',  name: 'صبة النظافة',                                progress: 100 },
    { id: 'st5',  name: 'القواعد (اللبشة)',                           progress: 100 },
    { id: 'st6',  name: 'الرقاب والشدادات',                           progress: 100 },
    { id: 'st7',  name: 'عزل القواعد والرقاب',                        progress: 100 },
    { id: 'st8',  name: 'الدفان حول القواعد',                         progress: 100 },
    { id: 'st9',  name: 'اعمال الميدات',                              progress: 100 },
    { id: 'st10', name: 'عزل الميدات',                                progress: 100 },
    { id: 'st11', name: 'الدفان بين الميدات',                         progress: 100 },
    { id: 'st12', name: 'تمديدات المجاري',                            progress: 100 },
    { id: 'st13', name: 'تمديدات الدفاع المدني',                       progress: 100 },
    { id: 'st14', name: 'الدكة الأرضية',                               progress: 100 },
    { id: 'st15', name: 'أعمدة الدور الأرضي',                          progress: 100 },
    { id: 'st16', name: 'سقف الدور الأرضي',                           progress: 100 },
    { id: 'st17', name: 'مباني الدور الأرضي',                          progress: 100 },
    { id: 'st18', name: 'أعمدة الدور الأول',                           progress: 100 },
    { id: 'st19', name: 'سقف الدور الأول',                            progress: 100 },
    { id: 'st20', name: 'مباني الدور الأول',                           progress: 100 },
    { id: 'st21', name: 'أعمدة الدور الثاني',                          progress: 100 },
    { id: 'st22', name: 'سقف الدور الثاني',                            progress: 100 },
    { id: 'st23', name: 'مباني الدور الثاني',                          progress: 100 },
    { id: 'st24', name: 'أعمدة الملحق',                               progress: 100 },
    { id: 'st25', name: 'سقف الملحق',                                 progress: 100 },
    { id: 'st26', name: 'مباني الملحق',                                progress: 100 },
    { id: 'st27', name: 'اعمال الستر والكرانيش',                       progress: 100 },
    { id: 'st28', name: 'بلاطات الخزانات العلوية',                     progress: 100 },
    { id: 'st29', name: 'اعمال سور المشروع',                           progress: 100 },
  ],

  // === د. بنود أعمال التشطيبات (29 بنداً) ===
  finishingItems: [
    { id: 'f1',  name: 'تأسيس الكهرباء',                              progress: 90, sectorId: 's1' },
    { id: 'f2',  name: 'تأسيس السباكة',                               progress: 90, sectorId: 's1' },
    { id: 'f3',  name: 'اعمال الطرطشة الداخلية',                      progress: 90, sectorId: 's2' },
    { id: 'f4',  name: 'تأسيس الدفاع المدني',                          progress: 88, sectorId: 's1' },
    { id: 'f5',  name: 'اختبار التكييف',                              progress: 90, sectorId: 's1' },
    { id: 'f6',  name: 'الأعمال المعدنية',                            progress: 53, sectorId: 's7' },
    { id: 'f7',  name: 'بلاط جدران الحمامات',                         progress: 0,  sectorId: 's5' },
    { id: 'f8',  name: 'اللياسة الداخلية',                            progress: 44, sectorId: 's2' },
    { id: 'f9',  name: 'الجبس',                                       progress: 62, sectorId: 's3' },
    { id: 'f10', name: 'اعمال تأسيس المعجون',                         progress: 50, sectorId: 's2' },
    { id: 'f11', name: 'تركيب أبواب الشقق',                           progress: 0,  sectorId: 's6' },
    { id: 'f12', name: 'اكسسوارات الأبواب',                           progress: 0,  sectorId: 's6' },
    { id: 'f13', name: 'تمديدات التكييفات',                          progress: 0,  sectorId: 's1' },
    { id: 'f14', name: 'اعمال الجبس بورد وجبس الحمامات',               progress: 60, sectorId: 's3' },
    { id: 'f15', name: 'عزل الحمامات والمطابخ',                        progress: 0,  sectorId: 's8' },
    { id: 'f16', name: 'بلاط الأرضيات والحمامات',                      progress: 0,  sectorId: 's5' },
    { id: 'f17', name: 'رخام الممرات',                                progress: 0,  sectorId: 's5' },
    { id: 'f18', name: 'ابواب الشقق (حديد)',                          progress: 0,  sectorId: 's6' },
    { id: 'f19', name: 'ابواب الغرف والحمامات (WPC)',                 progress: 0,  sectorId: 's6' },
    { id: 'f20', name: 'الدهانات (أوجه الدهان)',                       progress: 42, sectorId: 's4' },
    { id: 'f21', name: 'اللياسة الخارجية',                            progress: 0,  sectorId: 's2' },
    { id: 'f22', name: 'الرشة الخارجية',                              progress: 0,  sectorId: 's2' },
    { id: 'f23', name: 'الألمنيوم',                                    progress: 0,  sectorId: 's6' },
    { id: 'f24', name: 'حماية الشبابيك',                               progress: 100,sectorId: 's6' },
    { id: 'f25', name: 'اكسسوارات السباكة',                            progress: 0,  sectorId: 's1' },
    { id: 'f26', name: 'اكسسوارات الكهرباء',                           progress: 0,  sectorId: 's1' },
    { id: 'f27', name: 'بلاط الأسطح',                                  progress: 0,  sectorId: 's5' },
    { id: 'f28', name: 'البلاط ودورات الانترلوك',                     progress: 0,  sectorId: 's5' },
    { id: 'f29', name: 'الأسفلت', progress: 0, sectorId: 's5' },
  ],

  // === ه. جدول الدفعات المالية (9 مراحل) ===
  paymentsSchedule: [
    { id: 'p1', name: 'الدفعات المقدمة', ratio: 15, contractorVal: 7417500, devVal: 1112625, totalVal: 8530125, paid: true,  dueDate: '7/2025' },
    { id: 'p2', name: 'البيارة والخزانات والأساسات', ratio: 15, contractorVal: 7417500, devVal: 1112625, totalVal: 8530125, paid: true,  dueDate: '1/2026' },
    { id: 'p3', name: 'الكمرات الأرضية', ratio: 10, contractorVal: 4945000, devVal: 741750, totalVal: 5686750, paid: true,  dueDate: '3/2026' },
    { id: 'p4', name: 'صب بلاطة الدور الأرضي', ratio: 15, contractorVal: 7417500, devVal: 1112625, totalVal: 8530125, paid: true,  dueDate: '3/2026' },
    { id: 'p5', name: 'صب بلاطة الدور الأول', ratio: 15, contractorVal: 7417500, devVal: 1112625, totalVal: 8530125, paid: true,  dueDate: '4/2026' },
    { id: 'p6', name: 'صب بلاطة الدور الثاني', ratio: 10, contractorVal: 4945000, devVal: 741750, totalVal: 5686750, paid: false, dueDate: '7/2026' },
    { id: 'p7', name: 'صب بلاطة الدور الثالث', ratio: 10, contractorVal: 4945000, devVal: 741750, totalVal: 5686750, paid: false, dueDate: '9/2026' },
    { id: 'p8', name: 'بعد التمديدات الكهربائية والبلاط واللياسة الخارجية', ratio: 5, contractorVal: 2473500, devVal: 370875, totalVal: 2844375, paid: false, dueDate: '11/2026' },
    { id: 'p9', name: 'الدفعة النهائية بعد التسليم', ratio: 5, contractorVal: 2473500, devVal: 370875, totalVal: 2844375, paid: false, dueDate: '12/2026' },
  ],

  // === و. المعرض المصور (يبدأ فارغاً — الصور تُضاف من صفحة التحرير فقط، لا تظهر أي صورة تلقائياً) ===
  photoGallery: [],
};

// ====== دوال الحساب التلقائي للنسب ======

// قالب تقرير جديد: يُستخدم عند إنشاء تقرير من الصفر أو مشروع جديد
// يبدأ ببيانات التقرير المرجعي المعتمد (مسقا 32 — cp.pdf) كاملة القيم والنسب
// بدلاً من القالب الفارغ — بحيث تظهر البيانات فوراً ويتمكن المستخدم من تعديلها
export const createEmptyCompletionData = () => ({
  ...defaultCompletionData,
  finishingSectors: defaultCompletionData.finishingSectors.map((s) => ({ ...s })),
  structureItems: defaultCompletionData.structureItems.map((it) => ({ ...it })),
  finishingItems: defaultCompletionData.finishingItems.map((it) => ({ ...it })),
  paymentsSchedule: defaultCompletionData.paymentsSchedule.map((p) => ({ ...p })),
  photoGallery: [],
});

export const calcStructureProgress = (items = []) => {
  if (!items.length) return 0;
  const sum = items.reduce((s, it) => s + (parseFloat(it.progress) || 0), 0);
  return parseFloat((sum / items.length).toFixed(1));
};

export const calcFinishingProgress = (items = []) => {
  if (!items.length) return 0;
  const sum = items.reduce((s, it) => s + (parseFloat(it.progress) || 0), 0);
  return parseFloat((sum / items.length).toFixed(1));
};

export const calcOverallProgress = (structureItems = [], finishingItems = []) => {
  const st = calcStructureProgress(structureItems);
  const fn = calcFinishingProgress(finishingItems);
  return parseFloat((st * 0.5 + fn * 0.5).toFixed(1));
};

export const calcSectorProgress = (sectorId, finishingItems = []) => {
  const items = finishingItems.filter((it) => it.sectorId === sectorId);
  if (!items.length) return 0;
  const sum = items.reduce((s, it) => s + (parseFloat(it.progress) || 0), 0);
  return parseFloat((sum / items.length).toFixed(1));
};

export const formatCurrency = (val) =>
  `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val || 0)} ر.س`;
