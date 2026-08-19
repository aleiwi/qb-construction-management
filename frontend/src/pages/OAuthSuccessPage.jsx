import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LANDING } from '../config/roleAccess';

export const OAuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('access_token');
    const refresh = searchParams.get('refresh_token');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError('فشل تسجيل الدخول عبر المزود الخارجي. حاول مرة أخرى أو استخدم البريد وكلمة المرور.');
      return;
    }
    if (!token) {
      setError('استجابة غير صالحة من مزود تسجيل الدخول.');
      return;
    }

    localStorage.setItem('access_token', token);
    if (refresh) localStorage.setItem('refresh_token', refresh);

    api
      .get('/auth/me')
      .then((res) => {
        if (res?.data?.success) {
          const userData = res.data.data;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          navigate(ROLE_LANDING[userData.role] || '/dashboard', { replace: true });
        } else {
          setError('تعذر جلب بيانات الحساب.');
        }
      })
      .catch(() => setError('تعذر الاتصال بالخادم. حاول مرة أخرى.'));
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        {error ? (
          <>
            <h1 className="text-xl font-bold text-white mb-3 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> تعذر تسجيل الدخول
            </h1>
            <p className="text-sm text-slate-400 mb-5">{error}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition"
            >
              العودة لتسجيل الدخول
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white mb-3">جارٍ تسجيل الدخول...</h1>
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          </>
        )}
      </div>
    </div>
  );
};