import React, { useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  calcStructureProgress, calcFinishingProgress, calcOverallProgress,
  calcSectorProgress, formatCurrency
} from './defaultCompletionData';

const COLORS = {
  emerald: '#10b981',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  slate: '#64748b',
  darkNavy: '#0f172a',
  lightBg: '#f8fafc'
};

const getProgressColor = (value) => {
  const val = parseFloat(value) || 0;
  if (val >= 100) return COLORS.emerald;
  if (val >= 40) return COLORS.amber;
  if (val > 0) return COLORS.blue;
  return COLORS.slate;
};

const SectionBadge = ({ number, color = "bg-amber-500" }) => (
  <span className={`w-5 h-5 rounded-full ${color} text-white font-black text-[11px] leading-none inline-flex items-center justify-center shrink-0 pt-[1px] shadow-2xs font-sans`}>
    {number}
  </span>
);

const CorporateHeader = ({ data, title, sectionNum, pageNum, totalPages = 6 }) => (
  <div className="border-b-2 border-amber-500/80 pb-2 mb-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {sectionNum && (
        <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-sm shrink-0 pt-[1px] font-sans">
          {sectionNum}
        </span>
      )}
      <div>
        <h2 className="text-sm font-black text-slate-900 leading-none mb-0.5">{title}</h2>
        <p className="text-[9.5px] text-slate-500">{data.companyName || 'مسقا الأولى للتطوير العقاري'} · متابعة التنفيذ</p>
      </div>
    </div>

    <div className="flex items-center gap-4 text-right text-[9px] text-slate-500">
      <div>
        <span className="font-medium text-slate-500">المستند: </span>
        <span dir="ltr" className="font-mono text-slate-900 font-bold">{data.docRef}</span>
      </div>
      <div className="border-r border-slate-300 h-3" />
      <div>
        <span className="font-medium text-slate-500">التاريخ: </span>
        <span className="font-bold text-slate-900">{data.reportPeriod}</span>
      </div>
      <div className="border-r border-slate-300 h-3" />
      <div>
        <span className="font-semibold text-slate-700">الصفحة: </span>
        <span dir="ltr" className="font-mono font-black text-amber-600">0{pageNum} / 0{totalPages}</span>
      </div>
    </div>
  </div>
);

const CorporateFooter = ({ data, pageNum, totalPages = 6 }) => (
  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 mt-auto">
    <span>{data.companyName || 'مسقا الأولى للتطوير العقاري'} · تقرير متابعة تنفيذ</span>
    <span dir="ltr" className="font-mono text-slate-500 font-semibold">{data.docRef}</span>
    <span dir="ltr" className="font-mono font-bold text-slate-600">0{pageNum} / 0{totalPages}</span>
  </div>
);

