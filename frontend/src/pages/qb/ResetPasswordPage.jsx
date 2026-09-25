import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaEye, FaEyeSlash, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { isValidPassword, isEmpty } from '../../utils/qb/validation.js';
import { getAuthErrorMessage } from '../../utils/qb/authErrors.js';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('رابط غير صالح أو منتهي الصلاحية');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (isEmpty(password)) {
      toast.error('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (!isValidPassword(password)) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('جاري تحديث كلمة المرور...');

    try {
      const response = await api.post('/auth/reset-password', {
        token: token,
        new_password: password
      });

      if (response.data.success) {
        toast.dismiss(loadingToast);
        toast.success('تم تحديث كلمة المرور بنجاح!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('فشل تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="bg-slate-900 rounded-xl p-8 w-full max-w-md border border-slate-700">
        <div className="flex items-center justify-center mb-6">
          <FaLock className="text-blue-400 text-3xl" />
          <h2 className="text-2xl font-bold text-white mr-3">إعادة تعيين كلمة المرور</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="6 أحرف على الأقل"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-white"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">تأكيد كلمة المرور</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="أعد إدخال كلمة المرور"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-white"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
            {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
