import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { canAccessPage } from '../config/roleAccess';
import { PageHeader } from '../components/ui/PageHeader';
import {
  Building2, Users, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Wallet, HardHat, ArrowLeft, UsersRound, ScrollText, BarChart3, History, UserCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, userContext } = useAuth();
  const permissions = usePermissions();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PageHeader
        title="نظام إدارة المقاولات المتكامل"
        subtitle="لوحة التحكم والمصادقة الموحدة"
      />

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

        {/* User Management Section (Admin Only) — shortcut to /users */}
        {permissions.canManageUsers && (
          <button
            onClick={() => navigate('/users')}
            className="w-full bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-6 flex items-center gap-4 text-right transition group"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white">إدارة المستخدمين والصلاحيات (RBAC)</h3>
              <p className="text-xs text-slate-400 mt-0.5">إنشاء الحسابات، تعيين الأدوار، وربط المستخدمين بالمشاريع المسموحة</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 shrink-0">
              <span>فتح صفحة المستخدمين</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </span>
          </button>
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
            { route: '/users',        icon: UsersRound, title: 'إدارة المستخدمين',                    desc: 'إنشاء الحسابات بالدعوات، الأدوار، وتعيين المشاريع المسموحة.',                                color: 'blue' },
            { route: '/profile',      icon: UserCircle, title: 'الملف الشخصي',                        desc: 'بيانات حسابك وتغيير كلمة المرور.',                                                         color: 'teal' },
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
