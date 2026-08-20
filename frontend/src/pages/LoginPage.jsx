import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LANDING } from '../config/roleAccess';
import api from '../api/axios';
import { Building2, Lock, Mail, Shield, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const MicrosoftIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <rect width="11" height="11" x="1" y="1" fill="#F25022" />
    <rect width="11" height="11" x="12" y="1" fill="#7FBA00" />
    <rect width="11" height="11" x="1" y="12" fill="#00A4EF" />
    <rect width="11" height="11" x="12" y="12" fill="#FFB900" />
  </svg>
);

const GitHubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const PROVIDER_ICONS = {
  google: GoogleIcon,
  facebook: FacebookIcon,
  microsoft: MicrosoftIcon,
  github: GitHubIcon,
};

const PROVIDER_LABELS = {
  google: { label: 'غوغل', border: 'border-slate-200', hover: 'hover:border-red-300 hover:bg-red-50', text: 'text-slate-700' },
  facebook: { label: 'فيسبوك', border: 'border-slate-200', hover: 'hover:border-blue-300 hover:bg-blue-50', text: 'text-slate-700' },
  microsoft: { label: 'مايكروسوفت', border: 'border-slate-200', hover: 'hover:border-indigo-300 hover:bg-indigo-50', text: 'text-slate-700' },
  github: { label: 'جيت هب', border: 'border-slate-200', hover: 'hover:border-slate-400 hover:bg-slate-100', text: 'text-slate-700' },
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
                const meta = PROVIDER_LABELS[provider] || { label: provider, border: 'border-slate-200', hover: 'hover:border-slate-300', text: 'text-slate-700' };
                const Icon = PROVIDER_ICONS[provider];
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleOAuth(provider)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border ${meta.border} ${meta.hover} text-sm font-semibold ${meta.text} bg-white transition`}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
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
