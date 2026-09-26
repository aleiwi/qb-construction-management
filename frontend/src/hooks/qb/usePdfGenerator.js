import { useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
import ArabicReshaper from "arabic-reshaper";
import { amiriFont } from "../../assets/qb/AmiriFont.js";

export const usePdfGenerator = () => {
  const generatePdf = useCallback(async (projectData, additionalData, items, results) => {
    if (!results) {
      toast.error("يرجى حساب التكاليف أولاً");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape", // Use landscape for more table space
      unit: "mm",
      format: "a4",
    });

    doc.addFileToVFS("Amiri-Regular.ttf", amiriFont);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
    doc.setFont("Amiri");

    const processArabic = (text) => {
      if (typeof text !== "string" || text.trim() === "") return " ";
      return ArabicReshaper.convertArabic(text.toString());
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // --- توحيد أنماط التنسيق ---
    const styles = {
      h1: { size: 22, style: "bold", color: [44, 62, 80] },
      h2: { size: 16, style: "bold", color: [44, 62, 80] },
      h3: { size: 14, style: "normal", color: [52, 73, 94] },
      body: { size: 10, style: "normal", color: [52, 73, 94] },
      spacing: { section: 15, header: 8, paragraph: 5 },
      colors: { primary: [44, 62, 80], secondary: [52, 73, 94], accent: [26, 188, 156] },
      valueUnitGap: 2,
    };


    // === 1. Header ===
    doc.setFontSize(22);
    doc.setFont("Amiri", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(processArabic("تقرير تكاليف المشروع"), pageWidth / 2, y, {
      align: "center",
    });
    y += styles.spacing.header;
    doc.setFontSize(14);
    doc.setTextColor(52, 73, 94);
    doc.text(
      processArabic(projectData.name || "اسم المشروع"),
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += styles.spacing.header + 2;
    doc.setDrawColor(224, 224, 224);
    doc.line(margin, y, pageWidth - margin, y);
    y += styles.spacing.section;

    // === NEW: Project Details Section ===
    const projectDetails = [
      [
        processArabic(additionalData.projectLocation || "-"),
        processArabic("الموقع"),
        processArabic(additionalData.projectType || "-"),
        processArabic("النوع"),
      ],
      [
        processArabic(additionalData.startDate || "-"),
        processArabic("تاريخ البدء"),
        processArabic(additionalData.status || "-"),
        processArabic("الحالة"),
      ],
      [
          processArabic(additionalData.deliveryDate || "-"),
          processArabic("تاريخ التسليم"),
          "",
          ""
      ]
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: projectDetails,
      theme: "plain",
      styles: { font: "Amiri", halign: "right", fontSize: 11, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", halign: "right", cellWidth: 40 }, // Value 2
        1: { fontStyle: "normal", halign: "right", cellWidth: 30, textColor: [100, 100, 100] }, // Label 2
        2: { fontStyle: "bold", halign: "right", cellWidth: 40 }, // Value 1
        3: { fontStyle: "normal", halign: "right", cellWidth: 30, textColor: [100, 100, 100] }, // Label 1
      },
      didParseCell: (data) => {
          // Remove empty cells border/padding if any
      }
    });
    
    y = doc.lastAutoTable.finalY + styles.spacing.section;

    // === NEW: Project Settings Summary ===
    doc.setFontSize(16);
    doc.setFont("Amiri", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(processArabic("⚙️ معايير التسعير"), pageWidth - margin, y, {
      align: "right",
    });
    y += styles.spacing.header;

    const settingsData = [
      [
        {
          value: Number(projectData.concretePrice || 0).toLocaleString(),
          unit: "ريال/م³",
        },
        processArabic("سعر الخرسانة"),
      ],
      [
        {
          value: Number(projectData.steelPrice || 0).toLocaleString(),
          unit: "ريال/طن",
        },
        processArabic("سعر الحديد"),
      ],
      [
        {
          value: Number(projectData.blockPrice || 0).toLocaleString(),
          unit: "ريال/قطعة",
        },
        processArabic("سعر البلوك"),
      ],
      [
        {
          value: Number(projectData.factoryRate || 0).toLocaleString(),
          unit: "ريال/م²",
        },
        processArabic("سعر المصنعيات"),
      ],
      [
        {
          value: Number(projectData.overheadRate || 0).toLocaleString(),
          unit: "ريال",
        },
        processArabic("المصاريف الإدارية"),
      ],
      [
        {
          value: Number(projectData.profitRate || 0).toLocaleString(),
          unit: "%",
        },
        processArabic("نسبة الربح"),
      ],
      [
        {
          value: Number(additionalData.backfillPrice || 0).toLocaleString(),
          unit: "ريال/م³",
        },
        processArabic("سعر الدفان"),
      ],
      [
        {
          value: Number(additionalData.insulationPrice || 0).toLocaleString(),
          unit: "ريال/م²",
        },
        processArabic("سعر العزل"),
      ],
    ];

    autoTable(doc, {
      startY: y,
      head: [[processArabic("القيمة"), processArabic("الإعداد")]],
      body: settingsData,
      theme: "grid",
      headStyles: { fillColor: [52, 73, 94] },
      styles: { font: "Amiri", halign: "right", fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold" } },
      // الحل النهائي لمشكلة عرض الأرقام والوحدات
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const cellData = data.cell.raw;
          if (
            typeof cellData === "object" &&
            cellData.value !== undefined &&
            cellData.unit !== undefined
          ) {
            // مسح المحتوى الأصلي الذي رسمته المكتبة
            doc.setFillColor(data.cell.styles.fillColor || 255);
            doc.rect(
              data.cell.x,
              data.cell.y,
              data.cell.width,
              data.cell.height,
              "F"
            );

            const valueStr = cellData.value.toString();
            const unitStr = processArabic(cellData.unit);
            const yPos = data.cell.y + data.cell.height / 1.5;
            const rightPadding = 4;
            const startX = data.cell.x + data.cell.width - rightPadding;

            doc.setFont("Amiri", "bold");
            doc.setTextColor(44, 62, 80);
            doc.text(valueStr, startX, yPos, { align: "right" });
            doc.setFont("Amiri", "normal");
            doc.text(
              unitStr,
              startX - doc.getTextWidth(valueStr) - styles.valueUnitGap,
              yPos,
              { align: "right" }
            );

            // إعادة رسم حدود الخلية لضمان وضوح الخطوط الفاصلة
            doc.setDrawColor(224, 224, 224); // لون الخطوط (نفس لون خطوط الجدول)
            doc.setLineWidth(0.1);
            doc.rect(
              data.cell.x,
              data.cell.y,
              data.cell.width,
              data.cell.height
            );
          }
        }
      },
    });

    y = doc.lastAutoTable.finalY + styles.spacing.section;

    // === 2. Project Items Table (Detailed) ===
    doc.setFontSize(16);
    doc.setFont("Amiri", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(processArabic("📋 تفاصيل بنود المشروع"), pageWidth - margin, y, {
      align: "right",
    });
    y += styles.spacing.header;

    // More detailed columns, similar to the UI
    const itemColumns = [
      "(إجمالي البند)ريال",
      "(المسطح بعد التحويل)م²",
      "معامل التحويل",
      "(المسطح قبل التحويل)م²",
      "(إجمالي تكلفة المواد)ريال",
      "(كمية البلوك)قطعة",
      "(كمية الحديد)طن",
      "(كمية الخرسانة)م³",
      "(السماكة)م",
      "(العرض)م",
      "(الطول)م",
      "البند",
    ].map((c) => processArabic(c));

    const itemRows = items.map((item) => [
      // اجمالي البند (based on final cost per meter)
      processArabic(
        `${
          results.totalArea > 0
            ? (
                (Number(results.finalPrice || 0) / Number(results.totalArea)) *
                Number(item.area || 0)
              ).toLocaleString(undefined, { minimumFractionDigits: 2 })
            : "0.00"
        }`
      ),
      processArabic(`${Number(item.area).toLocaleString()}`),
      processArabic(Number(item.conversionFactor).toLocaleString()),
      processArabic(`${Number(item.preArea).toLocaleString()}`),
      processArabic(`${Number(item.totalCost).toLocaleString()}`),
      processArabic(`${Number(item.blockQty).toLocaleString()}`),
      processArabic(`${Number(item.steelQty).toLocaleString()}`),
      processArabic(`${Number(item.concreteQty).toLocaleString()}`),
      processArabic(Number(item.thickness).toLocaleString()),
      processArabic(Number(item.width).toLocaleString()),
      processArabic(Number(item.length).toLocaleString()),
      processArabic(item.name),
    ]);

    autoTable(doc, {
      startY: y,
      head: [itemColumns],
      body: itemRows,
      theme: "grid", // Grid theme is better for complex tables
      styles: {
        font: "Amiri",
        halign: "right",
        fontSize: 8, // Smaller font for more columns
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [52, 73, 94],
      },
      columnStyles: {
        11: { fontStyle: "bold" }, // Make item name bold
        0: { fontStyle: "bold", textColor: [26, 188, 156] }, // Highlight final item price
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + styles.spacing.section;

    // Check for page break before next section
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    // حساب التكلفة الإجمالية النهائية للمشروع
    // finalPrice هو السعر النهائي الذي يشمل كل شيء (مواد, مصنعيات, إضافات, ربح)
    const totalProjectFinalPrice = parseFloat(results.finalPrice) || 0;

    // تكلفة المواد الخام فقط
    const totalRawMaterialsCost = parseFloat(results.totalCost) || 0;

    // حساب مجموع البنود (إجمالي البند = سعر العرض شامل الربح × مساحة البند)
    const finalPriceVal = parseFloat(results.finalPrice) || 0;
    const totalAreaVal = parseFloat(results.totalArea) || 1;
    const pricePerMeterWithProfit = totalAreaVal > 0 ? finalPriceVal / totalAreaVal : 0;

    // Calculate using the *calculated* price per meter with profit
    const totalItemsFinalCost = items.reduce((sum, item) => {
      return sum + pricePerMeterWithProfit * (parseFloat(item.area) || 0);
    }, 0);

    // This was the problematic block dealing with missing offerPrice
    // We will use totalItemsFinalCost as the source of truth for the report if offerPrice is missing.
    const userOfferPrice = parseFloat(projectData.offerPrice);
    const offerPrice = isNaN(userOfferPrice) ? 0 : userOfferPrice;
    
    const totalItemsCost = offerPrice > 0 
      ? items.reduce((sum, item) => sum + offerPrice * (parseFloat(item.area) || 0), 0)
      : totalItemsFinalCost;

    const quantitiesMetrics = [
      {
        label: "الخرسانة",
        value: `${Number(results.concreteQty).toLocaleString()}`,
        unit: "م³",
        icon: "💎",
        color: [52, 152, 219],
      }, // Peter River
      {
        label: "الحديد",
        value: `${Number(results.steelQty).toLocaleString()}`,
        unit: "طن",
        icon: "🔥",
        color: [46, 204, 113],
      }, // Emerald
      {
        label: "البلوك",
        value: `${Number(results.blockQty).toLocaleString()}`,
        unit: "قطعة",
        icon: "🧱",
        color: [241, 196, 15],
      }, // Sun Flower
      {
        label: "المسطح الإجمالي",
        value: `${Number(results.totalArea).toLocaleString()}`,
        unit: "م²",
        icon: "⭐",
        color: [155, 89, 182],
      },
    ];

    // === NEW: Total Quantities Section ===
    doc.setFontSize(16);
    doc.setFont("Amiri", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(processArabic("📊 إجمالي الكميات"), pageWidth - margin, y, {
      align: "right",
    });
    y += styles.spacing.header + 2;

    const quantityCardWidth = (pageWidth - margin * 2 - 15) / 4; // 4 cards per row
    const quantityCardHeight = 30;

    for (let i = 0; i < quantitiesMetrics.length; i++) {
      // Loop for quantities
      const metric = quantitiesMetrics[i];
      const rowIndex = Math.floor(i / 4); // 4 cards per row
      const colIndex = i % 4;

      const x = margin + colIndex * (quantityCardWidth + 5);
      const currentY = y + rowIndex * (quantityCardHeight + 5);

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(
        x,
        currentY,
        quantityCardWidth,
        quantityCardHeight,
        3,
        3,
        "F"
      );

      doc.setFontSize(18);
      doc.text(metric.icon, x + quantityCardWidth - 10, currentY + 11, {
        align: "right",
      });

      doc.setFontSize(9);
      doc.setTextColor(123, 125, 125);
      doc.setFont("Amiri", "normal");
      doc.text(
        processArabic(metric.label),
        x + quantityCardWidth - 10,
        currentY + 17,
        {
          align: "right",
        }
      );

      const valueStr = metric.value.toString();
      const unitStr = processArabic(metric.unit);
      const startX = x + quantityCardWidth - 10;
      const yPos = currentY + 24;

      doc.setFontSize(11);
      doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.setFont("Amiri", "bold");
      // رسم القيمة أولاً (بدون معالجة عربية)
      doc.text(valueStr, startX, yPos, {
        align: "right",
      });
      // رسم الوحدة على يسار القيمة (مع معالجة عربية)
      doc.setFont("Amiri", "normal");
      doc.text(unitStr, startX - doc.getTextWidth(valueStr) - styles.valueUnitGap, yPos, {
        align: "right",
      }
      );
    }
    y += (quantityCardHeight + 5) * Math.ceil(quantitiesMetrics.length / 4); // Update y based on 4 cards per row

    // Check for page break
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    // إضافة مسافة فاصلة قبل القسم التالي
    y += styles.spacing.section;

    // === 3. MERGED: Costs Breakdown & Final Results ===
    doc.setFontSize(16);
    doc.setFont("Amiri", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(
      processArabic("ملخص التكاليف والنتائج النهائية"),
      pageWidth - margin,
      y,
      {
        align: "right",
      }
    );
    y += styles.spacing.header + 2;

    const allMetrics = [
      // --- الصف الأول حسب طلب المستخدم ---
      {
        label: "تكلفة الدفان",
        value: `${Number(results.backfillCost).toLocaleString()}`,
        icon: "🏔️",
        color: [230, 126, 34], // Carrot
        subValue: `(كمية: ${Number(
          additionalData.backfillQuantity || 0
        ).toLocaleString()} م³)`,
      },
      {
        label: "تكلفة العزل",
        value: `${Number(results.insulationCost).toLocaleString()}`,
        icon: "🛡️",
        color: [241, 196, 15], // Sun Flower
        subValue: `(كمية: ${Number(
          additionalData.insulationQuantity || 0
        ).toLocaleString()} م²)`,
      },
      {
        label: "المصاريف الإدارية",
        value: `${Number(results.overhead).toLocaleString()}`,
        icon: "💼",
        color: [155, 89, 182], // Amethyst
      },
      {
        label: "تكلفة المصنعيات",
        value: `${Number(results.contractorWorkCost).toLocaleString()}`,
        icon: "🔨",
        color: [52, 152, 219], // Peter River
      },

      // --- الصف الثاني بترتيب منطقي ---
      {
        label: "تكلفة المواد",
        value: `${Number(results.totalCost).toLocaleString()}`,
        icon: "📦",
        color: [46, 204, 113], // Emerald
      },
      {
        label: "مجموع البنود",
        value: `${totalItemsCost.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: "📊",
        color: [63, 81, 181], // Indigo
      }, // --- NEW: الصف الجديد ---
      {
        label: "إجمالي التكاليف (بدون ربح)",
        value: `${(
          parseFloat(results.totalCost || 0) +
          parseFloat(results.totalAdditionalCosts || 0)
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: "💰",
        color: [231, 76, 60], // Alizarin
      },
      {
        label: "مربح المشروع",
        // مربح المشروع = مجموع البنود - إجمالي التكاليف (بدون ربح)
        value: `${(
          totalItemsCost -
          (parseFloat(results.totalCost || 0) +
            parseFloat(results.totalAdditionalCosts || 0))
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: "📈",
        color: [39, 174, 96], // Nephritis
      },  
    ];

    const costCardWidth = (pageWidth - margin * 2 - 15) / 4; // 4 cards per row
    const costCardHeight = 35; // Slightly taller to accommodate sub-value

    for (let i = 0; i < allMetrics.length; i++) {
      const metric = allMetrics[i];
      const rowIndex = Math.floor(i / 4);
      const colIndex = i % 4;

      const x = margin + colIndex * (costCardWidth + 5);
      const currentY = y + rowIndex * (costCardHeight + 5);

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(x, currentY, costCardWidth, costCardHeight, 3, 3, "F");

      doc.setFontSize(18);
      doc.text(metric.icon, x + costCardWidth - 10, currentY + 11, {
        align: "right",
      });

      doc.setFontSize(9);
      doc.setTextColor(123, 125, 125);
      doc.setFont("Amiri", "normal");
      doc.text(
        processArabic(metric.label),
        x + costCardWidth - 10,
        currentY + 17,
        {
          align: "right",
        }
      );

      const valueStrCost = metric.value.toString();
      const unitStrCost = processArabic("ريال"); // الوحدة دائما ريال هنا
      const startXCost = x + costCardWidth - 10;
      const yPosCost = currentY + 24;

      doc.setFontSize(11);
      doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.setFont("Amiri", "bold");
      // رسم القيمة أولاً (بدون معالجة عربية)
      doc.text(valueStrCost, startXCost, yPosCost, {
        align: "right",
      });
      // رسم الوحدة على يسار القيمة (مع معالجة عربية)
      doc.setFont("Amiri", "normal");
      doc.text(unitStrCost, startXCost - doc.getTextWidth(valueStrCost) - styles.valueUnitGap, yPosCost, {
        align: "right",
      }
      );

      if (metric.subValue) {
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.setFont("Amiri", "normal");
        doc.text(
          processArabic(metric.subValue),
          x + costCardWidth - 10,
          currentY + 30,
          {
            align: "right",
          }
        );
      }
    }
    y += (costCardHeight + 5) * Math.ceil(allMetrics.length / 4); // Move y down by the number of rows

    // === 4. Footer with Page Number ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 10;
      doc.setDrawColor(224, 224, 224);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      doc.text(processArabic(`صفحة ${i} من ${pageCount}`), margin, footerY, {
        align: "left",
      });
    }

    // === 5. Save the PDF ===
    const fileName = projectData.name
      ? `report_${projectData.name.replace(/\s/g, "_")}.pdf`
      : "report.pdf";
    doc.save(fileName);

    toast.success("تم إنشاء تقرير PDF الاحترافي بنجاح!");
  }, []);

  return { generatePdf };
};
