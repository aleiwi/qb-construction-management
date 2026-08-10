import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractors } from '../features/contractors/useContractors';
import { usePermissions } from '../hooks/usePermissions';
import {
  HardHat, Plus, RefreshCw, Edit2, Trash2, ArrowRight, ArrowLeft,
  Building2, X, CheckCircle2, AlertCircle, ChevronRight, UserCheck, Phone, Mail
} from 'lucide-react';

const SPECS = {
  structural: 'أعمال إنشائية',
  electrical: 'أعمال كهربائية',
  plumbing: 'أعمال صحية',
  hvac: 'تكييف وتهوية',
  finishing: 'تشطيبات',
  landscaping: 'تنسيق حدائق',
  fencing: 'سياج وأسوار',
  demolition: 'هدم و إزالة',
  excavation: 'حفر وتسوية',
  painting: 'دهان',
  flooring: 'أرضيات',
  roofing: 'تسقيف',
  other: 'أخرى',
};

const SPEC_COLORS = {
  structural: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  electrical: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  plumbing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  hvac: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  finishing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  landscaping: 'bg-green-500/10 text-green-400 border-green-500/20',
  fencing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  demolition: 'bg-red-500/10 text-red-400 border-red-500/20',
  excavation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  painting: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  flooring: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  roofing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const ContractorModal = ({ contractor, onSave, onClose }) => {
  const [form, setForm] = useState({
    company_name: contractor?.company_name || '',
    contact_person: contractor?.contact_person || '',
    email: contractor?.email || '',
    phone: contractor?.phone || '',
    specialization: contractor?.specialization || '',
    notes: contractor?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) { setError('اسم الشركة مطلوب'); return; }
    if (!form.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    setSaving(true);
    const result = await onSave(form);
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {contractor ? 'تعديل المقاول' : 'مقاول جديد'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم الشركة / المقاول</label>
              <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="شركة البناء المتحدة"
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم شخص التواصل</label>
              <input type="text" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                placeholder="م. أحمد محمد"
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">التخصص</label>
              <select value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
                <option value="">اختر التخصص</option>
                {Object.entries(SPECS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="info@company.sa"
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم الجوال</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+966 50 123 4567"
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ملاحظات إضافية..."
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
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(val);
};

export const ContractorsPage = () => {
  const navigate = useNavigate();
  const { contractors, loading, error, fetchContractors, createContractor, updateContractor, deleteContractor } = useContractors();
  const permissions = usePermissions();
  const [showModal, setShowModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleSave = async (form) => {
    if (editingContractor) {
      const res = await updateContractor(editingContractor.id, form);
      if (res.success) showSuccess('تم تحديث بيانات المقاول');
      return res;
    } else {
      const res = await createContractor(form);
      if (res.success) showSuccess('تم إضافة المقاول بنجاح');
      return res;
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteContractor(id);
    if (res.success) { showSuccess('تم حذف المقاول'); setDeleteConfirm(null); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition mr-2">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-xl flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">المقاولون والعقود</h1>
              <p className="text-[11px] text-slate-400">إدارة المقاولين وتتبع عقودهم</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/contracts')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>العقود</span>
            </button>
            <button onClick={fetchContractors} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button
                onClick={() => { setEditingContractor(null); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>مقاول جديد</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Action feedback */}
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المقاولين', value: contractors.length, color: 'text-amber-400' },
            { label: 'نشط', value: contractors.filter(c => c.is_active).length, color: 'text-emerald-400' },
            { label: 'معقود', value: contractors.filter(c => c.contracts_count > 0).length, color: 'text-blue-400' },
            { label: 'إجمالي قيمة العقود', value: `${formatCurrency(contractors.reduce((s, c) => s + (c.total_contract_value || 0), 0))} ر.س`, color: 'text-purple-400', isText: true },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.isText ? stat.value : stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* List */}
        {loading && contractors.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل المقاولين...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-300 text-center text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />{error}
          </div>
        ) : contractors.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <HardHat className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا يوجد مقاولون</h3>
            <p className="text-sm text-slate-500 mb-6">ابدأ بإضافة أول مقاول للتعاقد معه</p>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button onClick={() => { setEditingContractor(null); setShowModal(true); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />إضافة مقاول
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contractors.map((c) => {
              const spec = SPECS[c.specialization] || c.specialization || 'أخرى';
              const specColor = SPEC_COLORS[c.specialization] || SPEC_COLORS.other;
              return (
                <div key={c.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-base">{c.company_name}</h3>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${specColor}`}>{spec}</span>
                          {c.is_active
                            ? <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />نشط</span>
                            : <span className="text-[10px] text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />معطل</span>
                          }
                        </div>
                        {c.contact_person && (
                          <p className="text-xs text-slate-400 mb-1">التواصل: {c.contact_person}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <div className="text-sm font-bold text-blue-400">{c.contracts_count || 0}</div>
                          <div className="text-[10px] text-slate-500">عقود</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-emerald-400">{formatCurrency(c.total_contract_value)}</div>
                          <div className="text-[10px] text-slate-500">ر.س</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/contracts?contractor_id=${c.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20" title="عرض العقود">
                          <Building2 className="w-4 h-4" />
                        </button>
                        {(permissions.isAdmin || permissions.isProjectManager) && (
                          <>
                            <button onClick={() => { setEditingContractor(c); setShowModal(true); }}
                              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition border border-transparent hover:border-emerald-500/20" title="تعديل">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(c)}
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

      {/* Modal */}
      {showModal && (
        <ContractorModal
          contractor={editingContractor}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingContractor(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-bold text-white text-lg">حذف المقاول</h3>
              <p className="text-sm text-slate-400 mt-1">
                هل أنت متأكد من حذف <strong className="text-white">{deleteConfirm.company_name}</strong>؟
                {(deleteConfirm.contracts_count > 0) && <span className="block text-amber-400 text-xs mt-2">هذا المقاول لديه {deleteConfirm.contracts_count} عقد. يجب فك الارتباط أولاً.</span>}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
              {deleteConfirm.contracts_count === 0 && (
                <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition">تأكيد الحذف</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};