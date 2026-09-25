import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaSignInAlt, FaGoogle, FaEye, FaEyeSlash,
  FaPhone, FaEnvelope, FaLock, FaSpinner, FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth.js';
import { isValidEmail, isValidPhone, isValidOTP, isEmpty } from '../../utils/qb/validation.js';
import { getAuthErrorMessage } from '../../utils/qb/authErrors.js';
import toast from 'react-hot-toast';

const toastStyle = {
  fontSize: '14px', fontWeight: '500'
};
const successToastStyle = {
  fontSize: '14px', fontWeight: '600', background: '#10b981'
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'otp'
  const [otp, setOtp] = useState('');

  const validate = () => {
    const newErrors = {};
    if (activeTab === 'login') {
      if (!formData.email) newErrors.email = 'البريد الإلكتروني مطلوب';
      else if (!isValidEmail(formData.email)) newErrors.email = 'بريد إلكتروني غير صالح';
      if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    } else {
      if (!otp) newErrors.otp = 'رمز التحقق مطلوب';
      else if (!isValidOTP(otp)) newErrors.otp = 'رمز التحقق غير صالح';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (activeTab === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success('تم تسجيل الدخول بنجاح', successToastStyle);
          navigate('/dashboard');
        } else {
          toast.error(result.message, toastStyle);
        }
      } else {
        // OTP verification - for current project, use email verification endpoint
        toast.error('خاصية OTP غير متاحة في النظام الحالي', toastStyle);
      }
    } catch (err) {
      toast.error(getAuthErrorMessage(err), toastStyle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2">{'مرحباً بك'}</h1>
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{'سجل الدخول للوصول إلى لوحة التحكم'}</p>
        </motion.div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'login' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="admin@qb.com" />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                    placeholder="admin123" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">رمز التحقق</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="أدخل رمز التحقق" maxLength={6} />
              {errors.otp && <p className="text-red-400 text-sm mt-1">{errors.otp}</p>}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full text-white font-bold py-3 rounded-xl transition hover:shadow-card disabled:opacity-50"
            style={{ background: 'var(--ink-900)' }}>
            {loading ? <FaSpinner className="animate-spin mx-auto" /> : (activeTab === 'login' ? 'تسجيل الدخول' : 'تحقق')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;