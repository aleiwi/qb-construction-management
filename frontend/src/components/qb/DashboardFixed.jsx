import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChartLine,
  FaProjectDiagram,
  FaBox,
  FaFileAlt,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaTools,
  FaRocket,
  FaAtom,
  FaCrown,
  FaFire,
  FaStar,
  FaGem,
  FaCalculator,
  FaHome,
  FaSync
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI, getClient } from '../../utils/qb/api';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCost: 0,
    activeProjects: 0,
    completedProjects: 0,
    monthlyRevenue: 0,
    pendingProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!authLoading) {
      setIsAuthenticated(!!user);
    }
  }, [user, authLoading]);

  // جلب البيانات
  const fetchData = async () => {
    if (!user) {
      console.log('⚠️ المستخدم غير مسجل دخول');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 جاري جلب المشاريع...', user.id);
      
      
      
      // جلب المشاريع للمستخدم الحالي
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('خطأ في جلب المشاريع:', projectsError);
        throw new Error(`فشل في جلب المشاريع: ${projectsError.message}`);
      }

      console.log('✅ تم جلب المشاريع:', projectsData?.length || 0, 'مشروع');
      
      // حساب الإحصائيات
      const fetchedProjects = projectsData || [];
      const totalProjects = fetchedProjects.length;
      const completedProjects = fetchedProjects.filter(p => p.status === 'Completed').length;
      const activeProjects = fetchedProjects.filter(p => p.status === 'In Progress').length;
      const pendingProjects = fetchedProjects.filter(p => p.status === 'Planning').length;
      const totalCost = fetchedProjects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
      const monthlyRevenue = totalCost * 0.15; // نسبة ربح استرشادية

      setProjects(fetchedProjects.slice(0, 5)); // أحدث 5 مشاريع
      setStats({ 
        totalProjects, 
        totalCost, 
        activeProjects, 
        completedProjects, 
        monthlyRevenue,
        pendingProjects
      });
      
      console.log('✅ تم تحديث الإحصائيات بنجاح');
    } catch (error) {
      console.error("❌ خطأ في جلب المشاريع:", error);
      
      const errorMessage = error.message || 'خطأ غير معروف';
      
      Swal.fire({
        icon: 'error',
        title: 'خطأ في الاتصال',
        text: `فشل في جلب بيانات المشاريع: ${errorMessage}`,
        confirmButtonText: 'حسناً',
        footer: 'تحقق من اتصال الإنترنت وإعدادات قاعدة البيانات'
      });
      
      // في حالة الخطأ، استخدم بيانات وهمية للعرض
      setProjects([]);
      setStats({
        totalProjects: 0,
        totalCost: 0,
        activeProjects: 0,
        completedProjects: 0,
        monthlyRevenue: 0,
        pendingProjects: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // بيانات الرسوم البيانية
  const getMonthlyData = () => {
    if (projects.length === 0) {
      return [
        { name: 'يناير', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'فبراير', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'مارس', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'أبريل', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'مايو', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'يونيو', المشاريع: 0, الإيرادات: 0, التكاليف: 0 }
      ];
    }
    
    const monthlyStats = {};
    
    projects.forEach(project => {
      const month = project.created_at ? 
        new Date(project.created_at).toLocaleDateString('ar-SA', { month: 'long' }) : 
        new Date().toLocaleDateString('ar-SA', { month: 'long' });
      
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          name: month,
          المشاريع: 0,
          الإيرادات: 0,
          التكاليف: 0
        };
      }
      
      monthlyStats[month].المشاريع += 1;
      monthlyStats[month].الإيرادات += (project.estimated_cost || 0) * 1.2;
      monthlyStats[month].التكاليف += (project.estimated_cost || 0);
    });
    
    const monthsOrder = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    return monthsOrder.map(month => monthlyStats[month] || {
      name: month,
      المشاريع: 0,
      الإيرادات: 0,
      التكاليف: 0
    });
  };

  const getProjectStatusData = () => {
    const statusCount = {
      'قيد التنفيذ': 0,
      'مكتمل': 0,
      'تخطيط': 0,
      'معلق': 0
    };
    
    projects.forEach(project => {
      const status = project.status || 'Planning';
      const statusKey = statusConfig[status]?.label || 'تخطيط';
      statusCount[statusKey]++;
    });
    
    return [
      { name: 'قيد التنفيذ', value: statusCount['قيد التنفيذ'], color: '#3b82f6' },
      { name: 'مكتمل', value: statusCount['مكتمل'], color: '#10b981' },
      { name: 'تخطيط', value: statusCount['تخطيط'], color: '#f59e0b' },
      { name: 'معلق', value: statusCount['معلق'], color: '#ef4444' }
    ];
  };

  const handleDelete = async (projectId) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن هذا الإجراء!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      try {
        
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)
          .eq('user_id', user.id); // التأكد من أن المستخدم يحذف مشروعه فقط

        if (error) throw error;

        Swal.fire('تم الحذف!', 'تم حذف المشروع بنجاح.', 'success');
        fetchData();
      } catch (error) {
        console.error('خطأ في حذف المشروع:', error);
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل في حذف المشروع'
        });
      }
    }
  };

  const statusConfig = {
    'Planning': { 
      label: 'تخطيط', 
      color: 'bg-warning-100 text-warning-800 border-warning-200',
      icon: FaClock
    },
    'تخطيط': { 
      label: 'تخطيط', 
      color: 'bg-warning-100 text-warning-800 border-warning-200',
      icon: FaClock
    },
    'In Progress': { 
      label: 'قيد التنفيذ', 
      color: 'bg-primary-100 text-primary-800 border-primary-200',
      icon: FaRocket
    },
    'قيد التنفيذ': { 
      label: 'قيد التنفيذ', 
      color: 'bg-primary-100 text-primary-800 border-primary-200',
      icon: FaRocket
    },
    'Completed': { 
      label: 'مكتمل', 
      color: 'bg-success-100 text-success-800 border-success-200',
      icon: FaCheckCircle
    },
    'مكتمل': { 
      label: 'مكتمل', 
      color: 'bg-success-100 text-success-800 border-success-200',
      icon: FaCheckCircle
    },
    'On Hold': { 
      label: 'معلق', 
      color: 'bg-danger-100 text-danger-800 border-danger-200',
      icon: FaExclamationTriangle
    },
    'معلق': { 
      label: 'معلق', 
      color: 'bg-danger-100 text-danger-800 border-danger-200',
      icon: FaExclamationTriangle
    }
  };

  // حالة تحميل المصادقة
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-quantum w-32 h-32" />
      </div>
    );
  }

  // حالة عدم تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FaHome className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-700">يجب تسجيل الدخول أولاً</h2>
        <p className="text-gray-500 text-center">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
        <Link to="/login">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            تسجيل الدخول
          </button>
        </Link>
      </div>
    );
  }

  // حالة تحميل البيانات
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-quantum w-32 h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl-ar font-display font-bold text-quantum mb-2">
            لوحة التحكم الذكية
          </h1>
          <p className="text-lg-ar text-gray-600 dark:text-gray-400 font-body">
            نظرة شاملة على مشاريعك وأدائك
          </p>
          <div className="flex items-center gap-2 mt-2">
            <FaStar className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              مرحباً {user?.email || 'بك'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FaSync className="h-4 w-4" />
            تحديث البيانات
          </button>
          
          <Link to="/calculator">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
              <FaPlus className="h-4 w-4" />
              مشروع جديد
            </button>
          </Link>
        </div>
      </motion.div>

      {/* بطاقات الإحصائيات */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
      >
        {[
          {
            title: 'إجمالي المشاريع',
            value: stats.totalProjects,
            icon: FaProjectDiagram,
            color: 'from-primary-500 to-primary-700',
            change: '+12%',
            trending: 'up'
          },
          {
            title: 'قيد التنفيذ',
            value: stats.activeProjects,
            icon: FaRocket,
            color: 'from-accent-500 to-accent-700',
            change: '+8%',
            trending: 'up'
          },
          {
            title: 'مكتملة',
            value: stats.completedProjects,
            icon: FaCheckCircle,
            color: 'from-success-500 to-success-700',
            change: '+23%',
            trending: 'up'
          },
          {
            title: 'إجمالي التكاليف',
            value: `${(stats.totalCost / 1000000).toFixed(1)}م ريال`,
            icon: FaMoneyBillWave,
            color: 'from-purple-500 to-purple-700',
            change: '+15%',
            trending: 'up'
          },
          {
            title: 'الإيرادات الشهرية',
            value: `${(stats.monthlyRevenue / 1000).toFixed(0)}ك ريال`,
            icon: FaArrowUp,
            color: 'from-emerald-500 to-emerald-700',
            change: '+18%',
            trending: 'up'
          },
          {
            title: 'في الانتظار',
            value: stats.pendingProjects,
            icon: FaClock,
            color: 'from-orange-500 to-orange-700',
            change: '-5%',
            trending: 'down'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trending === 'up' ? FaArrowUp : FaArrowDown;
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm-ar font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl-ar font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1">
                      <TrendIcon className={`h-3 w-3 ${
                        stat.trending === 'up' ? 'text-success-500' : 'text-danger-500'
                      }`} />
                      <span className={`text-xs font-medium ${
                        stat.trending === 'up' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* جدول المشاريع الأخيرة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl-ar font-bold text-gray-900 dark:text-gray-100">
              المشاريع الأخيرة
            </h3>
            <Link to="/calculator">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FaPlus className="h-4 w-4" />
                مشروع جديد
              </button>
            </Link>
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FaProjectDiagram className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                لا توجد مشاريع بعد
              </h4>
              <p className="text-gray-500 mb-6">
                ابدأ بإنشاء مشروعك الأول
              </p>
              <Link to="/calculator">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  إنشاء مشروع جديد
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">اسم المشروع</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">النوع</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">الحالة</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">تاريخ التسليم</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">التكلفة</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, index) => {
                    const statusInfo = statusConfig[project.status] || statusConfig['Planning'];
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                              <FaProjectDiagram className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {project.name || 'مشروع جديد'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {project.description?.slice(0, 30) || 'لا يوجد وصف'}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {project.project_type || 'غير محدد'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {project.delivery_date ? format(new Date(project.delivery_date), 'dd MMM yyyy', { locale: ar }) : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {project.estimated_cost ? `${project.estimated_cost.toLocaleString()} ريال` : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {project.id && (
                              <>
                                <button 
                                  onClick={() => navigate(`/project/${project.id}`)}
                                  className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors" 
                                  title="عرض"
                                >
                                  <FaEye className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => navigate(`/project/${project.id}/edit`)}
                                  className="p-2 text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors" 
                                  title="تعديل"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(project.id)}
                                  className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" 
                                  title="حذف"
                                >
                                  <FaTrash className="h-4 w-4" />
                                </button>
                                <Link to={`/reports?project=${project.id}`}>
                                  <button 
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" 
                                    title="تقرير"
                                  >
                                    <FaFileAlt className="h-4 w-4" />
                                  </button>
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* روابط سريعة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            title: 'حاسبة التكاليف',
            description: 'حساب تكاليف المشاريع بدقة',
            icon: FaCalculator,
            color: 'from-blue-500 to-blue-700',
            path: '/calculator'
          },
          {
            title: 'محلل CAD',
            description: 'تحليل ملفات الأوتوكاد',
            icon: FaAtom,
            color: 'from-purple-500 to-purple-700',
            path: '/cad-analyzer'
          },
          {
            title: 'إدارة المواد',
            description: 'إدارة مخزون المواد',
            icon: FaBox,
            color: 'from-green-500 to-green-700',
            path: '/materials'
          },
          {
            title: 'التقارير',
            description: 'إنشاء تقارير مفصلة',
            icon: FaFileAlt,
            color: 'from-orange-500 to-orange-700',
            path: '/reports'
          }
        ].map((shortcut, index) => {
          const Icon = shortcut.icon;
          
          return (
            <motion.div
              key={shortcut.title}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={shortcut.path}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${shortcut.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {shortcut.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {shortcut.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Dashboard;