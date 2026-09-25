import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserPlus, FaEnvelope, FaLock, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth.js';
import { isValidEmail } from '../../utils/qb/validation.js';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', passwordConfirm: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'الاسم مطلوب';
    if (!formData.email) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!isValidEmail(formData.email)) newErrors.email = 'بريد إلكتروني غير صالح';
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (formData.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = 'كلمات المرور غير متطابقة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register(formData.name, formData.email, formData.password, formData.passwordConfirm);
      if (result.success) {
        toast.success('تم إنشاء الحساب بنجاح', { fontSize: '14px', fontWeight: '600', background: '#10b981' });
        navigate('/login');
      } else {
        toast.error(result.message, { fontSize: '14px' });
      }
    } catch (err) {
      toast.error('فشل إنشاء الحساب', { fontSize: '14px' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2">{'إنشاء حساب جديد'}</h1>
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{'انضم إلى نظام إدارة المقاولات'}</p>
        </motion.div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'email', 'password', 'passwordConfirm'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1">
                {field === 'name' ? 'الاسم الكامل' : field === 'email' ? 'البريد الإلكتروني' : field === 'password' ? 'كلمة المرور' : 'تأكيد كلمة المرور'}
              </label>
              <input type={field === 'password' ? 'password' : 'text'}
                value={formData[field]} onChange={e => setFormData({...formData, [field]: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={field === 'name' ? 'محمد أحمد' : field === 'email' ? 'user@example.com' : field === 'password' ? '••••••••' : '••••••••'} />
              {errors[field] && <p className="text-red-400 text-sm mt-1">{errors[field]}</p>}
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full text-white font-bold py-3 rounded-xl transition hover:shadow-card disabled:opacity-50"
            style={{ background: 'var(--ink-900)' }}>
            {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'إنشاء الحساب'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;