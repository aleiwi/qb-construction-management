import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth.js';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('أدخل البريد الإلكتروني', { fontSize: '14px' }); return; }
    setLoading(true);
    try {
      // Call backend endpoint for password reset
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور', { fontSize: '14px', fontWeight: '600', background: '#10b981' });
      } else {
        toast.error('فشل إرسال رابط إعادة التعيين', { fontSize: '14px' });
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم', { fontSize: '14px' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center">
          <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold mb-2">تم إرسال البريد</h1>
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl font-extrabold mb-2">إعادة تعيين كلمة المرور</h1>
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        </motion.div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="admin@qb.com" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full text-white font-bold py-3 rounded-xl transition hover:shadow-card disabled:opacity-50"
            style={{ background: 'var(--ink-900)' }}>
            {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'إرسال رابط التعيين'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;