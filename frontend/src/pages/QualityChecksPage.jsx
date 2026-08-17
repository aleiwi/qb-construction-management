import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { LogoutButton } from '../components/ui/LogoutButton';
import { qualityChecksApi } from '../features/quality/qualityChecksApi';
import { stagesApi, buildingsApi } from '../features/projects/projectsApi';
import {
  ShieldCheck, Plus, RefreshCw, ArrowRight,
  X, CheckCircle2, AlertCircle, Building2, ClipboardCheck
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'في الانتظار', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  passed: { label: 'اجتاز الفحص', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { label: 'راسب', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const CreateQCModal = ({ stages, onSave, onClose }) => {
  const [form, setForm] = useState({ stage_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.stage_id) { setError('اختر المرحلة'); return; }
    setSaving(true);
    const result = await onSave({ stage_id: parseInt(form.stage_id), notes: form.notes });
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-white">فحص جودة جديد</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">المرحلة</label>
            <select value={form.stage_id} onChange={e => setForm(f => ({ ...f, stage_id: e.target.value }))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
              <option value="">اختر المرحلة</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.building_name ? `${s.building_name} — ${s.name}` : s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات (اختياري)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="ملاحظات الفحص..."
              rows={3}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'إنشاء الفحص'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResultModal = ({ qc, onSave, onClose }) => {
  const [status, setStatus] = useState(qc?.status || 'passed');
  const [notes, setNotes] = useState(qc?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await onSave({ status, notes });
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-white">تحديث نتيجة الفحص</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">النتيجة</label>
            <div className="flex gap-3">
              {[['passed', 'اجتاز', 'emerald'], ['failed', 'راسب', 'red']].map(([val, label, color]) => (
                <button key={val} type="button" onClick={() => setStatus(val)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition ${status === val ? `bg-${color}-600/20 border-${color}-500/40 text-${color}-400` : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="ملاحظات الفحص..."
              rows={3}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ النتيجة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const QualityChecksPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [qcList, setQcList] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQC, setEditingQC] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [qcRes, stagesRes] = await Promise.all([
        qualityChecksApi.list(),
        stagesApi.list(),
      ]);
      if (qcRes.success) setQcList(qcRes.data);
      if (stagesRes.success) setStages(stagesRes.data);
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
    const res = await qualityChecksApi.create(form);
    if (res.success) showSuccess('تم إنشاء فحص الجودة بنجاح');
    return res;
  };

  const handleUpdate = async (form) => {
    const res = await qualityChecksApi.update(editingQC.id, form);
    if (res.success) showSuccess('تم تحديث نتيجة الفحص بنجاح');
    return res;
  };

  const handleDelete = async (id) => {
    const res = await qualityChecksApi.delete(id);
    if (res.success) { showSuccess('تم حذف الفحص'); fetchData(); }
  };

  const passedCount = qcList.filter(q => q.status === 'passed').length;
  const pendingCount = qcList.filter(q => q.status === 'pending').length;
  const failedCount = qcList.filter(q => q.status === 'failed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/projects')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition mr-2">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-emerald-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">فحوصات الجودة QC</h1>
              <p className="text-[11px] text-slate-400">فحوصات جودة إلزامية لكل مرحلة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(permissions.isAdmin || permissions.isProjectManager || permissions.isEngineer) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>فحص جديد</span>
              </button>
            )}
            <LogoutButton compact />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الفحوصات', value: qcList.length, color: 'text-white' },
            { label: 'في الانتظار', value: pendingCount, color: 'text-amber-400' },
            { label: 'اجتاز', value: passedCount, color: 'text-emerald-400' },
            { label: 'راسب', value: failedCount, color: 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {loading && qcList.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل الفحوصات...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-300 text-center text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />{error}
          </div>
        ) : qcList.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد فحوصات</h3>
            <p className="text-sm text-slate-500 mb-6">أنشئ أول فحص جودة لمرحلة إنشائية</p>
            {(permissions.isAdmin || permissions.isProjectManager || permissions.isEngineer) && (
              <button onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />إنشاء فحص
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {qcList.map((qc) => {
              const statusCfg = STATUS_CONFIG[qc.status] || STATUS_CONFIG.pending;
              return (
                <div key={qc.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{qc.stage_name || `مرحلة #${qc.stage_id}`}</h3>
                        <span className="text-slate-500 text-xs">{qc.building_name || `مبنى`} {qc.project_name ? `— ${qc.project_name}` : ''}</span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>{new Date(qc.created_at).toLocaleDateString('ar-SA-u-nu-latn')}</span>
                        {qc.checked_at && <span className="text-teal-400">تم الفحص: {new Date(qc.checked_at).toLocaleDateString('ar-SA-u-nu-latn')}</span>}
                      </div>
                      {qc.notes && <p className="text-xs text-slate-500 mt-2">{qc.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {qc.status === 'pending' && (permissions.isAdmin || permissions.isProjectManager || permissions.isEngineer) && (
                        <>
                          <button onClick={() => { setEditingQC({ ...qc, status: 'passed' }); }}
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded-lg transition border border-emerald-500/20">
                            اجتاز
                          </button>
                          <button onClick={() => { setEditingQC({ ...qc, status: 'failed' }); }}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-bold rounded-lg transition border border-red-500/20">
                            راسب
                          </button>
                        </>
                      )}
                      {qc.status !== 'pending' && (permissions.isAdmin || permissions.isProjectManager || permissions.isEngineer) && (
                        <button onClick={() => setEditingQC(qc)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20" title="تعديل">
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}
                      {permissions.isAdmin && (
                        <button onClick={() => handleDelete(qc.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20" title="حذف">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateQCModal
          stages={stages}
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingQC && (
        <ResultModal
          qc={editingQC}
          onSave={handleUpdate}
          onClose={() => setEditingQC(null)}
        />
      )}
    </div>
  );
};