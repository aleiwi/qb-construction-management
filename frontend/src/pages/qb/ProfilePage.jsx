import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEdit, FaSave, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth.js';
import { isValidEmail, isValidPhone } from '../../utils/qb/validation.js';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.full_name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ full_name: formData.name, phone: formData.phone }),
      });
      if (res.ok) {
        toast.success('تم تحديث الملف الشخصي', { fontSize: '14px', fontWeight: '600', background: '#10b981' });
        setEditMode(false);
      } else {
        toast.error('فشل التحديث', { fontSize: '14px' });
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم', { fontSize: '14px' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--ink-900)' }}>
            <FaUser className="w-8 h-8" style={{ color: 'var(--gold-500)' }} />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">الملف الشخصي</h1>
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{user?.email || 'user@qb.com'}</p>
        </motion.div>
        <div className="space-y-4">
          {editMode ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الهاتف</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                style={{ background: 'var(--ink-900)' }}>
                {saving ? <FaSpinner className="animate-spin mx-auto" /> : 'حفظ'}
              </button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <p className="text-sm" style={{ color: 'var(--ink-500)' }}>الاسم</p>
                <p className="font-semibold">{formData.name}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <p className="text-sm" style={{ color: 'var(--ink-500)' }}>البريد الإلكتروني</p>
                <p className="font-semibold">{formData.email}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <p className="text-sm" style={{ color: 'var(--ink-500)' }}>الهاتف</p>
                <p className="font-semibold">{formData.phone || 'غير محدد'}</p>
              </div>
            </>
          )}
          <div className="flex gap-3">
            {!editMode && (
              <button onClick={() => setEditMode(true)}
                className="flex-1 text-white font-bold py-3 rounded-xl transition hover:shadow-card"
                style={{ background: 'var(--ink-900)' }}>
                <FaEdit className="inline mr-2" /> تعديل
              </button>
            )}
            <button onClick={handleLogout}
              className="flex-1 text-red-400 font-bold py-3 rounded-xl border border-red-400/30 transition hover:bg-red-400/10">
              <FaLock className="inline mr-2" /> خروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;