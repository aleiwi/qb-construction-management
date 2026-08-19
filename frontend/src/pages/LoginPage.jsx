import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LANDING } from '../config/roleAccess';
import api from '../api/axios';
import { Building2, Lock, Mail, Shield, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const PROVIDER_LABELS = {
  google: { label: 'غوغل', color: 'hover:bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  facebook: { label: 'فيسبوك', color: 'hover:bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  microsoft: { label: 'مايكروسوفت', color: 'hover:bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
  github: { label: 'جيت هب', color: 'hover:bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [oauthProviders, setOauthProviders] = useState([]);

  useEffect(() => {
    api.get('/auth/oauth/providers')
      .then((res) => setOauthProviders(res?.data?.data || []))
      .catch(() => setOauthProviders([]));
  }, []);

  const handleOAuth = (provider) => {
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
    window.location.href = `${base}/auth/oauth/${provider}`;
  };

  useEffect(() => {
    if (user) navigate(ROLE_LANDING[user.role] || '/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(ROLE_LANDING[result.role] || '/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-blue-950/20 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">نظام إدارة المقاولات المتكامل</h1>
          <p className="text-sm text-slate-400 mt-2">سجل الدخول باستخدام البريد الإلكتروني وكلمة المرور</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@qb.com"
                className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">كلمة المرور</label>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {oauthProviders.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500">أو سجل الدخول عبر</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {oauthProviders.map((provider) => {
                const meta = PROVIDER_LABELS[provider] || { label: provider, color: '', border: 'border-slate-300', text: 'text-slate-700' };
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleOAuth(provider)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border ${meta.border} ${meta.color} text-sm font-semibold ${meta.text} bg-white transition`}
                  >
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-blue-400 transition">
            نسيت كلمة المرور؟
          </Link>
        </div>

        {/* Demo toggle — collapsed by default */}
        <div className="mt-6 pt-4 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition mx-auto"
          >
            <Shield className="w-3.5 h-3.5" />
            {showDemo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showDemo ? 'إخفاء الحسابات التجريبية' : 'حسابات تجريبية للاختبار'}</span>
          </button>

          {showDemo && (
            <div className="grid grid-cols-2 gap-2 mt-3 animate-fade-in">
              {[
                ['admin@qb.com', 'admin123', 'مدير النظام', 'text-blue-400', 'إدارة كاملة'],
                ['pm@qb.com', 'pm123', 'مدير المشاريع', 'text-violet-400', 'إدارة المشاريع'],
                ['eng.ahmed@qb.com', 'engineer123', 'مهندس الموقع', 'text-emerald-400', 'مراجعة BOQ و QC'],
                ['accountant@qb.com', 'accountant123', 'محاسب', 'text-amber-400', 'الدفعات والضمانات'],
                ['contractor@qb.com', 'contractor123', 'مقاول', 'text-rose-400', 'عقد بقيمة 5,000,000 ر.س'],
              ].map(([demoEmail, demoPassword, label, color, desc]) => (
                <button key={demoEmail} type="button"
                  onClick={() => fillDemoAccount(demoEmail, demoPassword)}
                  className="text-right p-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs text-slate-300 transition">
                  <div className={`font-bold ${color}`}>{label}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
