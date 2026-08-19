import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { confirmDialog, showAlert, toast } from '../utils/alerts';
import { projectsApi } from '../features/projects/projectsApi';
import api from '../api/axios';
import {
  UserPlus, Search, Mail, Shield, RefreshCw,
  Ban, CheckCircle2, X, Eye, EyeOff,
} from 'lucide-react';

const ROLE_LABELS = {
  admin: 'مدير النظام',
  project_manager: 'مدير المشاريع',
  engineer: 'مهندس',
  accountant: 'محاسب',
  contractor: 'مقاول',
};

const ROLE_COLORS = {
  admin: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  project_manager: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  engineer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  accountant: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  contractor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

const usersApi = {
  list: async () => (await api.get('/users')).data.data,
  create: async (data) => (await api.post('/users', data)).data,
  update: async (id, data) => (await api.patch(`/users/${id}`, data)).data,
  resendInvite: async (id) => (await api.post(`/users/${id}/resend-invite`)).data,
};

export const UsersPage = () => {
  const navigate = useNavigate();
  const { userContext } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, projectsData] = await Promise.all([
        usersApi.list(),
        projectsApi.list(1, 500),
      ]);
      setUsers(usersData);
      setProjects(projectsData.data || []);
    } catch {
      showAlert('error', 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    const res = await usersApi.create(data);
    if (res.success) {
      toast('success', 'تم إنشاء المستخدم وإرسال دعوة التفعيل');
      setShowModal(false);
      await loadData();
    } else {
      showAlert('error', 'فشل الإنشاء', res.error?.message || res.message);
    }
  };

  const handleToggleActive = async (user) => {
    const confirmed = await confirmDialog(
      user.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب',
      `هل تريد ${user.is_active ? 'تعطيل' : 'تفعيل'} حساب "${user.full_name}"؟`
    );
    if (!confirmed) return;
    const res = await usersApi.update(user.id, { is_active: !user.is_active });
    if (res.success) {
      toast('success', 'تم تحديث الحالة');
      await loadData();
    } else {
      showAlert('error', 'فشل التحديث', res.error?.message || res.message);
    }
  };

  const handleRoleChange = async (user, role) => {
    const res = await usersApi.update(user.id, { role });
    if (res.success) { toast('success', 'تم تغيير الدور'); await loadData(); }
    else showAlert('error', 'فشل التحديث', res.error?.message || res.message);
  };

  const handleResend = async (user) => {
    const res = await usersApi.resendInvite(user.id);
    if (res.success) toast('success', 'تم إعادة إرسال رابط التفعيل');
    else showAlert('error', 'فشل الإرسال', res.error?.message || res.message);
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PageHeader
        title="إدارة المستخدمين"
        subtitle="إنشاء الحسابات، الأدوار، وصلاحيات المشاريع"
        actions={
          <>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
              <UserPlus className="w-4 h-4" /> مستخدم جديد
            </button>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 rounded-xl px-4 py-2.5 pl-10 text-sm outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
          <div className="text-xs text-slate-500">{filtered.length} مستخدم</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-[11px] text-slate-500 border-b border-slate-800">
                  <th className="px-4 py-3 font-semibold">المستخدم</th>
                  <th className="px-4 py-3 font-semibold">الدور</th>
                  <th className="px-4 py-3 font-semibold">المشاريع</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-300 text-xs">
                          {u.full_name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-xs">{u.full_name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </div>
                          {!u.is_email_verified && (
                            <div className="text-[10px] text-amber-400 mt-0.5">لم يُفعَّل البريد بعد</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {userContext?.role === 'admin' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className={`text-[11px] font-bold border rounded-lg px-2 py-1 bg-slate-800/80 outline-none ${ROLE_COLORS[u.role] || ''}`}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value} className="bg-slate-900 text-slate-200">{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`text-[11px] font-bold border rounded-lg px-2 py-1 ${ROLE_COLORS[u.role] || ''}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-400">
                        {u.project_ids?.length ? `${u.project_ids.length} مشاريع` : (u.role === 'admin' ? 'كل المشاريع' : '—')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${
                        u.is_active
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-slate-400 bg-slate-700/40 border-slate-600/50'
                      }`}>
                        {u.is_active ? 'مفعّل' : 'معطّل'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleResend(u)} title="إعادة إرسال دعوة التفعيل"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleActive(u)} title={u.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          className={`p-1.5 rounded-lg transition ${u.is_active ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                          {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && <CreateUserModal
        projects={projects}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />}
    </div>
  );
};

const CreateUserModal = ({ projects, onClose, onCreate }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('engineer');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleProject = (id) =>
    setSelectedProjects((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);

  const submit = async () => {
    if (!email || !fullName || !password) {
      showAlert('warning', 'أكمل البيانات', 'البريد، الاسم، وكلمة المرور مطلوبة');
      return;
    }
    setSubmitting(true);
    await onCreate({
      email, full_name: fullName, role, password,
      project_ids: selectedProjects.length ? selectedProjects : null,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-white">إنشاء مستخدم جديد</h2>
            <p className="text-xs text-slate-400 mt-1">سيصله بريد برابط لتفعيل الحساب</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الكامل</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسم المستخدم"
              className="w-full bg-slate-800/70 border border-slate-700/70 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com"
              className="w-full bg-slate-800/70 border border-slate-700/70 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الدور</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700/70 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition">
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور المؤقتة</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••"
                  className="w-full bg-slate-800/70 border border-slate-700/70 focus:border-blue-500 rounded-xl px-4 py-2.5 pl-10 text-sm outline-none transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">المشاريع المسموح بالوصول إليها <span className="text-slate-500 font-normal">(اختياري — فارغ = الكل)</span></label>
            <div className="max-h-36 overflow-y-auto border border-slate-700/70 rounded-xl p-2 space-y-1">
              {projects.length === 0 && <div className="text-xs text-slate-500 p-2">لا توجد مشاريع</div>}
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs text-slate-300">
                  <input type="checkbox" checked={selectedProjects.includes(p.id)} onChange={() => toggleProject(p.id)} className="accent-blue-500" />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={submit} disabled={submitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
              <><Shield className="w-4 h-4" /> إنشاء وإرسال الدعوة</>
            )}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};