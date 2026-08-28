import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, FolderKanban, FileImage, UploadCloud,
  ListChecks, ShieldCheck, TrendingUp, FileSignature, Wallet, BookOpen,
  HardHat, BarChart3, UsersRound, UserCog, History, Menu, X, ChevronDown,
  UserCircle, LogOut, PieChart,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { canAccessPage } from '../config/roleAccess';

const ROLE_LABELS = {
  admin: 'مدير النظام',
  project_manager: 'مدير مشروع',
  engineer: 'مهندس موقع',
  accountant: 'محاسب مالي',
  contractor: 'مقاول تنفيذ',
};

const NAV_GROUPS = [
  {
    label: 'الرئيسية',
    items: [{ path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard }],
  },
  {
    label: 'المشاريع',
    items: [
      { path: '/projects', label: 'المشاريع', icon: FolderKanban },
      { path: '/drawings', label: 'المخططات', icon: FileImage },
      { path: '/drawings/batch', label: 'رفع دفعة', icon: UploadCloud },
      { path: '/boq-review', label: 'مراجعة BOQ', icon: ListChecks },
      { path: '/boq-analytics', label: 'تحليلات BOQ', icon: PieChart },
      { path: '/quality-checks', label: 'فحوصات الجودة', icon: ShieldCheck },
      { path: '/completion-percentage', label: 'نسبة الإنجاز', icon: TrendingUp },
    ],
  },
  {
    label: 'المالية',
    items: [
      { path: '/contracts', label: 'العقود', icon: FileSignature },
      { path: '/payments', label: 'المدفوعات', icon: Wallet },
      { path: '/price-library', label: 'بنك الأسعار', icon: BookOpen },
      { path: '/contractors', label: 'المقاولون', icon: HardHat },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { path: '/reports', label: 'التقارير', icon: BarChart3 },
      { path: '/employees', label: 'الموظفون', icon: UsersRound },
      { path: '/users', label: 'المستخدمون', icon: UserCog },
      { path: '/audit-logs', label: 'سجل التدقيق', icon: History },
    ],
  },
];

const ROLE_BADGE_COLORS = {
  admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  project_manager: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  engineer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accountant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  contractor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  const role = user?.role;
  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => canAccessPage(role, item.path)) }))
    .filter((group) => group.items.length > 0);

  const NavLinkItem = ({ item, onClick }) => (
    <NavLink
      to={item.path}
      end
      onClick={onClick}
      className={({ isActive: active }) =>
        `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
          active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-500'
            : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
        }`
      }
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        {/* Premium gold accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 ring-1 ring-white/10">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block min-w-0">
              <h1 className="text-base font-extrabold text-white leading-tight truncate" style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}>نظام إدارة المقاولات المتكامل</h1>
              <p className="text-[11px] text-slate-400 truncate font-medium tracking-wide">بوابة المشاريع والصلاحيات الموحدة</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleGroups.map((group) => (
              <div key={group.label} className="relative group flex items-center">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition">
                  <span>{group.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                </button>
                <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="min-w-48 bg-slate-900 border border-slate-700/70 rounded-2xl p-2 shadow-2xl shadow-black/50">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500">{group.label}</div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavLinkItem key={item.path} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </nav>

          {/* Right side: user chip */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className={`flex items-center gap-2.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border transition ${
                  userMenuOpen ? 'border-blue-500/40' : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                  {user?.full_name?.charAt(0) || '؟'}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-200 leading-tight">{user?.full_name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate max-w-32">{user?.email}</div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700/70 rounded-2xl p-2 shadow-2xl shadow-black/50 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="text-sm font-bold text-white">{user?.full_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${ROLE_BADGE_COLORS[role] || 'bg-slate-700 text-slate-300'}`}>
                        {ROLE_LABELS[role] || role}
                      </span>
                    </div>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>الملف الشخصي</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-xl transition"
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md max-h-[70vh] overflow-y-auto animate-fade-in">
            <div className="px-4 py-3 space-y-3">
              {visibleGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-500">{group.label}</div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavLinkItem key={item.path} item={item} onClick={() => setMobileOpen(false)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;