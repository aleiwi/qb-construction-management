import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Building2, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen" style={{ background: '#fff', color: INK }} dir="rtl">
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">

          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ background: INK }}>
            <Building2 className="w-7 h-7" style={{ color: '#c9a24b' }} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: HEAD }}>تفعيل الحساب</h1>
          <p className="text-sm mb-8" style={{ color: SOFT }}>جارٍ التحقق من رابط التفعيل</p>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8 rounded-2xl border" style={{ borderColor: LINE, background: '#f9fafb' }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: INK }} />
              <p className="text-sm" style={{ color: SOFT }}>جارٍ تفعيل الحساب...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="p-6 flex items-start gap-3 text-sm text-right rounded-xl animate-fade-in" style={{ background: OK_BG, border: `1px solid ${OK_BC}`, color: OK_TX }}>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">تم التفعيل بنجاح</p>
                <p>{message}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-6 flex items-start gap-3 text-sm text-right rounded-xl animate-fade-in" style={{ background: ERR_BG, border: `1px solid ${ERR_BC}`, color: ERR_TX }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">تعذر التفعيل</p>
                <p>{message}</p>
              </div>
            </div>
          )}

          {status !== 'loading' && (
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full text-white font-bold py-3 rounded-xl transition hover:shadow-card inline-flex items-center justify-center gap-2"
              style={{ background: INK }}
            >
              <ArrowLeft className="w-4 h-4" />
              الذهاب إلى تسجيل الدخول
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
