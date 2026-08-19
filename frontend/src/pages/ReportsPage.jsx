import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../features/reports/reportsApi';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import {
  RefreshCw, AlertCircle, Building2, HardHat,
  Wallet, ShieldCheck, Users, FileText, TrendingUp, CheckCircle2
} from 'lucide-react';

const formatCurrency = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(val);
};

const formatCurrencyShort = (val) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return formatCurrency(val);
};

const CHART_COLORS = {
  emerald: '#10b981', blue: '#3b82f6', amber: '#f59e0b',
  red: '#ef4444', purple: '#a855f7', teal: '#14b8a6',
  indigo: '#6366f1', rose: '#f43f5e', slate: '#64748b',
  cyan: '#06b6d4', orange: '#f97316',
};

const KPICard = ({ icon: Icon, label, value, sub, color, iconBg }) => (
  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${iconBg} rounded-2xl flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-slate-400 mt-1">{label}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
  </div>
);

const ChartCard = ({ title, icon: Icon, iconColor, children }) => (
  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
    <div className="flex items-center gap-2 mb-5">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <h3 className="font-bold text-white text-base">{title}</h3>
    </div>
    {children}
  </div>
);

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '0.75rem',
  color: '#e2e8f0',
  fontSize: '12px',
};

export const ReportsPage = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportsApi.kpis();
      if (res.success) setKpis(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل المؤشرات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);

  const p = kpis?.projects;
  const c = kpis?.contracts;
  const pm = kpis?.payments;
  const qc = kpis?.quality_checks;
  const hr = kpis?.hr;
  const boq = kpis?.boq;
  const cr = kpis?.completion;

  const completionOveralls = (cr?.latest_by_project || []).map(i => i.overall).filter(v => v !== null);
  const completionOverall = completionOveralls.length > 0
    ? completionOveralls.reduce((s, v) => s + v, 0) / completionOveralls.length
    : null;
  const overallPct = completionOverall !== null && !isNaN(completionOverall)
    ? completionOverall
    : parseFloat(p?.avg_progress || 0);

  const paymentsData = pm ? [
    { name: 'في الانتظار', value: pm.pending, color: CHART_COLORS.amber },
    { name: 'معتمدة', value: pm.approved, color: CHART_COLORS.blue },
    { name: 'مدفوعة', value: pm.paid, color: CHART_COLORS.emerald },
  ] : [];

  const qcData = qc ? [
    { name: 'اجتاز', value: qc.passed, color: CHART_COLORS.emerald },
    { name: 'معلّق', value: qc.pending, color: CHART_COLORS.amber },
    { name: 'راسب', value: qc.failed, color: CHART_COLORS.red },
  ] : [];

  const boqData = boq ? [
    { name: 'مصنف تلقائياً', value: boq.auto_classified || 0, color: CHART_COLORS.indigo },
    { name: 'مصنف يدوياً', value: boq.manually_classified || 0, color: CHART_COLORS.emerald },
    { name: 'غير مصنف', value: boq.unclassified, color: CHART_COLORS.red },
  ] : [];

  const boqTypeData = boq?.by_type ? Object.entries(boq.by_type).map(([key, val], i) => ({
    name: key, value: val,
    color: [CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.emerald, CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.rose, CHART_COLORS.cyan, CHART_COLORS.orange, CHART_COLORS.slate, CHART_COLORS.indigo, CHART_COLORS.red, CHART_COLORS.emerald][i % 12],
  })) : [];

  const progressData = [{ name: 'الإنجاز', progress: parseFloat(overallPct.toFixed(1)), fill: CHART_COLORS.emerald }];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PageHeader
        title="لوحة التقارير والمؤشرات KPI"
        subtitle="مؤشرات الأداء العامة عبر كل الوحدات"
        actions={
          <>
            <button onClick={fetchKpis} title="تحديث المؤشرات" aria-label="تحديث المؤشرات" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading && !kpis ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تجميع المؤشرات...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-300 text-center text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>{error}</p>
            <button onClick={fetchKpis} className="mt-4 px-4 py-2 bg-red-800/60 hover:bg-red-700/60 text-white rounded-xl text-xs font-bold transition">
              إعادة المحاولة
            </button>
          </div>
        ) : kpis ? (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KPICard icon={Building2} label="المشاريع" value={p?.total || 0}
                sub={`${p?.active || 0} نشط · ${p?.completed || 0} مكتمل`}
                color="text-white" iconBg="bg-blue-500/10 text-blue-400" />
              <KPICard icon={HardHat} label="المقاولون" value={c?.contractors || 0}
                sub={`${c?.total || 0} عقد`}
                color="text-amber-400" iconBg="bg-amber-500/10 text-amber-400" />
              <KPICard icon={Wallet} label="المدفوعات" value={pm?.paid || 0}
                sub={`${formatCurrency(pm?.paid_value || 0)} ر.س`}
                color="text-emerald-400" iconBg="bg-emerald-500/10 text-emerald-400" />
              <KPICard icon={ShieldCheck} label="فحوصات الجودة" value={qc?.passed || 0}
                sub={`${qc?.failed || 0} راسب · ${qc?.pending || 0} معلق`}
                color="text-teal-400" iconBg="bg-teal-500/10 text-teal-400" />
              <KPICard icon={Users} label="الموظفون" value={hr?.active_employees || 0}
                sub={`${formatCurrency(hr?.monthly_payroll || 0)} ر.س / شهر`}
                color="text-rose-400" iconBg="bg-rose-500/10 text-rose-400" />
              <KPICard icon={FileText} label="عناصر BOQ" value={boq?.elements_total || 0}
                sub={`${boq?.auto_classified || 0} تلقائي · ${boq?.manually_classified || 0} يدوي · ${boq?.unclassified || 0} غير مصنف`}
                color="text-indigo-400" iconBg="bg-indigo-500/10 text-indigo-400" />
            </div>

            {/* Completion Reports Section */}
            <section aria-label="تقارير نسب الإنجاز" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">تقارير نسب الإنجاز</h2>
                    <p className="text-[11px] text-slate-400">أحدث تقرير محفوظ لكل مشروع</p>
                  </div>
                </div>
                <button onClick={() => navigate('/completion-percentage')} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> إدارة تقارير الإنجاز
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="grid grid-cols-2 gap-4 content-start">
                  <div className="bg-slate-800/40 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">إجمالي التقارير</div>
                    <div className="text-2xl font-bold text-white mt-1">{cr?.reports_total || 0}</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">مشاريع بموجب تقارير</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">{cr?.projects_with_reports || 0}</div>
                  </div>
                  <div className="col-span-2 bg-slate-800/40 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">متوسط الإنجاز الكلي</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1">{completionOverall !== null ? `${completionOverall.toFixed(1)}%` : '—'}</div>
                  </div>
                  <div className="col-span-2 bg-slate-800/40 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">آخر فترة محفوظة</div>
                    <div className="text-sm font-bold text-white mt-1 truncate">{cr?.latest_by_project?.[0]?.report_period || '—'}</div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  {cr?.latest_by_project?.length > 0 ? (
                    <div className="space-y-4">
                      {cr.latest_by_project.map(item => {
                        const overall = item.overall;
                        const barColor = overall === null ? '#475569' : overall >= 100 ? '#10b981' : overall >= 40 ? '#f59e0b' : '#3b82f6';
                        return (
                          <div key={item.project_id} className="flex items-center gap-3">
                            <div className="w-44 truncate text-xs font-semibold text-slate-200 text-right shrink-0" title={item.project_name}>{item.project_name}</div>
                            <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${overall ?? 0}%`, backgroundColor: barColor }} />
                            </div>
                            <div className="w-16 text-center text-xs font-black font-mono text-slate-100 shrink-0">{overall === null ? '—' : `${overall}%`}</div>
                          </div>
                        );
                      })}
                      <div className="text-[11px] text-slate-500 text-right">النسبة العامة = متوسط الهيكل × 50% + متوسط التشطيبات × 50%</div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">لا توجد تقارير إنجاز بعد — أنشئ أول تقرير من صفحة إدارة تقارير الإنجاز</div>
                  )}
                </div>
              </div>
            </section>

            {/* Project Progress Radial + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="نسبة الإنجاز العامة" icon={TrendingUp} iconColor="text-emerald-400">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <RadialBarChart innerRadius="50%" outerRadius="90%" data={progressData} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: '#1e293b' }} dataKey="progress" cornerRadius={12} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'الإنجاز']} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-32 relative pointer-events-none">
                  <div className="text-3xl font-bold text-emerald-400">{overallPct.toFixed(1)}%</div>
                  <div className="text-xs text-slate-400">
                    {completionOverall !== null ? 'متوسط الإنجاز (أحدث التقارير)' : 'متوسط الإنجاز'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-20 pt-4 border-t border-slate-800">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{p?.buildings || 0}</div>
                    <div className="text-[11px] text-slate-400">مبانٍ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">{p?.stages || 0}</div>
                    <div className="text-[11px] text-slate-400">مراحل</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-400">{p?.completed || 0}</div>
                    <div className="text-[11px] text-slate-400">مكتمل</div>
                  </div>
                </div>
              </ChartCard>

              {/* Payments Pie */}
              <ChartCard title="توزيع حالة الدفعات" icon={Wallet} iconColor="text-purple-400">
                {pm && pm.total > 0 ? (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={paymentsData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                          {paymentsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-sm">لا توجد دفعات</div>
                )}
              </ChartCard>

              {/* QC Pie */}
              <ChartCard title="نتائج فحوصات الجودة" icon={ShieldCheck} iconColor="text-teal-400">
                {qc && qc.total > 0 ? (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={qcData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                          {qcData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-sm">لا توجد فحوصات</div>
                )}
              </ChartCard>
            </div>

            {/* Bar Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Bar Chart */}
              <ChartCard title="الوضع المالي (بالريال)" icon={Wallet} iconColor="text-emerald-400">
                {pm && (pm.paid_value > 0 || pm.pending_value > 0) ? (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={[
                        { name: 'مصروف', value: pm.paid_value, fill: CHART_COLORS.emerald },
                        { name: 'معلّق', value: pm.pending_value, fill: CHART_COLORS.amber },
                      ]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
                        <YAxis tickFormatter={formatCurrencyShort} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${formatCurrency(v)} ر.س`, 'القيمة']} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-sm">لا توجد بيانات مالية</div>
                )}
              </ChartCard>

              {/* BOQ Classification Status */}
              <ChartCard title="حالة التصنيف" icon={FileText} iconColor="text-indigo-400">
                {boq && boq.elements_total > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer>
                        <BarChart data={boqData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {boqData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col justify-center gap-3 pr-4">
                      {boqData.map(d => (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-xs text-slate-300 flex-1">{d.name}</span>
                          <span className="text-xs font-bold text-white">{d.value}</span>
                        </div>
                      ))}
                      <div className="text-[10px] text-slate-500 mt-2">🧠 {boq.patterns_learned || 0} نمط تم تعلمه</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-sm">لا توجد عناصر BOQ</div>
                )}
              </ChartCard>

              {/* BOQ Element Type Distribution */}
              {boqTypeData.length > 0 && (
                <ChartCard title="توزيع أنواع العناصر" icon={FileText} iconColor="text-purple-400">
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={boqTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {boqTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}
            </div>

            {/* Contracts + HR Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contracts Area Chart */}
              <ChartCard title="نظرة عامة على العقود" icon={HardHat} iconColor="text-amber-400">
                {c && (
                  <>
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer>
                        <AreaChart data={[
                          { name: 'المقاولون', value: c.contractors, fill: CHART_COLORS.amber },
                          { name: 'العقود', value: c.total, fill: CHART_COLORS.blue },
                          { name: 'نشطة', value: c.active, fill: CHART_COLORS.emerald },
                        ]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="contractGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="value" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#contractGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 mt-2">
                      <div className="bg-slate-800/40 rounded-2xl p-4">
                        <div className="text-xs text-slate-400">إجمالي قيمة العقود</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(c.total_value)} ر.س</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-2xl p-4">
                        <div className="text-xs text-slate-400">عقود نشطة</div>
                        <div className="text-xl font-bold text-blue-400 mt-1">{c.active}</div>
                      </div>
                    </div>
                  </>
                )}
              </ChartCard>

              {/* HR Breakdown */}
              <ChartCard title="الموارد البشرية" icon={Users} iconColor="text-rose-400">
                {hr && (
                  <>
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer>
                        <BarChart data={[
                          { name: 'إجمالي', value: hr.total_employees, fill: CHART_COLORS.slate },
                          { name: 'نشط', value: hr.active_employees, fill: CHART_COLORS.emerald },
                        ]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 mt-2">
                      <div className="bg-slate-800/40 rounded-2xl p-4">
                        <div className="text-xs text-slate-400">الرواتب الشهرية</div>
                        <div className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(hr.monthly_payroll)} ر.س</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-2xl p-4">
                        <div className="text-xs text-slate-400">نشط / إجمالي</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{hr.active_employees} / {hr.total_employees}</div>
                      </div>
                    </div>
                  </>
                )}
              </ChartCard>
            </div>

            <div className="text-center text-[11px] text-slate-500 pt-2">
              أُنشئ التقرير في: {kpis.generated_at ? new Date(kpis.generated_at).toLocaleString('ar-SA-u-nu-latn') : '—'}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};