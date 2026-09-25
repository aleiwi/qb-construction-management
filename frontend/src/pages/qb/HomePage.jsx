import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCalculator, FaChartBar, FaBox, FaFileAlt, FaCog, 
  FaArrowLeft, FaArrowRight, FaShieldAlt, 
  FaRocket, FaBrain, FaDatabase, FaCheckCircle,
  FaInfinity, FaCogs, FaLock, FaSun, FaMoon,
} from 'react-icons/fa';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';

const HomePage = () => {
  const features = [
    {
      icon: <FaCalculator />,
      title: 'محلل الأوتوكاد المتطور',
      description: 'استخراج الأبعاد والمساحات تلقائياً من ملفات DXF وPDF والصور باستخدام الذكاء الاصطناعي',
      link: '/cad-analyzer',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      isNew: true,
    },
    { 
      icon: <FaBrain />,
      title: 'محرك الحسابات الذكي',
      description: 'معادلات معقدة ومتطورة حسب المعايير السعودية مع فحص الأمان التلقائي',
      link: '/calculator',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      icon: <FaChartBar />,
      title: 'لوحة التحكم الشاملة',
      description: 'تتبع جميع مشاريعك وإحصائياتك في مكان واحد مع واجهة تفاعلية متقدمة',
      link: '/dashboard',
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      icon: <FaBox />,
      title: 'إدارة المواد الذكية',
      description: 'قاعدة بيانات شاملة للمواد مع تتبع الأسعار وتحديثات السوق تلقائياً',
      link: '/materials',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    },
    {
      icon: <FaFileAlt />,
      title: 'تقارير احترافية',
      description: 'إنشاء تقارير PDF وExcel احترافية قابلة للتخصيص مع التحليلات المتقدمة',
      link: '/reports',
      color: 'bg-gradient-to-r from-red-500 to-red-600'
    },
    {
      icon: <FaCog />,
      title: 'إعدادات قابلة للتخصيص',
      description: 'خصص تجربتك في المنصة، من إعدادات الحساب الافتراضية إلى مظهر الواجهة واللغة.',
      link: '/settings',
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <div className="space-y-8 sm:space-y-12 md:space-y-16 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle Button */}
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-gray-800 dark:via-gray-900 dark:to-black text-white rounded-xl md:rounded-2xl overflow-hidden mt-16 sm:mt-20">
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight px-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Quantum Build
                </span>
                <br />
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">منصة البناء الذكية الثورية</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-primary-100 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
                أول نظام ذكي متكامل يستخدم الذكاء الاصطناعي لتحليل ملفات الأوتوكاد وحساب التكاليف بدقة احترافية
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 px-4">
              <Link
                to="/calculator"
                className="group bg-white dark:bg-gray-100 text-primary-700 dark:text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-100 dark:hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
              >
                <span className="flex items-center justify-center gap-2">
                  ابدأ الحسابات الآن
                  <FaCalculator className="group-hover:rotate-12 transition-transform text-lg sm:text-xl" />
                </span>
              </Link>
              
              <Link
                to="/cad-analyzer"
                className="group border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white dark:hover:bg-gray-100 hover:text-primary-700 dark:hover:text-gray-800 transition-all duration-300 transform hover:scale-105 text-center"
              >
                <span className="flex items-center justify-center gap-2">
                  <FaBrain className="group-hover:pulse text-lg sm:text-xl" />
                  جرب محلل الأوتوكاد
                  <FaBrain className="group-hover:pulse text-lg sm:text-xl" />
                </span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-orange-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Features Section */}
      <div className="px-2 sm:px-0">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-gray-800 text-primary-700 dark:text-primary-400 rounded-full px-3 sm:px-4 py-2 mb-3 sm:mb-4">
            <FaCogs className="text-xs sm:text-sm" />
            <span className="text-xs sm:text-sm font-medium">المميزات المتقدمة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-3 md:mb-4 px-4">أدوات احترافية لكل مرحلة</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            منصة متكاملة تضم أحدث التقنيات والأدوات المتطورة لمساعدتك في إدارة مشاريعك بكفاءة عالية
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-0">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl dark:shadow-gray-900/50 transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-500 transform hover:-translate-y-1"
            >
              <div className="p-5 sm:p-6 md:p-8 flex flex-col items-center text-center">
                <div className="relative mb-4 md:mb-6">
                  <div className={`${feature.color} w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <div className="text-2xl sm:text-3xl md:text-4xl">
                      {feature.icon}
                    </div>
                  </div>
                  {feature.isNew && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                      جديد
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 md:mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-3 md:mb-4 overflow-hidden" 
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 3,
                     WebkitBoxOrient: 'vertical'
                   }}>
                  {feature.description}
                </p>
                
                <div className="flex items-center text-primary-600 dark:text-primary-400 font-semibold group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors text-sm sm:text-base">
                  <span>استكشف الميزة</span>
                  <FaArrowLeft className="mr-2 group-hover:translate-x-1 transition-transform text-sm" />
                </div>
              </div>
              
              {/* Gradient overlay on hover */}
              <div className="h-1 bg-gradient-to-r from-transparent via-primary-200 dark:via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          ))}
        </div>
      </div>

      {/* Technology & Standards Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl p-5 sm:p-6 md:p-8 lg:p-12 mx-2 sm:mx-0">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-gray-800 text-primary-700 dark:text-primary-400 rounded-full px-3 sm:px-4 py-2 mb-3 sm:mb-4">
            <FaDatabase className="text-xs sm:text-sm" />
            <span className="text-xs sm:text-sm font-medium">التقنيات المتقدمة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-3 md:mb-4 px-4">مدعوم بأحدث التقنيات</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            نستخدم أحدث تقنيات الذكاء الاصطناعي والحسابات المتطورة لضمان الدقة والجودة
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 text-center shadow-md hover:shadow-lg dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-3 md:mb-4">
              <FaBrain className="text-lg sm:text-xl md:text-2xl" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1 md:mb-2 text-sm sm:text-base">الذكاء الاصطناعي</h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">تحليل تلقائي للملفات واستخراج البيانات</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 text-center shadow-md hover:shadow-lg dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-3 md:mb-4">
              <FaShieldAlt className="text-lg sm:text-xl md:text-2xl" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1 md:mb-2 text-sm sm:text-base">المعايير السعودية</h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">حسابات مطابقة للكود السعودي</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 text-center shadow-md hover:shadow-lg dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-3 md:mb-4">
              <FaDatabase className="text-lg sm:text-xl md:text-2xl" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1 md:mb-2 text-sm sm:text-base">قاعدة بيانات شاملة</h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">أسعار محدثة للمواد والمواصفات</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 text-center shadow-md hover:shadow-lg dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white mx-auto mb-3 md:mb-4">
              <FaLock className="text-lg sm:text-xl md:text-2xl" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1 md:mb-2 text-sm sm:text-base">أمان عالي</h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">حماية متقدمة لبياناتك ومشاريعك</p>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <FaFileAlt className="text-base sm:text-lg md:text-xl" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">تحليل الملفات المتطور</h3>
            </div>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                دعم ملفات DXF و PDF
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                استخراج الأبعاد التلقائي
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                معالجة الصور والملفات
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <FaCalculator className="text-base sm:text-lg md:text-xl" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">حسابات دقيقة</h3>
            </div>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                معادلات معقدة ومتطورة
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                فحص الأمان التلقائي
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                توصيات ذكية
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <FaChartBar className="text-base sm:text-lg md:text-xl" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">تقارير احترافية</h3>
            </div>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                تصدير PDF و Excel
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                رسوم بيانية تفاعلية
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                تحليلات متقدمة
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-gray-800 dark:via-gray-900 dark:to-black rounded-xl md:rounded-2xl overflow-hidden mx-2 sm:mx-0">
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 mb-4 sm:mb-6">
              <FaRocket className="text-yellow-400 text-sm sm:text-base" />
              <span className="text-xs sm:text-sm font-medium">ابدأ رحلتك اليوم</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2">
              جاهز لثورة في طريقة حساب التكاليف؟
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-primary-100 dark:text-gray-300 leading-relaxed px-4">
              انضم إلى الجيل الجديد من المهندسين والمقاولين الذين يعتمدون على الذكاء الاصطناعي 
              لتوفير الوقت وزيادة الدقة
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8 sm:mb-10 px-4">
              {/* زر إنشاء حساب - تصميم محسّن */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/register"
                  className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-green-500/25 w-full sm:w-auto text-center overflow-hidden"
                >
                  {/* خلفية متحركة */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
                  
                  {/* محتوى الزر */}
                  <span className="relative flex items-center justify-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                      <FaInfinity className="group-hover:rotate-180 transition-transform duration-500 text-lg" />
                    </div>
                    <span>ابدأ مجاناً الآن</span>
                  </span>
                </Link>
              </motion.div>
              
              {/* زر تسجيل الدخول - تصميم محسّن */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/login"
                  className="group relative border-3 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto text-center overflow-hidden"
                >
                  {/* خلفية متحركة */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
                  
                  {/* محتوى الزر */}
                  <span className="relative flex items-center justify-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                      <FaArrowLeft className="group-hover:translate-x-1 transition-transform duration-200 text-sm" />
                    </div>
                    <span>تسجيل الدخول</span>
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-orange-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
    </div>
  );
};

export default HomePage;