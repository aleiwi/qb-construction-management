import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('رابط التفعيل غير صالح — يرجى طلب رابط جديد من مدير النظام');
      return;
    }
    (async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data?.message || 'تم تفعيل الحساب بنجاح');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'الرابط غير صالح أو منتهي الصلاحية');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-blue-950/20 relative z-10 text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-4">تفعيل الحساب</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-sm">جارٍ تفعيل الحساب...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="p-6 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-start gap-3 text-emerald-200 text-sm text-right animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">تم التفعيل بنجاح</p>
              <p>{message}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-start gap-3 text-red-200 text-sm text-right animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">تعذر التفعيل</p>
              <p>{message}</p>
            </div>
          </div>
        )}

        {status !== 'loading' && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition"
          >
            الذهاب إلى تسجيل الدخول
          </button>
        )}
      </div>
    </div>
  );
};