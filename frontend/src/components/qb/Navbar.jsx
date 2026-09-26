import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, 
  FaProjectDiagram, 
  FaCalculator, 
  FaChartLine,
  FaBox,
  FaFileAlt,
  FaBrain,
  FaDollarSign,
  FaCube,
  FaCog,
  FaUserPlus,
  FaSignOutAlt,
  FaRocket,
  FaBars,
  FaTimes,
  FaSignInAlt,
  FaUserCircle,
  FaUserCheck,
  FaLock,
  FaUser,
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: FaHome },
    { path: '/dashboard', label: 'لوحة التحكم', icon: FaChartLine },
    { path: '/cost-calculator', label: 'حاسبة التكاليف', icon: FaCalculator },
    { path: '/ai-center', label: 'المركز الذكي', icon: FaBrain },
    { path: '/cost-monitor', label: 'مراقبة التكاليف', icon: FaDollarSign },
    { path: '/materials', label: 'إدارة المواد', icon: FaCube },
    { path: '/cad-analyzer', label: 'محلل CAD', icon: FaRocket },
    { path: '/materials', label: 'المواد', icon: FaBox },
    { path: '/reports', label: 'التقارير', icon: FaFileAlt },
  ];



  const isActive = (path) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // إغلاق القائمة عند النقر على عنصر
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  // وظيفة تسجيل الخروج
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      toast.error('❌ حدث خطأ في تسجيل الخروج');
    }
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="navbar-quantum sticky top-0 z-50"
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* شعار المشروع */}
            <Link 
              to="/" 
              className="flex items-center space-x-3 group hover-scale order-1"
              onClick={handleNavClick}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-primary-600 to-accent-600 p-2 rounded-lg">
                  <FaRocket className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <h1 className="text-xl sm:text-2xl-ar font-display font-bold text-quantum">
                  QUANTUM BUILD
                </h1>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-body">
                  منصة البناء الذكية
                </p>
              </div>
            </Link>

          {/* قائمة التنقل الرئيسية */}
            <div className="hidden lg:flex items-center space-x-1 order-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`
                      relative group flex items-center px-3 py-2 rounded-lg text-sm-ar font-medium
                      transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500
                      ${
                        active
                          ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow border border-primary-500/30'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-700 dark:hover:text-primary-300'
                      }
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    {/* تأثير الخلفية المتحرك */}
                    {active && (
                      <motion.div
                        layoutId="navbar-active-tab"
                        className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-lg border border-primary-200 dark:border-primary-700"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <Icon className={`h-4 w-4 ml-2 transition-colors ${
                      active ? 'text-white' : 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    }`} />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* المصادقة - عرض مختلف للمستخدم المسجل دخول */}
          <div className="hidden lg:flex items-center space-x-3 space-x-reverse order-4">
            {/* زر تبديل الثيم لسطح المكتب بجانب البروفايل */}
            <ThemeToggle />

            {loading ? (
              // حالة التحميل
              <div className="animate-pulse">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ) : user ? (
              // المستخدم مسجل دخول - عرض أيقونة البروفايل
              <Link
                to="/profile"
                className="group relative flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="الملف الشخصي"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                >
                  <FaUser className="h-5 w-5" />
                </motion.div>
                
                {/* tooltip عند hover */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  الملف الشخصي
                </div>
              </Link>
            ) : (
              // المستخدم غير مسجل دخول - عرض أيقونة تسجيل الدخول
              <Link
                to="/login"
                className="group relative flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="تسجيل الدخول - اذهب لصفحة المصادقة"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                >
                  <FaLock className="h-5 w-5" />
                </motion.div>
                
                {/* tooltip عند hover */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  تسجيل الدخول
                </div>
              </Link>
            )}
          </div>

          {/* أدوات التحكم (الثيم للجوال + قائمة الموبايل) */}
            <div className="flex items-center space-x-2 sm:space-x-4 order-3">
            {/* زر تبديل الثيم للجوال فقط */}
            <div className="lg:hidden">
              <ThemeToggle />
            </div>

            {/* الملف الشخصي - مُحذوف لأن المستخدم غير مسجل دخول */}

              {/* زر همبرغر - الشاشات الصغيرة فقط */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                aria-expanded={isMobileMenuOpen}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FaTimes className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FaBars className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* القائمة الجانبية للأجهزة المحمولة */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* خلفية داكنة */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            
            {/* القائمة الجانبية */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 lg:hidden shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* رأس القائمة */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-2 rounded-lg">
                      <FaRocket className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-quantum">QUANTUM BUILD</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">منصة البناء الذكية</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="إغلاق القائمة"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>

                {/* عناصر القائمة */}
                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="px-4 space-y-2" role="navigation">
                    {navItems.map((item, index) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            to={item.path}
                            onClick={handleNavClick}
                            className={`
                              group flex items-center px-4 py-3 rounded-lg text-sm-ar font-medium
                              transition-all duration-300
                              ${
                                active
                                  ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow border border-primary-500/30'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-700 dark:hover:text-primary-300'
                              }
                            `}
                            aria-current={active ? 'page' : undefined}
                          >
                            <Icon className={`h-5 w-5 ml-3 ${
                              active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                            }`} />
                            <span className="text-base">{item.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </nav>

                  {/* فاصل للمصادقة */}
                  <div className="px-4 mt-6 mb-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      المصادقة
                    </p>
                  </div>

                  {/* روابط المصادقة للموبايل - تصميم محسّن */}
                  <nav className="px-4 space-y-3" role="navigation">
                    {loading ? (
                      // حالة التحميل للموبايل
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: navItems.length * 0.1 }}
                      >
                        <div className="animate-pulse">
                          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        </div>
                      </motion.div>
                    ) : user ? (
                      // المستخدم مسجل دخول - عرض ملفك الشخصي وخيارات إضافية
                      <>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: navItems.length * 0.1 }}
                        >
                          <Link
                            to="/profile"
                            onClick={handleNavClick}
                            className="flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white mr-4 group-hover:scale-110 transition-transform">
                              <FaUser className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-base">الملف الشخصي</div>
                              <div className="text-sm text-green-600 dark:text-green-400">مرحباً {user.user_metadata?.full_name || user.email}</div>
                            </div>
                          </Link>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navItems.length + 1) * 0.1 }}
                        >
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/30 transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white mr-4 group-hover:scale-110 transition-transform">
                              <FaSignOutAlt className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-base">تسجيل الخروج</div>
                              <div className="text-sm text-red-600 dark:text-red-400">خروج آمن من الحساب</div>
                            </div>
                          </button>
                        </motion.div>
                      </>
                    ) : (
                      // المستخدم غير مسجل دخول - عرض تسجيل الدخول وإنشاء حساب
                      <>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: navItems.length * 0.1 }}
                        >
                          <Link
                            to="/login"
                            onClick={handleNavClick}
                            className="flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mr-4 group-hover:scale-110 transition-transform">
                              <FaSignInAlt className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-base">تسجيل الدخول</div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">للحسابات الموجودة</div>
                            </div>
                          </Link>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navItems.length + 1) * 0.1 }}
                        >
                          <Link
                            to="/register"
                            onClick={handleNavClick}
                            className="flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white mr-4 group-hover:scale-110 transition-transform">
                              <FaUserPlus className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-base">إنشاء حساب جديد</div>
                              <div className="text-sm text-green-600 dark:text-green-400">انضم إلينا مجاناً</div>
                            </div>
                          </Link>
                        </motion.div>
                      </>
                    )}
                  </nav>
                </div>

                {/* أدوات التحكم السفلية */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  {/* تم إزالة الإعدادات - غير ضروري للمستخدم غير المسجل دخول */}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>

  );
};

export default Navbar;