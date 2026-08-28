import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { paymentsApi, retentionsApi } from '../features/payments/paymentsApi';
import { contractsApi } from '../features/contractors/contractorsApi';
import {
  Wallet, Plus, RefreshCw,
  X, CheckCircle2, AlertCircle, Percent
} from 'lucide-react';
import { PAYMENT_STATUS as STATUS_CONFIG } from '../config/status';

const formatCurrency = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(val);
};

const CreatePaymentModal = ({ contracts, onSave, onClose }) => {
  const [form, setForm] = useState({ contract_id: '', stage_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stages, setStages] = useState([]);

  const selectedContract = contracts.find(c => c.id === parseInt(form.contract_id));

  useEffect(() => {
    if (selectedContract?.stages) {
      setStages(selectedContract.stages);
    } else {
      setStages([]);
    }
  }, [selectedContract]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contract_id) { setError('اختر العقد'); return; }
    if (!form.stage_id) { setError('اختر المرحلة'); return; }
    setSaving(true);
    const result = await onSave({ contract_id: parseInt(form.contract_id), stage_id: parseInt(form.stage_id), notes: form.notes });
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-white">إنشاء دفعة مرحلية</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">العقد</label>
            <select value={form.contract_id} onChange={e => setForm(f => ({ ...f, contract_id: e.target.value, stage_id: '' }))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
              <option value="">اختر العقد</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.title} — {c.contractor_name || `مقاول #${c.contractor_id}`}</option>)}
            </select>
          </div>
          {stages.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المرحلة</label>
              <select value={form.stage_id} onChange={e => setForm(f => ({ ...f, stage_id: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
                <option value="">اختر المرحلة</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name} ({s.weight_percent}% — {s.progress_percent}% إنجاز)</option>)}
              </select>
            </div>
          )}
          {selectedContract && (
            <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs text-slate-400 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">قيمة العقد</div>
                <div className="text-emerald-400 font-bold">{formatCurrency(selectedContract.total_value)} ر.س</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">نسبة الضمان</div>
                <div className="text-amber-400 font-bold flex items-center gap-0.5"><Percent className="w-3 h-3" />{selectedContract.retention_percent}%</div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات (اختياري)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="ملاحظات إضافية..."
              rows={2}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'إنشاء الدفعة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [payments, setPayments] = useState([]);
  const [retentions, setRetentions] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [activeTab, setActiveTab] = useState('payments');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, retentionsRes, contractsRes] = await Promise.all([
        paymentsApi.list(),
        retentionsApi.list(),
        contractsApi.list(),
      ]);
      if (paymentsRes.success) setPayments(paymentsRes.data);
      if (retentionsRes.success) setRetentions(retentionsRes.data);
      if (contractsRes.success) setContracts(contractsRes.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleCreate = async (form) => {
    const res = await paymentsApi.create(form);
    if (res.success) showSuccess('تم إنشاء الدفعة المرحلية بنجاح');
    return res;
  };

  const handleApprove = async (id) => {
    const res = await paymentsApi.approve(id);
    if (res.success) { showSuccess('تم اعتماد الدفعة'); fetchData(); }
  };

  const handleMarkPaid = async (id) => {
    const res = await paymentsApi.markPaid(id);
    if (res.success) { showSuccess('تم تسجيل الدفعة كمدفوعة'); fetchData(); }
  };

  const handleReleaseRetention = async (id) => {
    const res = await retentionsApi.release(id);
    if (res.success) { showSuccess('تم صرف الضمان'); fetchData(); }
  };

  const totalPayments = payments.reduce((s, p) => s + (p.net_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="المستحقات المالية والضمان"
        subtitle="الدفعات المرحلية وتحرير الضمانات"
        actions={
          <>
            <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(permissions.isAdmin || permissions.isProjectManager || permissions.isAccountant) && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>دفعة جديدة</span>
              </button>
            )}
          </>
        }
      />

      <div className="space-y-6">
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الدفعات', value: payments.length, color: 'text-white' },
            { label: 'في الانتظار', value: payments.filter(p => p.status === 'pending').length, color: 'text-amber-400' },
            { label: 'معتمدة', value: payments.filter(p => p.status === 'approved').length, color: 'text-blue-400' },
            { label: 'مدفوعة', value: payments.filter(p => p.status === 'paid').length, color: 'text-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-1.5 w-fit">
          {[['payments', 'الدفعات'], ['retentions', 'الضمانات']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading && payments.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل البيانات...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-300 text-center text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />{error}
          </div>
        ) : activeTab === 'payments' ? (
          payments.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
              <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد دفعات</h3>
              <p className="text-sm text-slate-500 mb-6">أنشئ أول دفعة مرحلية لصرف مستحقات المقاولين</p>
              {(permissions.isAdmin || permissions.isProjectManager || permissions.isAccountant) && (
                <button onClick={() => setShowModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />إضافة دفعة
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((p) => {
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                return (
                  <div key={p.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-bold text-white text-base">{p.contract_title || `عقد #${p.contract_id}`}</h3>
                          <span className="text-slate-500 text-xs">{p.stage_name || `مرحلة #${p.stage_id}`}</span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span>{new Date(p.created_at).toLocaleDateString('ar-SA-u-nu-latn')}</span>
                          {p.paid_at && <span className="text-emerald-400">مدفوعة في {new Date(p.paid_at).toLocaleDateString('ar-SA-u-nu-latn')}</span>}
                        </div>
                        {p.notes && <p className="text-xs text-slate-500 mt-2">{p.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-center">
                            <div className="text-sm font-bold text-white">{formatCurrency(p.amount)}</div>
                            <div className="text-[10px] text-slate-500">الإجمالي</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-red-400">{formatCurrency(p.retention_amount)}</div>
                            <div className="text-[10px] text-slate-500">الضمان</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-emerald-400">{formatCurrency(p.net_amount)}</div>
                            <div className="text-[10px] text-slate-500">الصافي</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.status === 'pending' && (permissions.isAdmin || permissions.isProjectManager) && (
                            <button onClick={() => handleApprove(p.id)}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold rounded-lg transition border border-blue-500/20">
                              اعتماد
                            </button>
                          )}
                          {p.status === 'approved' && permissions.isAccountant && (
                            <button onClick={() => handleMarkPaid(p.id)}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded-lg transition border border-emerald-500/20">
                              تسجيل الصرف
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div>
            {retentions.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
                <Percent className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد ضمانات محتجزة</h3>
                <p className="text-sm text-slate-500">الضمانات المحتجزة من الدفعات ستظهر هنا</p>
              </div>
            ) : (
              <div className="space-y-4">
                {retentions.map((r) => (
                  <div key={r.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-white text-base mb-1">{r.contract_title || `عقد #${r.contract_id}`}</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{new Date(r.created_at).toLocaleDateString('ar-SA-u-nu-latn')}</span>
                          {r.payment_id && <span>دفعة #{r.payment_id}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{formatCurrency(r.amount)}</div>
                          <div className="text-[10px] text-slate-500">ر.س محتجز</div>
                        </div>
                        {r.is_released ? (
                          <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">تم الصرف</span>
                        ) : (
                          (permissions.isAdmin || permissions.isProjectManager) && (
                            <button onClick={() => handleReleaseRetention(r.id)}
                              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-[10px] font-bold rounded-lg transition border border-purple-500/20">
                              صرف الضمان
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CreatePaymentModal
          contracts={contracts}
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};