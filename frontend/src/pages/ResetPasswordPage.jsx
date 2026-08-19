import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Building2, Lock, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('رابط غير صالح — يرجى طلب رابط جديد');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'الرابط غير صالح أو منتهي الصلاحية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-blue-950/20 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">تعيين كلمة مرور جديدة</h1>
          <p className="text-sm text-slate-400 mt-2">أدخل كلمة المرور الجديدة (8 أحرف على الأقل)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-start gap-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="p-6 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-start gap-3 text-emerald-200 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">تم تحديث كلمة المرور بنجاح</p>
              <p>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">تأكيد كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>حفظ كلمة المرور الجديدة</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-xs text-slate-500 hover:text-slate-300 transition">
            العودة إلى تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
};