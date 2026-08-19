import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../features/projects/projectsApi';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import api from '../api/axios';
import {
  FileText, BarChart3, RefreshCw, Download, Printer,
  Building2, Layers, DollarSign, PieChart as PieChartIcon, TrendingUp, Percent, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#14b8a6', '#f43f5e', '#06b6d4', '#f97316', '#64748b'];

const formatCurrency = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(val);
};

export const BOQSummaryPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [boq, setBoq] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportMenu, setExportMenu] = useState(false);
  const [exporting, setExporting] = useState('');

  const fetchBoq = async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const [boqRes, projRes] = await Promise.all([
        api.get(`/boq-summary/project/${projectId}`),
        projectsApi.get(projectId),
      ]);
      if (boqRes.data.success) setBoq(boqRes.data.data);
      if (projRes.success) setProject(projRes.data);
    } catch (err) {
      setError('فشل تحميل BOQ المشروع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoq(); }, [projectId]);

  const downloadFile = async (format) => {
    setExporting(format);
    setExportMenu(false);
    try {
      const res = await api.get(`/boq-summary/project/${projectId}/export/${format}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOQ_${project?.name?.replace(/\s+/g, '_') || projectId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('فشل تصدير الملف');
    } finally {
      setExporting('');
    }
  };

  const summary = boq?.summary;
  const byType = boq?.by_type ? Object.values(boq.by_type) : [];
  const typeChartData = byType.map(t => ({ name: t.element_type, value: t.base_cost }));
  const qtyChartData = byType.map(t => ({ name: t.element_type, quantity: t.total_quantity }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PageHeader
        title="BOQ المشروع"
        subtitle={project?.name || `مشروع #${projectId}`}
        actions={
          <>
            <button onClick={fetchBoq} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => window.print()} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
              <Printer className="w-4 h-4" />
            </button>
            <div className="relative">
              <button onClick={() => setExportMenu(!exportMenu)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold" disabled={!!exporting}>
                {exporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{exporting ? 'جارٍ التصدير...' : 'تصدير'}</span>
              </button>
              {exportMenu && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden" onMouseLeave={() => setExportMenu(false)}>
                  <button onClick={() => downloadFile('excel')} className="w-full text-right px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Excel (.xlsx)
                  </button>
                  <button onClick={() => downloadFile('pdf')} className="w-full text-right px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-400" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading && !boq && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تجميع BOQ المشروع...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {boq && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>العناصر</span>
                </div>
                <div className="text-xl font-bold text-white">{boq.elements_count}</div>
                <div className="text-[10px] text-slate-500">{boq.classified_count} مصنف · {boq.unclassified_count} غير مصنف</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>المخططات</span>
                </div>
                <div className="text-xl font-bold text-white">{boq.drawings_count}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">التكلفة الأساسية</span>
                </div>
                <div className="text-xl font-bold text-emerald-400">{formatCurrency(summary?.total_base_cost)}</div>
                <div className="text-[10px] text-slate-500">ر.س</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400">الإجمالي شامل</span>
                </div>
                <div className="text-xl font-bold text-blue-400">{formatCurrency(summary?.total)}</div>
                <div className="text-[10px] text-slate-500">بعد هامش الربح والضريبة</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">الاحتياطي</span>
                </div>
                <div className="text-xl font-bold text-amber-400">{formatCurrency(summary?.contingency)}</div>
                <div className="text-[10px] text-slate-500">ر.س</div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Breakdown */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  تفصيل التكاليف
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'التكلفة الأساسية', value: summary?.total_base_cost, color: 'text-slate-300' },
                    { label: 'المصاريف الإدارية (10%)', value: summary?.overhead, color: 'text-amber-400' },
                    { label: 'هامش الربح (15%)', value: summary?.profit, color: 'text-emerald-400' },
                    { label: 'الاحتياطي (5%)', value: summary?.contingency, color: 'text-orange-400' },
                    { label: 'ضريبة القيمة المضافة (15%)', value: summary?.vat, color: 'text-red-400' },
                    { label: 'الإجمالي النهائي', value: summary?.total, color: 'text-blue-400 font-bold', border: true },
                  ].map(row => (
                    <div key={row.label} className={`flex justify-between text-sm ${row.border ? 'pt-3 border-t border-slate-700' : ''}`}>
                      <span className="text-slate-400">{row.label}</span>
                      <span className={row.color}>{formatCurrency(row.value)} ر.س</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost by Type Pie */}
              {typeChartData.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                  <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
                    <PieChartIcon className="w-5 h-5 text-purple-400" />
                    توزيع التكاليف حسب النوع
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={typeChartData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {typeChartData.filter(d => d.value > 0).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} formatter={(v) => `${formatCurrency(v)} ر.س`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Detailed BOQ Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  جدول حصر الكميات التفصيلي
                </h3>
                <span className="text-xs text-slate-400">{byType.length} نوع عنصر</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-xs text-slate-400">
                      <th className="text-right py-3 px-4 font-semibold">النوع</th>
                      <th className="text-right py-3 px-4 font-semibold">العدد</th>
                      <th className="text-right py-3 px-4 font-semibold">الكمية</th>
                      <th className="text-right py-3 px-4 font-semibold">الوحدة</th>
                      <th className="text-right py-3 px-4 font-semibold">التكلفة الأساسية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {byType.map(t => (
                      <tr key={t.element_type} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 text-white font-semibold">{t.element_type}</td>
                        <td className="py-3 px-4 text-slate-300">{t.count}</td>
                        <td className="py-3 px-4 text-slate-300">{t.total_quantity.toLocaleString('en-US')}</td>
                        <td className="py-3 px-4 text-slate-400">{t.unit}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{formatCurrency(t.base_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && !boq && !error && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد بيانات BOQ</h3>
            <p className="text-sm text-slate-500">ارفع مخططات CAD للمشروع لبدء حصر الكميات</p>
          </div>
        )}
      </main>
    </div>
  );
};
