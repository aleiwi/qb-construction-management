import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { contractsApi, contractorsApi } from '../features/contractors/contractorsApi';
import { buildingsApi } from '../features/projects/projectsApi';
import {
  Building2, Plus, RefreshCw, Edit2, Trash2, ArrowLeft,
  X, CheckCircle2, AlertCircle, Users, Calendar, Percent
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'مسودة', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  active: { label: 'نشط', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  completed: { label: 'مكتمل', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  terminated: { label: 'ملغي', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const ContractModal = ({ contract, contractors, buildings, onSave, onClose }) => {
  const [form, setForm] = useState({
    contractor_id: contract?.contractor_id || (contractors[0]?.id || ''),
    building_id: contract?.building_id || (buildings[0]?.id || ''),
    title: contract?.title || '',
    description: contract?.description || '',
    total_value: contract?.total_value || 0,
    retention_percent: contract?.retention_percent ?? 10,
    status: contract?.status || 'draft',
    start_date: contract?.start_date ? contract.start_date.split('T')[0] : '',
    end_date: contract?.end_date ? contract.end_date.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('عنوان العقد مطلوب'); return; }
    if (!form.contractor_id) { setError('اختر المقاول'); return; }
    if (!form.building_id) { setError('اختر المبنى'); return; }
    setSaving(true);
    const data = {
      ...form,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    };
    const result = await onSave(data);
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-white">{contract ? 'تعديل العقد' : 'عقد جديد'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان العقد</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="عقد أعمال الحفر والتسوية - عمارة 32"
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المقاول</label>
              <select value={form.contractor_id} onChange={e => setForm(f => ({ ...f, contractor_id: parseInt(e.target.value) }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
                <option value="">اختر المقاول</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المبنى</label>
              <select value={form.building_id} onChange={e => setForm(f => ({ ...f, building_id: parseInt(e.target.value) }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
                <option value="">اختر المبنى</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">قيمة العقد (ر.س)</label>
              <input type="number" min="0" step="0.01" value={form.total_value} onChange={e => setForm(f => ({ ...f, total_value: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نسبة الضمان المحتجز (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={form.retention_percent} onChange={e => setForm(f => ({ ...f, retention_percent: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاريخ البدء</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاريخ الانتهاء</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">حالة العقد</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="تفاصيل إضافية..."
                rows={2}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const formatCurrency = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('en-US-u-nu-latn', { style: 'decimal', maximumFractionDigits: 2 }).format(val);
};

export const ContractsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const permissions = usePermissions();
  const [contracts, setContracts] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const initialContractorId = searchParams.get('contractor_id');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (initialContractorId) params.contractor_id = initialContractorId;
      const [contractsRes, contractorsRes, buildingsRes] = await Promise.all([
        contractsApi.list(params),
        contractorsApi.list(1, 100),
        buildingsApi.list(),
      ]);
      if (contractsRes.success) setContracts(contractsRes.data);
      if (contractorsRes.success) setContractors(contractorsRes.data);
      if (buildingsRes.success) setBuildings(buildingsRes.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [initialContractorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleSave = async (form) => {
    if (editingContract) {
      const res = await contractsApi.update(editingContract.id, form);
      if (res.success) { showSuccess('تم تحديث العقد'); fetchData(); }
      return res;
    } else {
      const res = await contractsApi.create(form);
      if (res.success) { showSuccess('تم إنشاء العقد'); fetchData(); }
      return res;
    }
  };

  const handleDelete = async (id) => {
    const res = await contractsApi.delete(id);
    if (res.success) { showSuccess('تم حذف العقد'); setDeleteConfirm(null); fetchData(); }
  };

  const totalValue = contracts.reduce((s, c) => s + (c.total_value || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <PageHeader
        title="العقود"
        subtitle="العقود المبرمة بين المقاولين والمباني"
        actions={
          <>
            <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button
                onClick={() => { setEditingContract(null); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>عقد جديد</span>
              </button>
            )}
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي العقود', value: contracts.length, color: 'text-emerald-400' },
            { label: 'نشط', value: contracts.filter(c => c.status === 'active').length, color: 'text-blue-400' },
            { label: 'مكتمل', value: contracts.filter(c => c.status === 'completed').length, color: 'text-purple-400' },
            { label: 'إجمالي القيمة', value: `${formatCurrency(totalValue)} ر.س`, color: 'text-amber-400', isText: true },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.isText ? stat.value : stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter indicator */}
        {initialContractorId && (
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 text-xs text-blue-300 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>عرض عقود مقاول محدد</span>
            <button onClick={() => navigate('/contracts')} className="mr-auto px-2 py-1 bg-blue-800/40 hover:bg-blue-800/60 rounded-lg transition">إلغاء الفلتر</button>
          </div>
        )}

        {/* List */}
        {loading && contracts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل العقود...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-300 text-center text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />{error}
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد عقود</h3>
            <p className="text-sm text-slate-500 mb-6">ابدأ بإضافة أول عقد للربط بين مقاول ومبنى</p>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button onClick={() => { setEditingContract(null); setShowModal(true); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />إضافة عقد
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const statusCfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
              return (
                <div key={contract.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{contract.title}</h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          {contract.contractor_name || `مقاول #${contract.contractor_id}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          {contract.building_name || `مبنى #${contract.building_id}`}
                        </span>
                        {contract.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(contract.start_date).toLocaleDateString('ar-SA-u-nu-latn')}
                            {contract.end_date && ` - ${new Date(contract.end_date).toLocaleDateString('ar-SA-u-nu-latn')}`}
                          </span>
                        )}
                      </div>
                      {contract.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{contract.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <div className="text-sm font-bold text-emerald-400">{formatCurrency(contract.total_value)}</div>
                          <div className="text-[10px] text-slate-500">ر.س</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-amber-400 flex items-center gap-0.5">
                            <Percent className="w-3 h-3" />
                            {contract.retention_percent}%
                          </div>
                          <div className="text-[10px] text-slate-500">ضمان محتجز</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(permissions.isAdmin || permissions.isProjectManager) && (
                          <>
                            <button onClick={() => { setEditingContract(contract); setShowModal(true); }}
                              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition border border-transparent hover:border-emerald-500/20" title="تعديل">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(contract)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20" title="حذف">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <ContractModal
          contract={editingContract}
          contractors={contractors}
          buildings={buildings}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingContract(null); }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-bold text-white text-lg">حذف العقد</h3>
              <p className="text-sm text-slate-400 mt-1">
                هل أنت متأكد من حذف <strong className="text-white">{deleteConfirm.title}</strong>؟<br />
                لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};