// ====== A4 Landscape report — print-only layout (hidden on screen) ======
export const ProgressPrintReport = ({ data }) => {
  const dashboardRef = useRef(null);

  const stProgress = calcStructureProgress(data.structureItems);
  const fnProgress = calcFinishingProgress(data.finishingItems);
  const overall = calcOverallProgress(data.structureItems, data.finishingItems);

  const completedItemsCount = data.structureItems.filter(i => i.progress === 100).length + data.finishingItems.filter(i => i.progress === 100).length;
  const activeItemsCount = data.structureItems.filter(i => i.progress > 0 && i.progress < 100).length + data.finishingItems.filter(i => i.progress > 0 && i.progress < 100).length;
  const pendingItemsCount = data.structureItems.filter(i => i.progress === 0).length + data.finishingItems.filter(i => i.progress === 0).length;
  const totalItemsCount = data.structureItems.length + data.finishingItems.length;

  const totalPaidVal = data.paymentsSchedule.filter(p => p.paid).reduce((s, p) => s + (p.totalVal || p.contractorVal + p.devVal), 0);
  const totalPendingVal = data.paymentsSchedule.filter(p => !p.paid).reduce((s, p) => s + (p.totalVal || p.contractorVal + p.devVal), 0);
  const paidRatioPct = Math.round((totalPaidVal / (data.totalBudget || 1)) * 100);

  const stHalf = Math.ceil(data.structureItems.length / 2);
  const fnHalf = Math.ceil(data.finishingItems.length / 2);

  const pieData = [
    { name: 'منجز', value: overall, color: '#10b981' },
    { name: 'متبقٍّ', value: 100 - overall, color: '#e2e8f0' },
  ];

  const sectorBars = data.finishingSectors.map((s) => ({
    id: s.id,
    name: s.name,
    value: calcSectorProgress(s.id, data.finishingItems),
    itemsCount: data.finishingItems.filter(it => it.sectorId === s.id).length
  }));

  return (
    <div className="hidden print:block">
      {/* Landscape Print & CSS Override Styles */}
      <style>{`
        .cp-report-container, .cp-report-container * {
          font-family: 'Tajawal', 'Cairo', Arial, sans-serif !important;
          font-variant: normal !important;
        }
        @media screen {
          .cp-report-page { max-width: calc(100vw - 2rem); }
        }
        @media print {
          body { background: #ffffff !important; margin: 0 !important; }
          header, nav { display: none !important; }
          main { padding: 0 !important; max-width: none !important; }
          .cp-report-page {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 8mm 12mm !important;
            margin: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>

      {/* Multi-Page Report Container (A4 Landscape Format) */}
      <div ref={dashboardRef} dir="rtl" className="cp-report-container space-y-6 min-w-[900px]">

        {/* ==================== PAGE 2: EXECUTIVE OVERVIEW & KEY METRICS ==================== */}
        <div className="cp-report-page bg-white text-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 w-[297mm] h-[210mm] max-w-[calc(100vw-2rem)] min-h-[210mm] mx-auto flex flex-col justify-between">
          <CorporateHeader data={data} title="ملخص الإنجاز ومؤشرات المشروع" pageNum={1} totalPages={6} />

          <div className="grid grid-cols-2 gap-5 flex-1 items-stretch">

            {/* Section 1: Overview Donut Chart & Status Counter Badges */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <SectionBadge number={1} />
                  نظرة عامة على الإنجاز
                </h3>
              </div>

              {/* Centered Donut Gauge */}
              <div className="flex-1 flex flex-col items-center justify-center relative py-2">
                <div className="w-44 h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        cx="50%" cy="50%"
                        innerRadius={52} outerRadius={72}
                        startAngle={90} endAngle={-270}
                        paddingAngle={3}
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Gauge Center Text */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center">
                    <span dir="ltr" className="text-3xl font-black text-slate-900 tracking-tight leading-none">{overall}%</span>
                    <span className="text-[9px] font-bold text-slate-500 mt-1">متوسط نسبة الإنجاز الكلي</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <span>منجز: <span dir="ltr" className="font-mono font-black">{overall}%</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                    <span>متبقٍّ: <span dir="ltr" className="font-mono font-black">{(100 - overall).toFixed(1)}%</span></span>
                  </div>
                </div>
              </div>

              {/* 3 Status KPI Counters */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                <div className="bg-emerald-50 border-r-4 border-r-emerald-500 rounded-xl p-2.5 text-center">
                  <div dir="ltr" className="text-xl font-black text-emerald-700 leading-none flex items-center justify-center w-full font-mono">{completedItemsCount}</div>
                  <div className="text-[10px] font-bold text-emerald-900 mt-1">مكتملة</div>
                  <div className="text-[8px] text-emerald-600">بنود بنسبة 100%</div>
                </div>

                <div className="bg-amber-50 border-r-4 border-r-amber-500 rounded-xl p-2.5 text-center">
                  <div dir="ltr" className="text-xl font-black text-amber-700 leading-none flex items-center justify-center w-full font-mono">{activeItemsCount}</div>
                  <div className="text-[10px] font-bold text-amber-900 mt-1">قيد التنفيذ</div>
                  <div className="text-[8px] text-amber-600">بنود جارية</div>
                </div>

                <div className="bg-slate-100 border-r-4 border-r-slate-400 rounded-xl p-2.5 text-center">
                  <div dir="ltr" className="text-xl font-black text-slate-700 leading-none flex items-center justify-center w-full font-mono">{pendingItemsCount}</div>
                  <div className="text-[10px] font-bold text-slate-800 mt-1">لم تبدأ</div>
                  <div className="text-[8px] text-slate-500">بنود قادمة</div>
                </div>
              </div>
            </div>

            {/* Section 2: Project Info Card */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <SectionBadge number={2} />
                  بيانات المشروع
                </h3>
              </div>

              {/* Structured Metadata Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-[10.5px] flex-1 items-center py-1">
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-500 font-medium">نوع المشروع</span>
                  <span className="font-bold text-slate-900">{data.projectType}</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-500 font-medium">رقم المشروع</span>
                  <span dir="ltr" className="font-mono font-bold text-slate-900">{data.projectNumber}</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-500 font-medium">الموقع</span>
                  <span className="font-bold text-slate-900">{data.location}</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-500 font-medium">عدد الوحدات</span>
                  <span className="font-bold text-slate-900">{data.unitsCount} وحدة سكنية</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-500 font-medium">فترة التقرير</span>
                  <span className="font-bold text-slate-900">{data.reportPeriod}</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-500 font-medium">إجمالي البنود</span>
                  <span className="font-bold text-slate-900">{totalItemsCount} بنداً</span>
                </div>
              </div>

              {/* Main Site Photo Card (ONLY rendered if photo uploaded) */}
              {data.photoGallery?.[0]?.src && (
                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden bg-slate-900 relative h-36 flex flex-col justify-end">
                  <img
                    src={data.photoGallery[0].src}
                    alt={data.photoGallery[0].title || data.photoGallery[0].caption || 'Site Overview'}
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                  <div className="relative bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-2.5 text-white">
                    <div className="text-[10.5px] font-black text-amber-400">{data.photoGallery[0].title || data.photoGallery[0].caption || 'الصورة الرئيسية للموقع'}</div>
                    <div className="text-[9px] text-slate-300">تصوير وتوثيق الموقع الميداني لمشروع {data.projectName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <CorporateFooter data={data} pageNum={1} totalPages={6} />
        </div>

        {/* ==================== PAGE 3: STAGES & SECTORS PROGRESS ==================== */}
        <div className="cp-report-page bg-white text-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 w-[297mm] h-[210mm] max-w-[297mm] min-h-[210mm] mx-auto flex flex-col justify-between">
          <CorporateHeader data={data} title="الإنجاز حسب مرحلتي العمل والقطاعات" pageNum={2} totalPages={6} />

          <div className="space-y-4 flex-1 flex flex-col justify-between">

            {/* Top Indicator Cards Bar (العظم / التشطيبات / الكلي) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 flex items-center justify-between shadow-md">
                <div>
                  <div className="text-[10px] text-amber-400 font-bold">متوسط الإنجاز الكلي</div>
                  <div className="text-2xl font-black font-mono leading-none mt-1">{overall}%</div>
                  <div className="text-[8.5px] text-slate-400 mt-1">إجمالي {totalItemsCount} بنداً هندسياً</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm">
                  {overall}%
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] text-emerald-800 font-bold">أعمال العظم (الهيكل)</div>
                  <div className="text-2xl font-black text-emerald-700 font-mono leading-none mt-1">{stProgress}%</div>
                  <div className="text-[8.5px] text-emerald-600 mt-1">{data.structureItems.length} بنداً · {stProgress === 100 ? 'منجزة بالكامل' : 'قيد التنفيذ'}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
                  {stProgress}%
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] text-amber-800 font-bold">أعمال التشطيبات</div>
                  <div className="text-2xl font-black text-amber-700 font-mono leading-none mt-1">{fnProgress}%</div>
                  <div className="text-[8.5px] text-amber-600 mt-1">{data.finishingItems.length} بنداً · قيد التنفيذ الجاري</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-sm">
                  {fnProgress}%
                </div>
              </div>
            </div>

            {/* Main Sector Progress Rows (8 Sectors Breakdown) */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex-1 flex flex-col justify-between">
              <div className="border-b border-slate-200 pb-2 mb-2 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <SectionBadge number={3} />
                  المؤشر العام — العظم والتشطيبات ({data.finishingSectors.length} قطاعات فرعية)
                </h3>
                <span className="text-[9.5px] text-slate-500">متابعة نسب إنجاز القطاعات الثمانية</span>
              </div>

              <div className="space-y-2 flex-1 flex flex-col justify-around">
                {sectorBars.map((sector, idx) => {
                  const sColor = getProgressColor(sector.value);
                  return (
                    <div key={sector.id} className="bg-white border border-slate-200/90 rounded-xl p-2 flex items-center gap-3 shadow-xs">
                      {/* Number badge */}
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs inline-flex items-center justify-center shrink-0 pt-[1px] leading-none">
                        {idx + 1}
                      </span>

                      {/* Sector name */}
                      <div className="w-52 text-right font-bold text-slate-800 text-[11px] whitespace-nowrap shrink-0">
                        {sector.name}
                      </div>

                      {/* Progress Bar Track */}
                      <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden relative border border-slate-200/70">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${sector.value}%`,
                            backgroundColor: sColor
                          }}
                        />
                      </div>

                      {/* Items Count Badge */}
                      <span className="text-[9.5px] font-medium text-slate-500 w-16 text-center shrink-0">
                        {sector.itemsCount} بنود
                      </span>

                      {/* Percentage Badge */}
                      <span
                        className="w-14 text-center font-mono font-black text-[11px] px-2 py-0.5 rounded-lg shrink-0"
                        style={{
                          backgroundColor: sector.value > 0 ? `${sColor}15` : '#f1f5f9',
                          color: sector.value > 0 ? sColor : '#64748b'
                        }}
                      >
                        {sector.value}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sector Status Legend */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 mt-2 text-[9.5px]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> مكتمل (100%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> قيد التنفيذ (1% - 99%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> لم يبدأ (0%)
                  </span>
                </div>

                <div className="font-mono text-slate-500 font-bold">
                  متوسط التشطيبات: <span className="text-amber-600 font-black">{fnProgress}%</span> · العظم: <span className="text-emerald-600 font-black">{stProgress}%</span> · الكلي: <span className="text-slate-900 font-black">{overall}%</span>
                </div>
              </div>
            </div>
          </div>

          <CorporateFooter data={data} pageNum={2} totalPages={6} />
        </div>

        {/* ==================== PAGE 4: DETAILED STRUCTURE ITEMS (29 BANDS) ==================== */}
        <div className="cp-report-page bg-white text-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 w-[297mm] h-[210mm] max-w-[297mm] min-h-[210mm] mx-auto flex flex-col justify-between">
          <CorporateHeader data={data} title="تفاصيل أعمال العظم (الهيكل والأساسات)" pageNum={3} totalPages={6} />

          <div className="flex-1 flex flex-col justify-between">
            {/* Banner Header */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SectionBadge number={4} color="bg-emerald-600" />
                <span className="text-xs font-black text-emerald-900">بنود أعمال العظم — متوسط الإنجاز {stProgress}%</span>
              </div>
              <div className="flex items-center gap-3 text-[9.5px]">
                <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold">{stProgress === 100 ? 'مكتمل (100%)' : `قيد التنفيذ (${stProgress}%)`}</span>
                <span className="text-slate-500 font-medium">{data.structureItems.length} بنداً — {stProgress === 100 ? 'منجزة بالكامل' : 'متابعة نسب الإنجاز الجارية'}</span>
              </div>
            </div>

            {/* 2-Column Split Table */}
            <div className="grid grid-cols-2 gap-4 flex-1">

              {/* Right Column (Items 1 to 15) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-1 border-l border-slate-200 text-center w-6">م</th>
                      <th className="p-1 border-l border-slate-200 text-right">البند</th>
                      <th className="p-1 text-center w-20">نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.structureItems.slice(0, stHalf).map((it, i) => (
                      <tr key={it.id} className="even:bg-slate-50/70 border-t border-slate-100 h-5.5">
                        <td className="p-1 border-l border-slate-200 text-center text-slate-500 font-mono font-bold">{i + 1}</td>
                        <td className="p-1 border-l border-slate-200 text-slate-800 font-bold">{it.name}</td>
                        <td className="p-1 text-center">
                          <span
                            className="px-2 py-0.5 rounded-full text-[8.5px] font-bold font-mono inline-block w-14"
                            style={{
                              backgroundColor: it.progress > 0 ? `${getProgressColor(it.progress)}18` : '#f1f5f9',
                              color: it.progress > 0 ? getProgressColor(it.progress) : '#64748b',
                              border: `1px solid ${it.progress > 0 ? getProgressColor(it.progress) : '#cbd5e1'}`
                            }}
                          >
                            {it.progress}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Left Column (Items 16 to 29) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-1 border-l border-slate-200 text-center w-6">م</th>
                      <th className="p-1 border-l border-slate-200 text-right">البند</th>
                      <th className="p-1 text-center w-20">نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.structureItems.slice(stHalf).map((it, i) => (
                      <tr key={it.id} className="even:bg-slate-50/70 border-t border-slate-100 h-5.5">
                        <td className="p-1 border-l border-slate-200 text-center text-slate-500 font-mono font-bold">{i + stHalf + 1}</td>
                        <td className="p-1 border-l border-slate-200 text-slate-800 font-bold">{it.name}</td>
                        <td className="p-1 text-center">
                          <span
                            className="px-2 py-0.5 rounded-full text-[8.5px] font-bold font-mono inline-block w-14"
                            style={{
                              backgroundColor: it.progress > 0 ? `${getProgressColor(it.progress)}18` : '#f1f5f9',
                              color: it.progress > 0 ? getProgressColor(it.progress) : '#64748b',
                              border: `1px solid ${it.progress > 0 ? getProgressColor(it.progress) : '#cbd5e1'}`
                            }}
                          >
                            {it.progress}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <CorporateFooter data={data} pageNum={3} totalPages={6} />
        </div>

        {/* ==================== PAGE 5: DETAILED FINISHING ITEMS (29 BANDS) ==================== */}
        <div className="cp-report-page bg-white text-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 w-[297mm] h-[210mm] max-w-[297mm] min-h-[210mm] mx-auto flex flex-col justify-between">
          <CorporateHeader data={data} title="تفاصيل أعمال التشطيبات" pageNum={4} totalPages={6} />

          <div className="flex-1 flex flex-col justify-between">
            {/* Banner Header */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SectionBadge number={5} />
                <span className="text-xs font-black text-amber-900">بنود أعمال التشطيبات ({data.finishingItems.length} بنداً هندسياً)</span>
              </div>
              <div className="flex items-center gap-3 text-[9.5px]">
                <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-bold">متوسط الإنجاز: {fnProgress}%</span>
                <span className="text-slate-500 font-medium">متابعة دقيقة لنسب إنجاز بنود التشطيب الجارية</span>
              </div>
            </div>

            {/* 2-Column Split Table */}
            <div className="grid grid-cols-2 gap-4 flex-1">

              {/* Right Column (Items 1 to 15) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-1 border-l border-slate-200 text-center w-6">م</th>
                      <th className="p-1 border-l border-slate-200 text-right">البند</th>
                      <th className="p-1 text-center w-20">نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.finishingItems.slice(0, fnHalf).map((it, i) => {
                      const badgeColor = getProgressColor(it.progress);
                      return (
                        <tr key={it.id} className="even:bg-slate-50/70 border-t border-slate-100 h-5.5">
                          <td className="p-1 border-l border-slate-200 text-center text-slate-500 font-mono font-bold">{i + 1}</td>
                          <td className="p-1 border-l border-slate-200 text-slate-800 font-bold">{it.name}</td>
                          <td className="p-1 text-center">
                            <span
                              className="px-2 py-0.5 rounded-full text-[8.5px] font-bold font-mono inline-block w-14"
                              style={{
                                backgroundColor: it.progress > 0 ? `${badgeColor}18` : '#f1f5f9',
                                color: it.progress > 0 ? badgeColor : '#64748b',
                                border: `1px solid ${it.progress > 0 ? badgeColor : '#cbd5e1'}`
                              }}
                            >
                              {it.progress}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Left Column (Items 16 to 29) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-1 border-l border-slate-200 text-center w-6">م</th>
                      <th className="p-1 border-l border-slate-200 text-right">البند</th>
                      <th className="p-1 text-center w-20">نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.finishingItems.slice(fnHalf).map((it, i) => {
                      const badgeColor = getProgressColor(it.progress);
                      return (
                        <tr key={it.id} className="even:bg-slate-50/70 border-t border-slate-100 h-5.5">
                          <td className="p-1 border-l border-slate-200 text-center text-slate-500 font-mono font-bold">{i + fnHalf + 1}</td>
                          <td className="p-1 border-l border-slate-200 text-slate-800 font-bold">{it.name}</td>
                          <td className="p-1 text-center">
                            <span
                              className="px-2 py-0.5 rounded-full text-[8.5px] font-bold font-mono inline-block w-14"
                              style={{
                                backgroundColor: it.progress > 0 ? `${badgeColor}18` : '#f1f5f9',
                                color: it.progress > 0 ? badgeColor : '#64748b',
                                border: `1px solid ${it.progress > 0 ? badgeColor : '#cbd5e1'}`
                              }}
                            >
                              {it.progress}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Progress Bar Indicator */}
            <div className="bg-slate-900 text-white rounded-xl p-2.5 mt-3 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400">متوسط نسبة الإنجاز الكلي للمشروع</span>
              <div className="flex items-center gap-6 font-mono font-black">
                <span>العظم: <span className="text-emerald-400">{stProgress}%</span></span>
                <span>التشطيبات: <span className="text-amber-400">{fnProgress}%</span></span>
                <span>الكلي: <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">{overall}%</span></span>
              </div>
            </div>
          </div>

          <CorporateFooter data={data} pageNum={4} totalPages={6} />
        </div>

        {/* ==================== PAGE 6: FINANCIAL BUDGET & PAYMENTS ==================== */}
        <div className="cp-report-page bg-white text-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 w-[297mm] h-[210mm] max-w-[297mm] min-h-[210mm] mx-auto flex flex-col justify-between">
          <CorporateHeader data={data} title="ميزانية المشروع وبيان الدفعات" pageNum={5} totalPages={6} />

          <div className="space-y-3 flex-1 flex flex-col justify-between">

            {/* Section 6: Budget Overview & Timeline Bar */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3">
              <div className="border-b border-slate-200 pb-1.5 mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <SectionBadge number={6} />
                  ملخص الميزانية ومسار الصرف
                </h3>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-3 mb-2.5">
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-right shadow-xs">
                  <div className="text-[9.5px] font-bold text-slate-500">إجمالي قيمة المشروع</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{formatCurrency(data.totalBudget)} <span className="text-xs text-slate-500 font-normal">ر.س</span></div>
                  <div className="text-[8.5px] text-slate-400 mt-0.5">للمقاولات {formatCurrency(data.contractorBudget)} · للتطوير {formatCurrency(data.developerBudget)}</div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-right shadow-xs">
                  <div className="text-[9.5px] font-bold text-emerald-800">إجمالي ما تم صرفه</div>
                  <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">{formatCurrency(totalPaidVal)} <span className="text-xs text-emerald-600 font-normal">ر.س</span></div>
                  <div className="text-[8.5px] text-emerald-600 mt-0.5">5 دفعات مدفوعة · {paidRatioPct}% من القيمة الكلية</div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 text-right shadow-xs">
                  <div className="text-[9.5px] font-bold text-amber-900">إجمالي المتبقي</div>
                  <div className="text-lg font-black text-amber-700 font-mono mt-0.5">{formatCurrency(totalPendingVal)} <span className="text-xs text-amber-600 font-normal">ر.س</span></div>
                  <div className="text-[8.5px] text-amber-600 mt-0.5">4 دفعات قادمة · {100 - paidRatioPct}% من القيمة الكلية</div>
                </div>
              </div>

              {/* Spending Progress Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-3">
                <div className="flex-1 bg-slate-200 rounded-full h-5 overflow-hidden flex font-mono text-[9px] font-bold">
                  <div className="bg-emerald-500 text-white flex items-center justify-center leading-none px-1" style={{ width: `${paidRatioPct}%` }}>
                    {paidRatioPct >= 10 ? `${paidRatioPct}% مصروف` : ''}
                  </div>
                  <div className="bg-amber-500 text-slate-950 flex items-center justify-center leading-none px-1" style={{ width: `${100 - paidRatioPct}%` }}>
                    {100 - paidRatioPct >= 10 ? `${100 - paidRatioPct}% متبقٍّ` : ''}
                  </div>
                </div>
                <div className="text-[9.5px] font-bold text-slate-700 shrink-0">
                  مدة العقد <span className="font-mono text-slate-900">{data.contractDurationMonths} شهراً</span> · مدة التنفيذ الفعلية <span className="font-mono text-slate-900">{data.actualDurationMonths} شهراً</span>
                </div>
              </div>
            </div>

            {/* Section 7: Payment Schedule Milestones Table */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 flex-1 flex flex-col justify-between">
              <div className="border-b border-slate-200 pb-1.5 mb-2 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <SectionBadge number={7} />
                  بيان الدفعات حسب مراحل التنفيذ ({data.paymentsSchedule.length} مراحل)
                </h3>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex-1 flex flex-col justify-between">
                <table className="w-full text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-1 border-l border-slate-200 text-center w-6">م</th>
                      <th className="p-1 border-l border-slate-200 text-right">المرحلة / الوصف</th>
                      <th className="p-1 border-l border-slate-200 text-center w-12">النسبة</th>
                      <th className="p-1 border-l border-slate-200 text-center">القيمة للمقاولات (ر.س)</th>
                      <th className="p-1 border-l border-slate-200 text-center">القيمة للتطوير (ر.س)</th>
                      <th className="p-1 border-l border-slate-200 text-center font-bold">إجمالي الدفعة (ر.س)</th>
                      <th className="p-1 border-l border-slate-200 text-center w-20">حالة الصرف</th>
                      <th className="p-1 text-center w-20">تاريخ الاستحقاق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.paymentsSchedule.map((p, i) => (
                      <tr key={p.id} className="even:bg-slate-50/80 border-t border-slate-100 h-5.5">
                        <td className="p-1 border-l border-slate-200 text-center text-slate-500 font-mono font-bold">{i + 1}</td>
                        <td className="p-1 border-l border-slate-200 text-slate-800 font-bold">{p.name}</td>
                        <td className="p-1 border-l border-slate-200 text-center font-mono font-bold text-amber-600">{p.ratio}%</td>
                        <td className="p-1 border-l border-slate-200 text-center font-mono text-slate-700">{formatCurrency(p.contractorVal)}</td>
                        <td className="p-1 border-l border-slate-200 text-center font-mono text-slate-700">{formatCurrency(p.devVal)}</td>
                        <td className="p-1 border-l border-slate-200 text-center font-mono font-black text-slate-900">{formatCurrency(p.totalVal || (p.contractorVal + p.devVal))}</td>
                        <td className="p-1 border-l border-slate-200 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold inline-flex items-center gap-1 ${
                            p.paid ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.paid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {p.paid ? 'مدفوع' : 'غير مدفوع'}
                          </span>
                        </td>
                        <td className="p-1 text-center font-mono font-bold text-slate-600">{p.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan="2" className="p-1 border-l border-slate-200 text-right">الإجمالي الكلي</td>
                      <td className="p-1 border-l border-slate-200 text-center font-mono text-amber-600">100%</td>
                      <td className="p-1 border-l border-slate-200 text-center font-mono">{formatCurrency(data.contractorBudget)}</td>
                      <td className="p-1 border-l border-slate-200 text-center font-mono">{formatCurrency(data.developerBudget)}</td>
                      <td className="p-1 border-l border-slate-200 text-center font-mono text-emerald-700">{formatCurrency(data.totalBudget)}</td>
                      <td colSpan="2" className="p-1 text-center text-[9px] text-slate-500 font-normal">شامل جميع المراحل والدفعات المستحقة</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <CorporateFooter data={data} pageNum={5} totalPages={6} />
        </div>

        {/* ==================== PAGE 7: SITE PHOTO GALLERY & SIGNATURES ==================== */}
        <div className="cp-report-page bg-white text-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 w-[297mm] h-[210mm] max-w-[297mm] min-h-[210mm] mx-auto flex flex-col justify-between">
          <CorporateHeader
            data={data}
            title={data.photoGallery && data.photoGallery.length > 0 ? "التوثيق المصور للموقع والاعتمادات" : "توقيعات واعتمادات أطراف المشروع"}
            pageNum={6}
            totalPages={6}
          />

          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {/* Section 8: Photo Documentation Gallery (ONLY rendered if photos uploaded) */}
            {data.photoGallery && data.photoGallery.length > 0 && (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 flex-1 flex flex-col justify-between">
                <div className="border-b border-slate-200 pb-1 mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <SectionBadge number={8} />
                    توثيق مصور لسير العمل الميداني
                  </h3>
                  <span className="text-[9px] text-slate-500">معرض صور الموقع الحالي</span>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1 items-stretch">
                  {data.photoGallery.slice(0, 6).map((photo) => (
                    <div key={photo.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 relative group flex flex-col justify-end">
                      <img src={photo.src} alt={photo.title || photo.caption} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="relative bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-2 text-white">
                        <div className="text-[9.5px] font-bold leading-tight">{photo.title || photo.caption}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures & Approvals Box */}
            <div className={`bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 ${!data.photoGallery?.length ? 'flex-1 flex flex-col justify-center' : ''}`}>
              <div className="text-xs font-black text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                <SectionBadge number={data.photoGallery && data.photoGallery.length > 0 ? 9 : 8} />
                توقيعات واعتمادات أطراف المشروع المعتمدة
              </div>
              <div className="grid grid-cols-3 gap-8 pt-2">
                <div className="text-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="h-16 border-b-2 border-dashed border-slate-300 mb-2 flex items-end justify-center pb-2">
                    <span className="text-[9px] text-slate-400 font-mono">التوقيع والختم</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">الاستشاري / المهندس المشرف</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">اعتماد نسبة الإنجاز التنفيذي</div>
                </div>

                <div className="text-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="h-16 border-b-2 border-dashed border-slate-300 mb-2 flex items-end justify-center pb-2">
                    <span className="text-[9px] text-slate-400 font-mono">التوقيع والختم</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">المطور العقاري</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">مسقا الأولى للتطوير العقاري</div>
                </div>

                <div className="text-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="h-16 border-b-2 border-dashed border-slate-300 mb-2 flex items-end justify-center pb-2">
                    <span className="text-[9px] text-slate-400 font-mono">التوقيع والختم</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">المقاول الرئيسي للمشروع</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">تأكيد الميزانية والبنود المنجزة</div>
                </div>
              </div>
            </div>
          </div>

          <CorporateFooter data={data} pageNum={6} totalPages={6} />
        </div>

      </div>
    </div>
  );
};

export default ProgressPrintReport;
