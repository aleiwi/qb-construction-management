import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { canAccessPage } from '../config/roleAccess';
import api from '../api/axios';
import {
  Building2, Users, ShieldCheck, LogOut, Plus,
  CheckCircle2, AlertTriangle, FileText, Wallet, HardHat, UserCheck, RefreshCw, ArrowLeft, UsersRound, ScrollText, BarChart3, History
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, userContext, logout } = useAuth();
  const permissions = usePermissions();

  const [usersList, setUsersList] = useState([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('engineer');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (permissions.canManageUsers || permissions.isAdmin || permissions.isProjectManager) {
      fetchUsers();
    }
  }, [permissions.role]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const res = await api.post('/users', {
        email: newEmail,
        full_name: newName,
        password: newPassword,
        role: newRole
      });

      if (res.data.success) {
        setFormSuccess(`تم إضافة المستخدم (${newName}) بنجاح!`);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setIsAddingUser(false);
        fetchUsers();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || "فشل إنشاء المستخدم";
      setFormError(msg);
    }
  };

  const getRoleBadge = (roleName) => {
    const roleMap = {
      admin: { label: 'مدير النظام', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
      project_manager: { label: 'مدير مشروع', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      engineer: { label: 'مهندس موقع', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      accountant: { label: 'محاسب مالي', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      contractor: { label: 'مقاول تنفيذ', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    };
    const badge = roleMap[roleName] || { label: roleName, color: 'bg-slate-700 text-slate-300' };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">نظام إدارة المقاولات المتكامل</h1>
              <p className="text-[11px] text-slate-400">لوحة التحكم والمصادقة الموحدة</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                {user?.full_name?.charAt(0)}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-200">{user?.full_name}</div>
                <div className="text-[10px] text-slate-400">{user?.email}</div>
              </div>
              {getRoleBadge(user?.role)}
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Role Custom Banner & Permissions Notice */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-900/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>جلسة موثقة برمز JWT نشط (RBAC Enforced)</span>
              </div>
              <h2 className="text-xl font-bold text-white">مرحباً بك، {user?.full_name}</h2>
              <p className="text-sm text-slate-400 mt-1">
                تصفح الواجهة مخصص تلقائياً بحسب دورك الوظيفي الحالي: <strong className="text-blue-400">{user?.role}</strong>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              <div className={`px-3 py-2 rounded-xl border ${permissions.canManageUsers ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-slate-800/40 border-slate-700/50 text-slate-500'}`}>
                إدارة المستخدمين: {permissions.canManageUsers ? 'متاح' : 'محظور'}
              </div>
              <div className={`px-3 py-2 rounded-xl border ${permissions.canManageProjects ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-slate-800/40 border-slate-700/50 text-slate-500'}`}>
                إدارة المشاريع: {permissions.canManageProjects ? 'متاح' : 'محظور'}
              </div>
              <div className={`px-3 py-2 rounded-xl border ${permissions.canApproveQualityChecks ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-slate-800/40 border-slate-700/50 text-slate-500'}`}>
                فحوص الجودة QC: {permissions.canApproveQualityChecks ? 'متاح' : 'محظور'}
              </div>
              <div className={`px-3 py-2 rounded-xl border ${permissions.canProcessPayments ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-slate-800/40 border-slate-700/50 text-slate-500'}`}>
                المستحقات المالية: {permissions.canProcessPayments ? 'متاح' : 'محظور'}
              </div>
            </div>
          </div>
        </div>

        {/* User Context — linked data based on role */}
        {userContext && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              {userContext.linked_project || `${userContext.total_projects} مشروع`}
            </span>
            {userContext.linked_building && (
              <span className="text-slate-500">{userContext.linked_building}</span>
            )}
            {userContext.linked_contractor && (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" />
                {userContext.linked_contractor.company_name}
              </span>
            )}
            <span className="text-slate-500">{userContext.total_contracts} عقد</span>
          </div>
        )}

        {/* Role-Specific Panels */}

        {/* Contractor Restricted View Notice */}
        {permissions.isContractor && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-6 flex items-start gap-4 text-amber-200">
            <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-300 text-lg">واجهة المقاول المخصصة (Row-Level Security)</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                وفقاً لـ <code className="bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-300">security-conventions.md</code>، بياناتك مفلترة على مستوى الـ Backend برقم عقدك فقط، ولا تظهر بيانات العقود والمستحقات الخاصة بالمقاولين الآخرين.
              </p>
            </div>
          </div>
        )}

        {/* User Management Section (Admin Only) */}
        {permissions.canManageUsers && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">إدارة المستخدمين والصلاحيات (RBAC)</h3>
                  <p className="text-xs text-slate-400">إضافة مستخدمين جدد وتعيين أدوارهم الوظيفية</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchUsers}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  <span>تحديث</span>
                </button>
                <button
                  onClick={() => setIsAddingUser(!isAddingUser)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingUser ? 'إلغاء' : 'إضافة مستخدم جديد'}</span>
                </button>
              </div>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Add User Form */}
            {isAddingUser && (
              <form onSubmit={handleCreateUser} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="م. محمد خالد"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="engineer@qb.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الدور الوظيفي (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 outline-none"
                  >
                    <option value="project_manager">مدير مشروع (Project Manager)</option>
                    <option value="engineer">مهندس موقع (Engineer)</option>
                    <option value="accountant">محاسب مالي (Accountant)</option>
                    <option value="contractor">مقاول تنفيذ (Contractor)</option>
                    <option value="admin">مدير نظام (Admin)</option>
                  </select>
                </div>

                {formError && (
                  <div className="col-span-full text-red-400 text-xs">{formError}</div>
                )}

                <div className="col-span-full flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-500 hover:to-indigo-500 transition shadow-md"
                  >
                    حفظ المستخدم
                  </button>
                </div>
              </form>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">الاسم الكامل</th>
                    <th className="py-3 px-4">البريد الإلكتروني</th>
                    <th className="py-3 px-4">الدور الوظيفي</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">#{u.id}</td>
                      <td className="py-3 px-4 font-semibold text-white">{u.full_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> نشط
                          </span>
                        ) : (
                          <span className="text-red-400 inline-flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> معطل
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature Modules Overview Grid — role-filtered */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { route: '/projects',     icon: Building2,  title: 'وحدة المشاريع والمباني',              desc: 'إدارة المشاريع الإنشائية، تقسيم المباني، تتبع المراحل والأوزان النسبية لكل مرحلة.',           color: 'blue' },
            { route: '/contractors',  icon: HardHat,    title: 'وحدة المقاولين',                     desc: 'إدارة بيانات المقاولين وعقودهم وقيمة كل عقد ونسبة الضمان المحتجز.',                         color: 'amber' },
            { route: '/contracts',    icon: ScrollText, title: 'العقود والتعاقدات',                   desc: 'ربط المقاولين بالمباني، تتبع حالة العقود، قيم العقود ونسب الإنجاز.',                        color: 'emerald' },
            { route: '/drawings',     icon: FileText,   title: 'حصر الكميات BOQ (CAD)',               desc: 'استخراج عناصر DWG/DXF تلقائياً والمراجعة اليدوية للعناصر غير المصنفة.',                     color: 'indigo' },
            { route: '/payments',     icon: Wallet,     title: 'وحدة المستحقات والضمان',              desc: 'الدفعات المرحلية واشتراط مراجعة الجودة QC قبل الصرف.',                                      color: 'purple' },
            { route: '/quality-checks', icon: ShieldCheck, title: 'فحوصات الجودة QC',                  desc: 'فحوصات إلزامية لكل مرحلة قبل اعتماد المستحقات المالية.',                                     color: 'teal' },
            { route: '/employees',    icon: UsersRound, title: 'الموارد البشرية HR',                  desc: 'إدارة الموظفين وسجل الحضور والانصراف والرواتب الشهرية الثابتة.',                              color: 'rose' },
            { route: '/reports',      icon: BarChart3,  title: 'لوحة التقارير و KPIs',                desc: 'مؤشرات الأداء العامة والرسوم البيانية عبر كل الوحدات.',                                       color: 'cyan' },
            { route: '/completion-percentage', icon: FileText, title: 'تقرير نسب الإنجاز الشامل',    desc: 'تقرير دوري (58 بنداً + 9 دفعات) قابل للطباعة والتصدير إلى PDF.',                              color: 'amber' },
            { route: '/audit-logs',   icon: History,    title: 'سجل التتبع (Audit Log)',              desc: 'سجل كامل للعمليات المالية الحساسة — مراجعة شاملة للأمان.',                                    color: 'orange' },
          ]
            .filter(m => canAccessPage(permissions.role, m.route))
            .map((m) => {
              const colorMap = {
                blue: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
                amber: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
                emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                indigo: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
                purple: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
                teal: 'border-teal-500/40 bg-teal-500/10 text-teal-400',
                rose: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
                cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
                orange: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
              };
              const hoverBorder = `hover:border-${m.color}-500/40`;
              return (
                <button key={m.route} onClick={() => navigate(m.route)}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 text-right hover:bg-slate-900/90 transition cursor-pointer group"
                >
                  <div className={`w-10 h-10 ${colorMap[m.color].split(' ').slice(1).join(' ')} rounded-2xl flex items-center justify-center group-hover:opacity-80 transition`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">{m.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                  <div className={`flex items-center gap-1 text-xs font-semibold pt-1 ${colorMap[m.color].split(' ')[2]}`}>
                    <span>فتح الوحدة</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
        </div>

      </main>
    </div>
  );
};
