import React, { useState, useEffect, useCallback } from 'react';
import { boqElementsApi } from '../features/boq/boqApi';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import {
  BarChart3, PieChart, RefreshCw, Layers, CheckCircle2, AlertTriangle,
  BrainCircuit, Target, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart as RePie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#14b8a6', '#f43f5e', '#06b6d4', '#f97316', '#64748b', '#8b5cf6', '#ec4899', '#84cc16'];

export const ClassificationDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await boqElementsApi.stats();
      if (res.success) setStats(res.data);
    } catch {
      setError('فشل تحميل إحصائيات التصنيف');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const typeData = stats?.by_type
    ? Object.entries(stats.by_type).map(([key, val]) => ({ name: key, count: val }))
    : [];
  const statusData = [
    { name: 'مصنف تلقائياً', value: stats?.auto_classified || 0, color: '#3b82f6' },
    { name: 'مصنف يدوياً', value: stats?.manually_classified || 0, color: '#10b981' },
    { name: 'غير مصنف', value: stats?.unclassified || 0, color: '#f59e0b' },
  ];
  const total = (stats?.auto_classified || 0) + (stats?.manually_classified || 0) + (stats?.unclassified || 0);
  const classified = total - (stats?.unclassified || 0);
  const pct = total > 0 ? Math.round(classified / total * 100) : 0;
  const hasLlm = stats?.using_llm;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PageHeader
        title="تحليلات التصنيف"
        subtitle="إحصائيات دقة التصنيف وتوزيع العناصر"
        actions={
          <button onClick={fetchStats} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !stats && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {stats && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>إجمالي العناصر</span>
                </div>
                <div className="text-xl font-bold text-white">{total}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">نسبة التصنيف</span>
                </div>
                <div className="text-xl font-bold text-emerald-400">{pct}%</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400">مصنف تلقائياً</span>
                </div>
                <div className="text-xl font-bold text-blue-400">{stats.auto_classified}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">مصنف يدوياً</span>
                </div>
                <div className="text-xl font-bold text-green-400">{stats.manually_classified}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Classification Status */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  حالة التصنيف
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RePie>
                    <Pie data={statusData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.filter(d => d.value > 0).map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                  </RePie>
                </ResponsiveContainer>
              </div>

              {/* Element Type Distribution */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  توزيع العناصر حسب النوع
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LLM Status */}
            {stats.llm_stats && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-white text-base flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-5 h-5 text-cyan-400" />
                  إحصائيات LLM
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-400">طلبات LLM</span>
                    <div className="text-lg font-bold text-white">{stats.llm_stats.llm_calls || 0}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">مصنف بالقواعد</span>
                    <div className="text-lg font-bold text-emerald-400">{stats.llm_stats.rule_only || 0}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">مصنف بـ LLM</span>
                    <div className="text-lg font-bold text-blue-400">{stats.llm_stats.llm_only || 0}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Patterns Learned */}
            {stats.patterns_learned !== undefined && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">الأنماط المتعلمة</div>
                    <div className="text-2xl font-bold text-amber-400">{stats.patterns_learned}</div>
                    <div className="text-[10px] text-slate-500">نمط من التصنيفات اليدوية السابقة</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !stats && !error && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد بيانات تصنيف</h3>
            <p className="text-sm text-slate-500">قم برفع مخططات CAD وتصنيف العناصر لعرض الإحصائيات</p>
          </div>
        )}
      </main>
    </div>
  );
};
