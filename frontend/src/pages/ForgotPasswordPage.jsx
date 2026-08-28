import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Building2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

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

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'حدث خطأ، حاول مرة أخرى');
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
              <Building2 className="w-7 h-7" style={{ color: '#c9a24b' }} strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: HEAD }}>استعادة كلمة المرور</h1>
            <p className="text-sm mt-2" style={{ color: SOFT }}>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
          </div>

          {error && (
            <div className="mb-5 p-4 flex items-start gap-3 text-sm rounded-xl" style={{ background: ERR_BG, border: `1px solid ${ERR_BC}`, color: ERR_TX }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {sent ? (
            <div className="p-6 flex items-start gap-3 text-sm rounded-xl animate-fade-in" style={{ background: OK_BG, border: `1px solid ${OK_BC}`, color: OK_TX }}>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">تم إرسال الرابط</p>
                <p className="leading-relaxed">إذا كان البريد مسجلاً لدينا، ستصل رسالة إعادة التعيين خلال دقائق. تحقق من صندوق الوارد وبريد المهملات.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 group disabled:opacity-50 hover:shadow-card"
                style={{ background: INK }}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>إرسال رابط الاستعادة</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-bold hover:underline inline-flex items-center gap-1.5" style={{ color: SOFT }}>
              <ArrowLeft className="w-3.5 h-3.5" />
              العودة إلى تسجيل الدخول
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
