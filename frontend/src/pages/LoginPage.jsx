import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LANDING } from '../config/roleAccess';
import api from '../api/axios';
import { Building2, Lock, Mail, AlertCircle, ArrowLeft, Eye, EyeOff, Phone } from 'lucide-react';

/* ─── Provider Icons ─── */
const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GitHubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const MicrosoftIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <rect width="11" height="11" x="1" y="1" fill="#F25022" />
    <rect width="11" height="11" x="12" y="1" fill="#7FBA00" />
    <rect width="11" height="11" x="1" y="12" fill="#00A4EF" />
    <rect width="11" height="11" x="12" y="12" fill="#FFB900" />
  </svg>
);

const AppleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/* Map provider id -> icon + label + styling */
const PROVIDER_CONFIG = {
  google:    { label: 'غوغل',       Icon: GoogleIcon,    bg: '#fff',     border: '#d1d5db', hoverBg: '#f9fafb', textWhite: false },
  facebook:  { label: 'فيسبوك',     Icon: FacebookIcon,  bg: '#1877F2',  border: '#1877F2', hoverBg: '#1565d8',  textWhite: true  },
  github:    { label: 'جيت هب',     Icon: GitHubIcon,    bg: '#24292e',  border: '#24292e', hoverBg: '#1a1e22',  textWhite: true  },
  microsoft: { label: 'مايكروسوفت', Icon: MicrosoftIcon, bg: '#fff',     border: '#d1d5db', hoverBg: '#f9fafb',  textWhite: false },
  apple:     { label: 'آبل',        Icon: AppleIcon,     bg: '#000',     border: '#000',    hoverBg: '#1a1a1a',  textWhite: true  },
  x:         { label: 'X',          Icon: XIcon,         bg: '#000',     border: '#000',    hoverBg: '#1a1a1a',  textWhite: true  },
};

