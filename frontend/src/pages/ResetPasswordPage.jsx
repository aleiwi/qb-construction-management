import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Building2, Lock, AlertCircle, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-react';

const HEAD = "'Cairo','Tajawal',sans-serif";
const INK = '#0e1b2c';
const SOFT = '#5a6b7b';
const LINE = 'rgba(14,27,44,0.12)';
const ERR_BG = '#fef2f2';
const ERR_BC = '#fecaca';
const ERR_TX = '#991b1b';
const OK_BG = '#f0fdf4';
const OK_BC = '#bbf7d0';
const OK_TX = '#166534';

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
      await api.post('/auth/reset-password', { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'الرابط غير صالح أو منتهي الصلاحية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#fff', color: INK }} dir="rtl">
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ background: INK }}>
              <KeyRound className="w-7 h-7" style={{ color: '#c9a24b' }} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: HEAD }}>تعيين كلمة مرور جديدة</h1>
            <p className="text-sm mt-2" style={{ color: SOFT }}>أدخل كلمة المرور الجديدة (8 أحرف على الأقل)</p>
          </div>

          {error && (
            <div className="mb-5 p-4 flex items-start gap-3 text-sm rounded-xl" style={{ background: ERR_BG, border: `1px solid ${ERR_BC}`, color: ERR_TX }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {done ? (
            <div className="p-6 flex items-start gap-3 text-sm rounded-xl animate-fade-in" style={{ background: OK_BG, border: `1px solid ${OK_BC}`, color: OK_TX }}>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">تم تحديث كلمة المرور بنجاح</p>
                <p>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
                <button onClick={() => navigate('/login')} className="mt-4 w-full text-white font-bold py-2.5 rounded-xl transition" style={{ background: INK }}>
                  الذهاب لتسجيل الدخول
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: INK }}>كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition pr-10"
                    style={{ borderColor: LINE, background: '#fff', color: INK }}
                    onFocus={(e) => { e.target.style.borderColor = INK; }}
                    onBlur={(e) => { e.target.style.borderColor = LINE; }}
                  />
                  <Lock className="w-4 h-4 absolute right-3 top-3.5" style={{ color: SOFT }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: INK }}>تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition pr-10"
                    style={{ borderColor: LINE, background: '#fff', color: INK }}
                    onFocus={(e) => { e.target.style.borderColor = INK; }}
                    onBlur={(e) => { e.target.style.borderColor = LINE; }}
                  />
                  <Lock className="w-4 h-4 absolute right-3 top-3.5" style={{ color: SOFT }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-card"
                style={{ background: INK }}
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
            <button onClick={() => navigate('/login')} className="text-sm font-bold hover:underline inline-flex items-center gap-1.5" style={{ color: SOFT }}>
              <ArrowLeft className="w-3.5 h-3.5" />
              العودة إلى تسجيل الدخول
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
