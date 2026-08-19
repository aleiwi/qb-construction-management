import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import api from '../api/axios';
import { PageHeader } from '../components/ui/PageHeader';
import { Filter, RefreshCw } from 'lucide-react';

const ACTION_LABELS = {
  'payment.approve': { label: 'اعتماد دفعة', color: 'text-emerald-400' },
  'payment.mark_paid': { label: 'تسجيل دفعة كمدفوعة', color: 'text-blue-400' },
};

export const AuditLogsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ entity_type: '', entity_id: '' });

  useEffect(() => {
    if (!permissions.isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchLogs();
  }, [permissions.isAdmin]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.entity_id) params.append('entity_id', filters.entity_id);
      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'فشل تحميل سجلات التتبع';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const formatValue = (val) => {
    if (!val) return <span className="text-slate-600">—</span>;
    try {
      const obj = JSON.parse(val);
      return (
        <pre className="text-[10px] text-slate-300 whitespace-pre-wrap break-words bg-slate-950/60 rounded-lg p-2 border border-slate-800">
{JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-slate-300 text-xs">{val}</span>;
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('ar-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        <PageHeader
          title="سجل التتبع (Audit Log)"
          subtitle="سجل كامل لكل العمليات المالية الحساسة — من نفّذها، متى، القيمة القديمة والجديدة."
        />

        {!permissions.isAdmin ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 text-sm">
            هذه الصفحة مخصصة لمدير النظام فقط.
          </div>
        ) : (
          <>
            <form onSubmit={onFilterSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-semibold">نوع الكيان</label>
                <select
                  value={filters.entity_type}
                  onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-600"
                >
                  <option value="">الكل</option>
                  <option value="payment">دفعة</option>
                  <option value="contract">عقد</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-semibold">رقم الكيان</label>
                <input
                  type="number"
                  value={filters.entity_id}
                  onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })}
                  placeholder="مثال: 5"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-600 w-32"
                />
              </div>
              <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-2 transition">
                <Filter className="w-4 h-4" /> تصفية
              </button>
              <button type="button" onClick={fetchLogs} className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 transition">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
              </button>
            </form>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 mb-4 text-sm">{error}</div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm">
                لا توجد سجلات تتبع مطابقة للفلتر.
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="max-h-[70vh] overflow-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-900/90 sticky top-0 backdrop-blur">
                      <tr className="text-[11px] text-slate-400 uppercase tracking-wide">
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">الإجراء</th>
                        <th className="px-4 py-3 font-semibold">الكيان</th>
                        <th className="px-4 py-3 font-semibold">المستخدم</th>
                        <th className="px-4 py-3 font-semibold">القيمة القديمة</th>
                        <th className="px-4 py-3 font-semibold">القيمة الجديدة</th>
                        <th className="px-4 py-3 font-semibold">التوقيت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {logs.map((entry) => {
                        const meta = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-slate-300' };
                        return (
                          <tr key={entry.id} className="hover:bg-slate-900/80 transition">
                            <td className="px-4 py-3 text-slate-500 text-xs font-mono">{entry.id}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-xs">
                              <div className="font-mono">{entry.entity_type}</div>
                              <div className="text-slate-500 text-[10px]">#{entry.entity_id}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-xs">
                              <div>#{entry.user_id}</div>
                              {entry.ip_address && <div className="text-slate-500 text-[10px] font-mono">{entry.ip_address}</div>}
                            </td>
                            <td className="px-4 py-3 max-w-[220px]">{formatValue(entry.old_value)}</td>
                            <td className="px-4 py-3 max-w-[240px]">{formatValue(entry.new_value)}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(entry.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;