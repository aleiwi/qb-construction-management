
// Helper function to safely divide and handle NaN
export const safeDivide = (numerator, denominator, fallback = 0) => {
  const num = parseFloat(numerator) || 0;
  const denom = parseFloat(denominator) || 1;

  if (denom === 0) return fallback;

  const result = num / denom;
  return isNaN(result) ? fallback : result;
};

// Helper function to safely format numbers with thousand separators
export const formatNumber = (value, decimals = 2) => {
  const num = parseFloat(value) || 0;
  if (isNaN(num)) return (0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// دالة لحساب معامل الحديد حسب نوع البند
export const getSteelRatio = (itemName) => {
  const name = (itemName || "").trim();

  // صبة النظافة دائما 0
  if (name === "صبة النظافة") return 0;

  // القواعد, صبة اللبشة 2, جدار القبو: 150
  if (["القواعد", "صبة اللبشة 2", "جدار القبو"].includes(name)) return 150;

  // ادوار القبو, الارضي, الاول, الثاني, المتكرر, الملحق: 120
  if (
    [
      "أدوار القبو",
      "الأرضي",
      "الأول",
      "الثاني",
      "المتكرر",
      "الملحق",
    ].includes(name)
  )
    return 120;

  // الاسقف, الجدران, السقف: 130
  if (["الأسقف", "الجدران", "السقف"].includes(name)) return 130;

  // الميدا, اللبشة, الطرنشات , المقلوب, اعمدة السور , السور /كرنيش السور, كل المصاعد: 100
  if (
    [
      "الميدا",
      "اللبشة",
      "الطرنشات",
      "المقلوب",
      "أعمدة السور",
      "السور / كرنيش السور",
      "السور /كرنيش السور",
      "كل المصاعد",
    ].includes(name)
  )
    return 100;

  // الارضية بين الميدات: 40
  if (["الأرضية بين الميدات"].includes(name)) return 40;

  // مسطح الاعمدة, الاعمدة: 250
  if (["مسطح الأعمدة", "الأعمدة"].includes(name)) return 250;

  return 100; // القيمة الافتراضية
};

// دالة لحساب كمية البلوك حسب نوع البند
export const calculateBlockQuantity = (itemName, length, thickness) => {
  const name = (itemName || "").trim();

  // Mida special case: (0.4 / Length) * 2
  // Note: interpreting user rule "(0.4/المسطح أو الطول) *2"
  if (name === "الميدا") return length > 0 ? (0.4 / length) * 2 : 0;

  // Zero Block Items
  const zeroBlockItems = new Set([
      "صبة النظافة",
      "القواعد",
      "صبة اللبشة2",
      "صبة اللبشة 2",
      "الارضية بين الميدات",
      "مسطح الاعمدة",
      "مسطح الأعمدة",
      "الاسقف",
      "الأسقف",
      "اللبشة",
      "السقف",
      "الاعمدة",
      "الأعمدة",
      "المقلوب",
      "اعمدة السور",
      "أعمدة السور",
      "كل المصاعد",
  ]);

  if (zeroBlockItems.has(name)) return 0;

  // Basement Wall: Length * Thickness * 12.5
  if (name === "جدار القبو") return length * thickness * 12.5;

  // Basement Floors: Length * 2 * 12.5
  if (["ادوار القبو", "أدوار القبو"].includes(name)) return length * 2 * 12.5;

  // Ground, First: Length * 3 * 12.5
  if (["ارضي", "الأرضي", "اول", "الأول"].includes(name)) return length * 3 * 12.5;

  // Second, Repeated, Annex: Length * 2 * 12.5
  if (["الثاني", "المتكرر", "الملحق"].includes(name)) return length * 2 * 12.5;

  // Walls, Trenches, Fence: Length * Thickness * 12.5
  if ([
      "الجدران", 
      "الطرنشات", 
      "السور / كرنيش السور", 
      "السور /كرنيش السور"
  ].includes(name)) {
      return length * thickness * 12.5; 
  }
  
  return 0; 
};

// دالة لتحديد معامل التحويل حسب نوع البند
export const getConversionFactor = (itemName) => {
  const name = (itemName || "").trim();

  const zeroConversionItems = new Set([
    "صبة النظافة",
    "القواعد",
    "صبة اللبشة 2",
    "الميدا",
    "الأرضية بين الميدات",
    "جدار القبو",
    "مسطح الأعمدة",
    "الجدران",
    "اللبشة",
    "الأعمدة",
    "الطرنشات",
    "أعمدة السور",
  ]);

  return zeroConversionItems.has(name) ? "0" : "1";
};

// دالة لحساب المسطح قبل التحويل
export const getPreArea = (itemName, length, preArea) => {
  const name = (itemName || "").trim();

  const zeroPreAreaItems = new Set([
    "صبة النظافة",
    "القواعد",
    "صبة اللبشة 2",
    "الميدا",
    "الأرضية بين الميدات",
    "جدار القبو",
    "مسطح الأعمدة",
    "الجدران",
    "اللبشة",
    "الأعمدة",
    "الطرنشات",
    "أعمدة السور",
  ]);

  // كل المصاعد الافتراضي 0 ولكن قابل للتغيير
  if (name === "كل المصاعد") return parseFloat(preArea) || 0;

  // باقي البنود = المسطح أو الطول
  if (zeroPreAreaItems.has(name)) return 0;

  return length;
};

// دالة للتحقق من صحة بيانات المشروع
export const validateProjectData = (projectData) => {
    const newErrors = {};

    // Guard against missing projectData
    if (!projectData) {
      newErrors.general = "Project data is required";
      return newErrors;
    }

    // التحقق من اسم المشروع
    if (/^[0-9]+$/.test(projectData.name?.trim())) {
      newErrors.name = "اسم المشروع يجب أن يحتوي على أحرف وليس أرقامًا فقط";
    }

    // التحقق من الأسعار (إلزامي وتكون موجبة)
    const requiredFields = [
        { key: 'concretePrice', label: "سعر الخرسانة" },
        { key: 'steelPrice', label: "سعر الحديد" },
        { key: 'blockPrice', label: "سعر البلوك" },
    ];

    requiredFields.forEach(({ key, label }) => {
        const value = projectData[key];
        if (!value || value.trim() === '' || parseFloat(value) <= 0) {
            newErrors[key] = `${label} يجب أن يكون أكبر من صفر`;
        }
    });

    // المصنعيات والربح يمكن أن تكون 0
    if (projectData.factoryRate.trim() && parseFloat(projectData.factoryRate) < 0) {
        newErrors.factoryRate = "سعر المصنعيات يجب أن يكون رقمًا موجبًا";
    }

    if (projectData.profitRate.trim() && parseFloat(projectData.profitRate) < 0) {
        newErrors.profitRate = "نسبة الربح يجب أن تكون رقمًا موجبًا";
    }

    return newErrors;
};

// حساب الكميات والتكاليف
export const calculateItem = (item, projectData) => {
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.width) || 0;
    const thickness = parseFloat(item.thickness) || 0;
    const conversionFactor = parseFloat(item.conversionFactor) || 1;
    const concretePrice = parseFloat(projectData.concretePrice) || 0;
    const steelPrice = parseFloat(projectData.steelPrice) || 0;
    const blockPrice = parseFloat(projectData.blockPrice) || 0;

    // 1. Calculate original quantities
    const concreteQty =
      item.name === "كل المصاعد" ? length * width : length * width * thickness;
    const steelRatio = getSteelRatio(item.name);
    const steelQty = (concreteQty * steelRatio) / 1000;
    const blockQty = calculateBlockQuantity(item.name, length, thickness);

    // 2. Calculate costs
    const concreteCost = concreteQty * concretePrice;
    const steelCost = steelQty * steelPrice;
    const blockCost = blockQty * blockPrice;
    const totalCost = concreteCost + steelCost + blockCost;

    // 3. Area Logic (Pre & Post Conversion)
    const preAreaNum = getPreArea(item.name, length, item.preArea);

    // Zero Area Items List
    const zeroAreaItems = new Set([
      "صبة النظافة",
      "القواعد",
      "صبة اللبشة 2",
      "الميدا",
      "الأرضية بين الميدات",
      "جدار القبو",
      "مسطح الاعمدة",
      "مسطح الأعمدة",
      "الجدران",
      "اللبشة",
      "الاعمدة",
      "الأعمدة",
      "الطرنشات",
      "اعمدة السور",
      "أعمدة السور",
    ]);

    // Conversion Factor
    let factor = conversionFactor;
    if (zeroAreaItems.has(item.name)) factor = 0;

    // Converted Area
    const convertedArea = preAreaNum * factor;

    return {
      ...item,
      preArea: preAreaNum.toFixed(2),
      area: convertedArea.toFixed(2), // This is "المسطح بعد التحويل"
      volume: concreteQty.toFixed(2),
      concreteQty: concreteQty.toFixed(2),
      steelQty: steelQty.toFixed(3),
      blockQty: blockQty.toFixed(2),
      totalCost: totalCost.toFixed(2),
    };
  };

export const calculateTotals = (items, projectData, additionalData) => {
    // 1. Calculate base totals from items
    const totals = items.reduce(
        (acc, item) => {
          acc.concreteQty += parseFloat(item.concreteQty) || 0;
          acc.steelQty += parseFloat(item.steelQty) || 0;
          acc.blockQty += parseFloat(item.blockQty) || 0;
          acc.totalCost += parseFloat(item.totalCost) || 0;
          acc.totalArea += parseFloat(item.area) || 0; // المسطح الإجمالي هو مجموع قيم "المسطح بعد التحويل"
          return acc;
        },
        {
          concreteQty: 0,
          steelQty: 0,
          blockQty: 0,
          totalCost: 0,
          totalArea: 0,
        }
      );

    // 4. Contractor Cost = Total Area * Factory Rate
    const factoryRate = parseFloat(projectData.factoryRate) || 0;
    const contractorWorkCost = totals.totalArea * factoryRate; // "المسطح الإجمالي × سعر المصنعيات"

    // 5. Additional Costs
    // Insulation Cost = Qty * Price
    const insulationQuantity = parseFloat(additionalData.insulationQuantity) || 0;
    const insulationPrice = parseFloat(additionalData.insulationPrice) || 0;
    const insulationCost = insulationQuantity * insulationPrice;

    // Backfill Cost = Qty * Price
    const backfillQuantity = parseFloat(additionalData.backfillQuantity) || 0;
    const backfillPrice = parseFloat(additionalData.backfillPrice) || 0;
    const backfillCost = backfillQuantity * backfillPrice;

    // Overhead
    const overhead = parseFloat(projectData.overheadRate) || 0;

    const totalAdditionalCosts = contractorWorkCost + overhead + backfillCost + insulationCost;
    
    // Calculate total cost before profit (all costs combined)
    const totalCostBeforeProfit = totals.totalCost + totalAdditionalCosts;
    
    // 6. Profit
    // Calculate profit rate
    const profitRate = parseFloat(projectData.profitRate) || 0;
    
    // Calculate Final Price first based on profit rate
    // Final Price = Total cost * (1 + profit rate / 100)
    const finalPrice = totalCostBeforeProfit * (1 + profitRate / 100);
    
    // Calculate sum of items (مجموع البنود)
    // مجموع البنود = مجموع (إجمالي البند) لكل بند
    // إجمالي البند = (finalPrice / totalArea) * item.area
    // مجموع البنود = (finalPrice / totalArea) * sum(item.area) = finalPrice
    const totalItemsSum = finalPrice; // This equals finalPrice because sum of all item areas = totalArea
    
    // Calculate profit according to new formula:
    // مربح المشروع = مجموع البنود - إجمالي التكاليف (بدون ربح)
    const profit = totalItemsSum - totalCostBeforeProfit;
    
    // Cost Per Meter (Without Profit)
    const costWithoutProfit = totals.totalCost + totalAdditionalCosts;
    const costPerSquareMeter =
      totals.totalArea > 0 ? costWithoutProfit / totals.totalArea : 0;

      return {
        concreteQty: totals.concreteQty.toFixed(2),
        steelQty: totals.steelQty.toFixed(3),
        blockQty: totals.blockQty.toFixed(2),
        totalCost: totals.totalCost.toFixed(2),
        totalArea: totals.totalArea.toFixed(2),
        contractorWorkCost: contractorWorkCost.toFixed(2),
        overhead: overhead.toFixed(2),
        backfillCost: backfillCost.toFixed(2),
        insulationCost: insulationCost.toFixed(2),
        profit: profit.toFixed(2),
        totalAdditionalCosts: totalAdditionalCosts.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
        costPerSquareMeter: costPerSquareMeter.toFixed(2),
        factoryRate: factoryRate.toFixed(2),
        backfillQuantity: backfillQuantity.toFixed(2),
        backfillPrice: backfillPrice.toFixed(2),
        insulationQuantity: insulationQuantity.toFixed(2),
        insulationPrice: insulationPrice.toFixed(2),
      };
};

