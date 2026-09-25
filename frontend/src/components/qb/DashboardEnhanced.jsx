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
  FaHistory,
  FaShare,
  FaDownload,
  FaPrint,
  FaCopy,
  FaBookmark,
  FaHeart,
  FaBell,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaEllipsisV,
  FaEllipsisH,
  FaInfoCircle,
  FaChartPie,
  FaTachometerAlt,
  FaShieldAlt,
  FaGlobe,
  FaRegClock,
  FaRegCalendarAlt,
  FaRegUser,
  FaRegMoneyBillWave,
  FaRegChartLine,
  FaRegBuilding,
  FaRegFileAlt,
  FaRegStar,
  FaRegBookmark,
  FaRegHeart,
  FaRegShare,
  FaRegCopy,
  FaRegDownload,
  FaRegPrint,
  FaRegEye,
  FaRegEdit,
  FaRegTrash,
  FaRegBell,
  FaRegFilter,
  FaRegSearch,
  FaRegSortAmountDown,
  FaRegSortAmountUp,
  FaRegEllipsisV,
  FaRegEllipsisH,
  FaRegInfoCircle,
  FaRegChartPie,
  FaRegTachometerAlt,
  FaRegShieldAlt,
  FaRegGlobe,
  FaArrowRight,
  FaArrowLeft,
  FaChevronRight,
  FaChevronLeft,
  FaChevronUp,
  FaChevronDown,
  FaRegChevronRight,
  FaRegChevronLeft,
  FaRegChevronUp,
  FaRegChevronDown,
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
import { get, projectsAPI } from '../../utils/qb/api';
import projectService from '../../services/qb/projectService';
import { Button, Card, Modal } from './ui';
import { AsyncErrorBoundary } from './ErrorBoundaries';
import { createErrorLogger } from '../../utils/qb/utils/errorMonitoring';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

