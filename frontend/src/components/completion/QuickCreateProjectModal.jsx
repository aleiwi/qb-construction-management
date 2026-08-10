// QuickCreateProjectModal.jsx — إنشاء سريع لمشروع جديد عند عدم وجود مشاريع
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Rocket } from 'lucide-react';
import { projectsApi } from '../../features/projects/projectsApi';

export const QuickCreateProjectModal = ({ open, onCreated, onClose }) => {
  const [form, setForm] = useState({ name: '', description: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('اسم المشروع مطلوب'); return; }
    setSaving(true); setError('');
    try {
      const res = await projectsApi.create({
        name: form.name, description: form.description, location: form.location, status: 'in_progress'
      });
      if (res.success) {
        setForm({ name: '', description: '', location: '' });
        onCreated?.(res.data);
        onClose?.();
      } else {
        setError(res.error?.message || 'فشل الإنشاء');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل الإنشاء');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">إنشاء سريع لمشروع جديد</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المشروع *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مشروع الأمواج السكني"
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الموقع</label>
                <input type="text" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="الرياض - حي النارجس"
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="تفاصيل مختصرة..."
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Building2 className="w-4 h-4" />}
                  {saving ? 'جارٍ الإنشاء...' : 'إنشاء المشروع'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickCreateProjectModal;