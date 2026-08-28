import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { showAlert, toast } from '../utils/alerts';
import api from '../api/axios';
import { User, Mail, Shield, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

const ROLE_LABELS = {
  admin: 'مدير النظام',
  project_manager: 'مدير المشاريع',
  engineer: 'مهندس',
  accountant: 'محاسب',
  contractor: 'مقاول',
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userContext } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showAlert('warning', 'كلمة المرور ضعيفة', 'يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('warning', 'عدم تطابق', 'كلمتا المرور غير متطابقتين');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (res.data.success) {
        toast('success', 'تم تغيير كلمة المرور بنجاح');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      }
    } catch (err) {
      showAlert('error', 'فشل التغيير', err.response?.data?.error?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="الملف الشخصي"
        subtitle="بياناتك وتغيير كلمة المرور"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold text-sm mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" /> بيانات الحساب
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">البريد الإلكتروني</div>
                <div className="text-sm font-bold">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">الاسم الكامل</div>
                <div className="text-sm font-bold">{user?.full_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">الدور</div>
                <div className="text-sm font-bold">{ROLE_LABELS[userContext?.role] || userContext?.role}</div>
              </div>
            </div>
            {userContext?.role !== 'admin' && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">المشاريع المسموح بها</div>
                  <div className="text-sm font-bold">
                    {userContext?.allowed_project_ids?.length
                      ? `${userContext.allowed_project_ids.length} مشاريع`
                      : 'لا يوجد وصول لمشاريع — راجع مدير النظام'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold text-sm mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" /> تغيير كلمة المرور
          </h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور الحالية</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700/70 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
            </div>
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور الجديدة</label>
              <input type={showPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700/70 focus:border-blue-500 rounded-xl px-4 py-2.5 pl-10 text-sm outline-none transition" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 bottom-2.5 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تأكيد كلمة المرور الجديدة</label>
              <input type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700/70 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <><Lock className="w-4 h-4" /> تحديث كلمة المرور</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};