// مكونات محسنة للأزرار
const EnhancedActionButton = ({ 
  icon: Icon, 
  onClick, 
  variant = 'primary', 
  size = 'sm', 
  tooltip,
  children,
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl',
    info: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl'
  };

  const sizes = {
    xs: 'p-1.5 text-xs',
    sm: 'p-2 text-sm',
    md: 'p-2.5 text-base',
    lg: 'p-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={tooltip}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        rounded-xl font-medium 
        transition-all duration-300 
        transform-gpu 
        backdrop-blur-sm 
        border border-white/20 
        hover:border-white/30 
        active:scale-95
        flex items-center justify-center
        group relative overflow-hidden
      `}
      {...props}
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Icon className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />
      {children && (
        <span className="relative z-10 mr-1">{children}</span>
      )}
    </motion.button>
  );
};

// مكون مشروع محسن
const EnhancedProjectCard = ({ project, index, onView, onEdit, onDelete, onReport, statusConfig }) => {
  const statusInfo = statusConfig[project.status] || statusConfig['Planning'];
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="p-6 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900/20 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden relative">
        {/* خلفية متدرجة جميلة */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {/* أيقونة المشروع محسنة */}
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                <FaProjectDiagram className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </motion.div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {project.name || 'مشروع جديد'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                {project.description?.slice(0, 50) || 'لا يوجد وصف'}...
              </p>
              
              {/* شارة الحالة محسنة */}
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${statusInfo.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {project.created_at ? format(new Date(project.created_at), 'dd MMM yyyy', { locale: ar }) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* القائمة المنسدلة للأزرار */}
          <div className="relative">
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <EnhancedActionButton
                icon={FaEye}
                variant="primary"
                size="sm"
                tooltip="عرض المشروع"
                onClick={() => onView(project.id)}
              />
              <EnhancedActionButton
                icon={FaEdit}
                variant="success"
                size="sm"
                tooltip="تعديل المشروع"
                onClick={() => onEdit(project.id)}
              />
              <EnhancedActionButton
                icon={FaFileAlt}
                variant="info"
                size="sm"
                tooltip="إنشاء تقرير"
                onClick={() => onReport(project.id)}
              />
              <EnhancedActionButton
                icon={FaTrash}
                variant="danger"
                size="sm"
                tooltip="حذف المشروع"
                onClick={() => onDelete(project.id)}
              />
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FaRegCalendarAlt className="h-4 w-4" />
              <span>الإنشاء</span>
            </div>
            <div className="flex items-center gap-1">
              <FaRegMoneyBillWave className="h-4 w-4" />
              <span>التكلفة</span>
            </div>
          </div>
          
          <div className="text-left">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {project.estimated_cost ? `${project.estimated_cost.toLocaleString()} ريال` : '-'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {project.location || 'غير محدد'}
            </p>
          </div>
        </div>

        {/* مؤشر التقدم (إذا كان هناك معلومات تقدم) */}
        {project.progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">التقدم</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

const DashboardEnhanced = () => {
  const navigate = useNavigate();
  const errorLogger = React.useMemo(() => createErrorLogger('Dashboard'), []);
  
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
  const [viewMode, setViewMode] = useState('grid'); // grid أو table
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // بيانات الرسوم البيانية من المشاريع الحقيقية
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

  const getMaterialUsageData = () => {
    const materialStats = {
      'خرسانة': { الكمية: 0, التكلفة: 0 },
      'حديد': { الكمية: 0, التكلفة: 0 },
      'بلوك': { الكمية: 0, التكلفة: 0 },
      'أسمنت': { الكمية: 0, التكلفة: 0 },
      'رمل': { الكمية: 0, التكلفة: 0 }
    };
    
    projects.forEach(project => {
      const cost = project.estimated_cost || 0;
      const multiplier = cost / 100000;
      
      materialStats['خرسانة'].الكمية += Math.round(multiplier * 240);
      materialStats['خرسانة'].التكلفة += Math.round(multiplier * 24000);
      
      materialStats['حديد'].الكمية += Math.round(multiplier * 180);
      materialStats['حديد'].التكلفة += Math.round(multiplier * 18000);
      
      materialStats['بلوك'].الكمية += Math.round(multiplier * 320);
      materialStats['بلوك'].التكلفة += Math.round(multiplier * 16000);
      
      materialStats['أسمنت'].الكمية += Math.round(multiplier * 120);
      materialStats['أسمنت'].التكلفة += Math.round(multiplier * 12000);
      
      materialStats['رمل'].الكمية += Math.round(multiplier * 280);
      materialStats['رمل'].التكلفة += Math.round(multiplier * 8400);
    });
    
    return Object.entries(materialStats).map(([name, data]) => ({
      name,
      الكمية: data.الكمية,
      التكلفة: data.التكلفة
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 جاري جلب المشاريع من قاعدة البيانات...');
      
      const fetchedProjects = await projectService.getAllProjects();
      console.log('✅ تم جلب المشاريع:', fetchedProjects);
      
      setProjects(fetchedProjects.slice(0, 12)); // أحدث 12 مشروع

      const totalProjects = fetchedProjects.length;
      const completedProjects = fetchedProjects.filter(p => p.status === 'Completed').length;
      const activeProjects = fetchedProjects.filter(p => p.status === 'In Progress').length;
      const pendingProjects = fetchedProjects.filter(p => p.status === 'Planning').length;
      const totalCost = fetchedProjects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
      const monthlyRevenue = totalCost * 0.15;

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
    fetchData();
  }, []);

  const handleDelete = async (projectId) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن هذا الإجراء!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
    });

    if (result.isConfirmed) {
      try {
        await projectService.deleteProject(projectId);
        Swal.fire('تم الحذف!', 'تم حذف المشروع بنجاح.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل في حذف المشروع'
        });
      }
    }
  };

  const handleView = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleEdit = (projectId) => {
    navigate(`/project/${projectId}/edit`);
  };

  const handleReport = (projectId) => {
    navigate(`/reports?project=${projectId}`);
  };

  // تصفية وترتيب المشاريع
  const filteredProjects = projects
    .filter(project => 
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      return order * (a[sortBy] > b[sortBy] ? 1 : -1);
    });

  const statusConfig = {
    'Planning': { 
      label: 'تخطيط', 
      color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-300 dark:border-yellow-700',
      icon: FaClock
    },
    'In Progress': { 
      label: 'قيد التنفيذ', 
      color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 dark:border-blue-700',
      icon: FaRocket
    },
    'Completed': { 
      label: 'مكتمل', 
      color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:border-green-700',
      icon: FaCheckCircle
    },
    'On Hold': { 
      label: 'معلق', 
      color: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 dark:border-red-700',
      icon: FaExclamationTriangle
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* رأس الصفحة محسن */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-10" />
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl-ar font-display font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                لوحة التحكم الذكية
              </h1>
              <p className="text-lg-ar text-gray-600 dark:text-gray-400 font-body">
                نظرة شاملة على مشاريعك وأدائك مع تحسينات حديثة
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* أزرار التحكم */}
              <div className="flex items-center gap-2">
                <EnhancedActionButton
                  icon={FaSync}
                  variant="secondary"
                  size="sm"
                  tooltip="تحديث البيانات"
                  onClick={() => fetchData()}
                />
                
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-gray-700 shadow-md' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FaChartPie className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'table' 
                        ? 'bg-white dark:bg-gray-700 shadow-md' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FaTable className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <Link to="/calculator">
                <EnhancedActionButton
                  icon={FaPlus}
                  variant="primary"
                  size="md"
                  tooltip="مشروع جديد"
                  className="shadow-2xl"
                >
                  مشروع جديد
                </EnhancedActionButton>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* بطاقات الإحصائيات محسنة */}
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
            color: 'from-blue-500 to-blue-700',
            change: '+12%',
            trending: 'up',
            gradient: 'from-blue-500/10 to-blue-700/10'
          },
          {
            title: 'قيد التنفيذ',
            value: stats.activeProjects,
            icon: FaRocket,
            color: 'from-purple-500 to-purple-700',
            change: '+8%',
            trending: 'up',
            gradient: 'from-purple-500/10 to-purple-700/10'
          },
          {
            title: 'مكتملة',
            value: stats.completedProjects,
            icon: FaCheckCircle,
            color: 'from-green-500 to-green-700',
            change: '+23%',
            trending: 'up',
            gradient: 'from-green-500/10 to-green-700/10'
          },
          {
            title: 'إجمالي التكاليف',
            value: `${(stats.totalCost / 1000000).toFixed(1)}م ريال`,
            icon: FaMoneyBillWave,
            color: 'from-emerald-500 to-emerald-700',
            change: '+15%',
            trending: 'up',
            gradient: 'from-emerald-500/10 to-emerald-700/10'
          },
          {
            title: 'الإيرادات الشهرية',
            value: `${(stats.monthlyRevenue / 1000).toFixed(0)}ك ريال`,
            icon: FaArrowUp,
            color: 'from-cyan-500 to-cyan-700',
            change: '+18%',
            trending: 'up',
            gradient: 'from-cyan-500/10 to-cyan-700/10'
          },
          {
            title: 'في الانتظار',
            value: stats.pendingProjects,
            icon: FaClock,
            color: 'from-orange-500 to-orange-700',
            change: '-5%',
            trending: 'down',
            gradient: 'from-orange-500/10 to-orange-700/10'
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
              className="group relative overflow-hidden"
            >
              <Card className={`p-6 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br ${stat.gradient} border-0 backdrop-blur-sm relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm-ar font-medium text-gray-600 dark:text-gray-400 mb-2">
                      {stat.title}
                    </p>
                    <p className="text-2xl-ar font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-2">
                      <TrendIcon className={`h-4 w-4 ${
                        stat.trending === 'up' ? 'text-green-500' : 'text-red-500'
                      }`} />
                      <span className={`text-sm font-semibold ${
                        stat.trending === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* قسم المشاريع محسن */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900/20 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <FaProjectDiagram className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  المشاريع الأخيرة
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredProjects.length} من {projects.length} مشروع
                </p>
              </div>
            </div>
            
            {/* أدوات البحث والتصفية */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="البحث في المشاريع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">تاريخ الإنشاء</option>
                <option value="name">اسم المشروع</option>
                <option value="estimated_cost">التكلفة</option>
                <option value="status">الحالة</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {sortOrder === 'asc' ? <FaSortAmountUp className="h-4 w-4" /> : <FaSortAmountDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {/* عرض المشاريع */}
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project, index) => (
                  <EnhancedProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    statusConfig={statusConfig}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto"
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">المشروع</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">الحالة</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">التاريخ</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">التكلفة</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project, index) => {
                      const statusInfo = statusConfig[project.status] || statusConfig['Planning'];
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <motion.tr
                          key={project.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FaProjectDiagram className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {project.name || 'مشروع جديد'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {project.description?.slice(0, 30) || 'لا يوجد وصف'}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {project.created_at ? format(new Date(project.created_at), 'dd MMM yyyy', { locale: ar }) : '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {project.estimated_cost ? `${project.estimated_cost.toLocaleString()} ريال` : '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <EnhancedActionButton
                                icon={FaEye}
                                variant="primary"
                                size="xs"
                                tooltip="عرض"
                                onClick={() => handleView(project.id)}
                              />
                              <EnhancedActionButton
                                icon={FaEdit}
                                variant="success"
                                size="xs"
                                tooltip="تعديل"
                                onClick={() => handleEdit(project.id)}
                              />
                              <EnhancedActionButton
                                icon={FaFileAlt}
                                variant="info"
                                size="xs"
                                tooltip="تقرير"
                                onClick={() => handleReport(project.id)}
                              />
                              <EnhancedActionButton
                                icon={FaTrash}
                                variant="danger"
                                size="xs"
                                tooltip="حذف"
                                onClick={() => handleDelete(project.id)}
                              />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaProjectDiagram className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                لا توجد مشاريع
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'لا توجد مشاريع تطابق البحث' : 'ابدأ بإنشاء مشروعك الأول'}
              </p>
              {!searchTerm && (
                <Link to="/calculator">
                  <EnhancedActionButton
                    icon={FaPlus}
                    variant="primary"
                    size="md"
                  >
                    إنشاء مشروع جديد
                  </EnhancedActionButton>
                </Link>
              )}
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <FaChartLine className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl-ar font-bold text-gray-900 dark:text-gray-100">
                  الإيرادات والتكاليف الشهرية
                </h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getMonthlyData()}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}ك`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} ريال`]}
                />
                <Area 
                  type="monotone" 
                  dataKey="الإيرادات" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="التكاليف" 
                  stackId="2" 
                  stroke="#ef4444" 
                  fill="url(#costGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white via-green-50/50 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <FaStar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl-ar font-bold text-gray-900 dark:text-gray-100">
                  حالة المشاريع
                </h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getProjectStatusData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getProjectStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}`, 'العدد']}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '14px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* روابط سريعة محسنة */}
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
                <Card className="p-6 hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900/20 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${shortcut.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative flex items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${shortcut.color} shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {shortcut.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {shortcut.description}
                      </p>
                    </div>
                    <FaChevronLeft className="h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default DashboardEnhanced;