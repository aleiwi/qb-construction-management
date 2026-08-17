import React, { useState, useEffect } from 'react';
import { priceLibraryApi } from '../features/boq/boqApi';
import { useAuth } from '../hooks/useAuth';
import { LogoutButton } from '../components/ui/LogoutButton';
import { DollarSign, Plus, Edit2, Trash2, Search, X, AlertCircle, RefreshCw } from 'lucide-react';

const UNIT_OPTIONS = ['م2', 'م3', 'م', 'عدد', 'كجم', 'طن', 'م2.سقف', 'م2.جدار'];

const ELEMENT_TYPES = [
  'wall', 'column', 'slab', 'beam', 'foundation',
  'door', 'window', 'stairs', 'roof', 'partition', 'opening', 'other',
];

export const PriceLibraryPage = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ element_type: '', unit: 'م2', unit_price: '', description: '' });

  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await priceLibraryApi.list();
      if (res.success) setPrices(res.data);
    } catch {
      setError('فشل تحميل المكتبة السعرية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  const filtered = prices.filter(p =>
    p.element_type?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ element_type: '', unit: 'م2', unit_price: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (price) => {
    setEditing(price);
    setForm({ element_type: price.element_type, unit: price.unit, unit_price: String(price.unit_price), description: price.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.element_type || !form.unit_price) return;
    setError('');
    try {
      const payload = { element_type: form.element_type, unit: form.unit, unit_price: parseFloat(form.unit_price), description: form.description || null };
      if (editing) {
        await priceLibraryApi.update(editing.id, payload);
      } else {
        await priceLibraryApi.upsert(payload);
      }
      setShowModal(false);
      await fetchPrices();
    } catch (err) {
      setError('فشل حفظ السعر');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السعر؟')) return;
    try {
      await priceLibraryApi.delete(id);
      await fetchPrices();
    } catch {
      setError('فشل حذف السعر');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">المكتبة السعرية</h1>
              <p className="text-[11px] text-slate-400">إدارة أسعار الوحدات للعناصر الإنشائية</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchPrices} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold">
              <Plus className="w-4 h-4" />
              إضافة سعر
            </button>
            <LogoutButton compact />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Table */}
        {loading && !prices.length ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/60 text-xs text-slate-400">
                    <th className="text-right py-3 px-4 font-semibold">نوع العنصر</th>
                    <th className="text-right py-3 px-4 font-semibold">الوصف</th>
                    <th className="text-right py-3 px-4 font-semibold">الوحدة</th>
                    <th className="text-right py-3 px-4 font-semibold">سعر الوحدة</th>
                    <th className="text-center py-3 px-4 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-bold text-emerald-400">
                          {p.element_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{p.description || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{p.unit}</td>
                      <td className="py-3 px-4 text-white font-bold">{p.unit_price.toLocaleString()} ر.س</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">لا توجد أسعار مسجلة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">{editing ? 'تعديل السعر' : 'إضافة سعر جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">نوع العنصر</label>
                <select
                  value={form.element_type}
                  onChange={e => setForm({ ...form, element_type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">اختر النوع</option>
                  {ELEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">الوصف</label>
                <input
                  type="text" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف السعر"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">الوحدة</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">سعر الوحدة (ر.س)</label>
                  <input
                    type="number" value={form.unit_price}
                    onChange={e => setForm({ ...form, unit_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={!form.element_type || !form.unit_price}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition font-bold text-sm"
              >
                {editing ? 'حفظ التعديلات' : 'إضافة السعر'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