const HEAD = "'Cairo','Tajawal',sans-serif";
const INK = '#0e1b2c';
const SOFT = '#5a6b7b';
const LINE = 'rgba(14,27,44,0.12)';
const ERR_BG = '#fef2f2';
const ERR_BC = '#fecaca';
const ERR_TX = '#991b1b';
const BG2 = '#f5f6f8';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState([]);

  useEffect(() => {
    api.get('/auth/oauth/providers')
      .then((res) => setConfiguredProviders(res?.data?.data || []))
      .catch(() => setConfiguredProviders([]));
  }, []);

  useEffect(() => {
    if (user) navigate(ROLE_LANDING[user.role] || '/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'email') {
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
    } else {
      if (!phone) {
        setError('يرجى إدخال رقم الهاتف');
        return;
      }
      setError('تسجيل الدخول بالهاتف متاح قريباً — استخدم البريد الإلكتروني حالياً');
    }
  };

  const handleOAuth = (provider) => {
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
    window.location.href = `${base}/auth/oauth/${provider}`;
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setMode('email');
    setError('');
  };

  const socialProviders = configuredProviders
    .map((id) => ({ ...(PROVIDER_CONFIG[id] || {}), id }))
    .filter((p) => p.id);

  return (
    <div className="min-h-screen" style={{ background: '#fff', color: INK }} dir="rtl">
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ background: INK }}>
              <Building2 className="w-7 h-7" style={{ color: '#c9a24b' }} strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: HEAD }}>تسجيل الدخول</h1>
            <p className="text-sm mt-2" style={{ color: SOFT }}>اختر طريقة تسجيل الدخول المناسبة</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 flex items-start gap-3 text-sm rounded-xl" style={{ background: ERR_BG, border: `1px solid ${ERR_BC}`, color: ERR_TX }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── Social Login Buttons (only configured providers) ─── */}
          {socialProviders.length > 0 && (
            <div className="space-y-2.5 mb-6">
              {socialProviders.map(({ id, label, Icon, bg, border, hoverBg, textWhite }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleOAuth(id)}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-150 hover:shadow-sm"
                  style={{
                    background: bg,
                    borderColor: border,
                    color: textWhite ? '#fff' : INK,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = bg; }}
                >
                  <Icon className="w-5 h-5 shrink-0" style={label === 'جيت هب' ? { fill: textWhite ? '#fff' : INK } : {}} />
                  <span>تسجيل الدخول عبر {label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ─── Divider ─── */}
          {(socialProviders.length > 0) && (
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: LINE }} />
              <span className="text-xs font-bold" style={{ color: SOFT }}>أو</span>
              <div className="flex-1 h-px" style={{ background: LINE }} />
            </div>
          )}

          {/* ─── Mode Switcher ─── */}
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: BG2 }}>
            <button
              type="button"
              onClick={() => { setMode('email'); setError(''); }}
              className="flex-1 py-2.5 text-sm font-bold rounded-lg transition-all"
              style={mode === 'email' ? { background: '#fff', color: INK, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: SOFT }}
            >
              <Mail className="w-4 h-4 inline-block ml-1.5 -mt-0.5" />
              البريد الإلكتروني
            </button>
            <button
              type="button"
              onClick={() => { setMode('phone'); setError(''); }}
              className="flex-1 py-2.5 text-sm font-bold rounded-lg transition-all"
              style={mode === 'phone' ? { background: '#fff', color: INK, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: SOFT }}
            >
              <Phone className="w-4 h-4 inline-block ml-1.5 -mt-0.5" />
              رقم الهاتف
            </button>
          </div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'email' ? (
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: INK }}>البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@qb.com"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition"
                    style={{ borderColor: LINE, background: '#fff', color: INK }}
                    onFocus={(e) => { e.target.style.borderColor = INK; }}
                    onBlur={(e) => { e.target.style.borderColor = LINE; }}
                  />
                  <Mail className="w-4 h-4 absolute left-3 top-3.5" style={{ color: SOFT }} />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: INK }}>رقم الهاتف</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 5X XXX XXXX"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition"
                    style={{ borderColor: LINE, background: '#fff', color: INK }}
                    onFocus={(e) => { e.target.style.borderColor = INK; }}
                    onBlur={(e) => { e.target.style.borderColor = LINE; }}
                    dir="ltr"
                  />
                  <Phone className="w-4 h-4 absolute left-3 top-3.5" style={{ color: SOFT }} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: INK }}>كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition pr-10"
                  style={{ borderColor: LINE, background: '#fff', color: INK }}
                  onFocus={(e) => { e.target.style.borderColor = INK; }}
                  onBlur={(e) => { e.target.style.borderColor = LINE; }}
                />
                <Lock className="w-4 h-4 absolute right-3 top-3.5" style={{ color: SOFT }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5" style={{ color: SOFT }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 group disabled:opacity-50"
              style={{ background: INK }}
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

          {/* Links */}
          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="font-bold hover:underline" style={{ color: SOFT }}>
              نسيت كلمة المرور؟
            </Link>
            <Link to="/signup" className="font-bold hover:underline" style={{ color: INK }}>
              إنشاء حساب جديد
            </Link>
          </div>

          {/* Demo accounts */}
          <div className="mt-8 pt-4 border-t" style={{ borderColor: LINE }}>
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center gap-2 text-xs mx-auto transition"
              style={{ color: SOFT }}
            >
              {showDemo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showDemo ? 'إخفاء الحسابات التجريبية' : 'حسابات تجريبية للاختبار'}</span>
            </button>

            {showDemo && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  ['admin@qb.com', 'admin123', 'مدير النظام', 'إدارة كاملة'],
                  ['pm@qb.com', 'pm123', 'مدير المشاريع', 'إدارة المشاريع'],
                  ['eng.ahmed@qb.com', 'engineer123', 'مهندس الموقع', 'مراجعة BOQ و QC'],
                  ['accountant@qb.com', 'accountant123', 'محاسب', 'الدفعات والضمانات'],
                  ['contractor@qb.com', 'contractor123', 'مقاول', 'عقد المقاولات'],
                ].map(([demoEmail, demoPassword, label, desc]) => (
                  <button key={demoEmail} type="button"
                    onClick={() => fillDemoAccount(demoEmail, demoPassword)}
                    className="text-right p-2.5 border rounded-xl text-xs transition hover:bg-gray-50"
                    style={{ borderColor: LINE, color: INK }}>
                    <div className="font-bold">{label}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: SOFT }}>{desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;