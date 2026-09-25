import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ArabicReshaper from "arabic-reshaper";
import { amiriFont } from "../assets/AmiriFont.js";

// Lazy load ExcelJS to avoid bundle size issues if not used
// const ExcelJS = await import('exceljs'); 

const processArabic = (text) => {
  if (!text) return "";
  const str = text.toString();
  if (str.trim() === "") return " ";

  // 1. Reshape the whole string to ensure correct Arabic letter forms
  const reshaped = ArabicReshaper.convertArabic(str);

  // 2. Split into words
  return reshaped.split(" ").map(word => {
    // Check if word contains Arabic characters
    if (/[\u0600-\u06FF]/.test(word)) {
      // Reverse Arabic word characters for LTR rendering
      return word.split("").reverse().join("");
    }
    // Keep numbers/English as is
    return word;
  }).reverse().join(" "); // 3. Reverse word order for RTL sentence structure
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString('en-GB'); // Use English dates for consistency
};

export const generateExecutionPdf = (projects, chartImage) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Setup Arabic Font
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFont);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    // Title
    doc.setFontSize(18);
    doc.text(processArabic("تقرير متابعة تنفيذ المشاريع"), doc.internal.pageSize.width / 2, 20, { align: "center" });
    
    // Date
    doc.setFontSize(10);
    // Use simple English text for date to avoid shaping issues with numbers
    const dateStr = new Date().toLocaleDateString('en-GB');
    doc.text(`${processArabic("تاريخ التقرير")}: ${dateStr}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

    let yPos = 35;

    // Add Chart Image if provided
    if (chartImage) {
       const imgProps = doc.getImageProperties(chartImage);
       const pdfWidth = doc.internal.pageSize.getWidth();
       const imgWidth = pdfWidth - 40; // 20mm margin each side
       const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
       
       // Center the image
       doc.addImage(chartImage, 'PNG', 20, yPos, imgWidth, imgHeight);
       yPos += imgHeight + 10; // Move Y down
    }

    // Table Data
    const columns = [
        "الإنجاز الكلي", 
        "نسبة التشطيب",
        "نسبة العظم",
        "تاريخ التسليم",
        "اسم المشروع"
    ].map(processArabic);

    const rows = projects.map(p => [
        `${p.completion_rate}%`,
        `${p.finishing_rate || 0}%`,
        `${p.bone_rate || 0}%`,
        formatDate(p.delivery_date),
        processArabic(p.name)
    ]);

    // Draw Table
    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: yPos,
        theme: "grid",
        styles: { font: "Amiri", halign: "right", fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save(`execution_report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateExecutionCsv = (projects) => {
    // BOM for Excel to read Arabic correctly
    const BOM = "\uFEFF"; 
    const headers = ["اسم المشروع", "تاريخ البدء", "تاريخ التسليم", "نسبة العظم", "نسبة التشطيب", "الإنجاز الكلي"];
    
    const rows = projects.map(p => [
        `"${p.name}"`,
        `"${formatDate(p.start_date)}"`,
        `"${formatDate(p.delivery_date)}"`,
        `"${p.bone_rate || 0}%"`,
        `"${p.finishing_rate || 0}%"`,
        `"${p.completion_rate}%"`
    ]);

    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `execution_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const generateExecutionExcel = async (projects, chartImage) => {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير التنفيذ', {
      views: [{ rightToLeft: true, showGridLines: false }] // Clean look
    });

    // --- Configuration for "Centering" on Sheet ---
    // We will start rendering at Row 5, Column D (4)
    const START_ROW = 5;
    const START_COL = 4; // Column D

    // --- 1. Setup Columns Widths (Global) ---
    // D=Name, E=Bone, F=Finish, G=Total
    worksheet.getColumn(START_COL).width = 35;     // Name
    worksheet.getColumn(START_COL + 1).width = 15; // Bone
    worksheet.getColumn(START_COL + 2).width = 15; // Finish
    worksheet.getColumn(START_COL + 3).width = 15; // Total

    let currentRow = START_ROW;

    // --- 2. Add Main Title ---
    const titleRow = worksheet.getRow(currentRow);
    // Merge across all columns
    worksheet.mergeCells(currentRow, START_COL, currentRow, START_COL + 3);
    
    worksheet.getCell(currentRow, START_COL).value = 'تقرير متابعة تنفيذ المشاريع التفصيلي';
    
    // Style the title
    worksheet.getCell(currentRow, START_COL).font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF2D3748' } };
    worksheet.getCell(currentRow, START_COL).alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 40;
    currentRow += 1;

    // Add Date Subtitle
    worksheet.mergeCells(currentRow, START_COL, currentRow, START_COL + 3);
    worksheet.getCell(currentRow, START_COL).value = `تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}`;
    worksheet.getCell(currentRow, START_COL).font = { name: 'Arial', size: 12, color: { argb: 'FF718096' } };
    worksheet.getCell(currentRow, START_COL).alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow += 2; // Gap

    // --- 3. Add Chart (Centered) ---
    if (chartImage) {
      const imageId = workbook.addImage({
        base64: chartImage,
        extension: 'png',
      });

      const chartStartRow = currentRow - 1; 
      const chartEndRow = chartStartRow + 15; 

      worksheet.addImage(imageId, {
        tl: { col: START_COL - 1, row: chartStartRow }, 
        br: { col: START_COL + 3, row: chartEndRow },   
        editAs: 'oneCell'
      });

      currentRow = chartEndRow + 3; 
    }

    // --- 4. Table Header ---
    const headerRow = worksheet.getRow(currentRow);
    const headers = ['اسم المشروع', 'نسبة العظم', 'نسبة التشطيب', 'الإنجاز الكلي'];
    headers.forEach((h, i) => {
        worksheet.getCell(currentRow, START_COL + i).value = h;
    });

    // Style Headers
    for (let i = 0; i < headers.length; i++) {
        const cell = worksheet.getCell(currentRow, START_COL + i);
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF3182CE' } 
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
    }
    headerRow.height = 30;
    currentRow++;

    // --- 5. Table Data ---
    projects.forEach((p, index) => {
      const row = worksheet.getRow(currentRow);
      const values = [
        p.name,
        `${p.bone_rate || 0}%`,
        `${p.finishing_rate || 0}%`,
        `${p.completion_rate}%`
      ];

      values.forEach((v, i) => {
          const cell = worksheet.getCell(currentRow, START_COL + i);
          cell.value = v;
          cell.font = { name: 'Arial', size: 11 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          
          if (index % 2 !== 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF7FAFC' }
            };
          }
      });
      
      row.height = 25;
      currentRow++;
    });

    // --- 6. Save File ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `execution_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Excel Generation Error:", error);
    alert("حدث خطأ أثناء إنشاء ملف Excel. يرجى تجربة CSV.");
    generateExecutionCsv(projects); // Fallback
  }
};
