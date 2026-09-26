import React, { useState, useRef, useEffect } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
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
  FaCalculator
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
import { createErrorLogger } from '../../utils/qb/errorMonitoring';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
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
  // إزالة showCreateModal لأننا نستخدم الـ calculator بدلاً منه

  // بيانات الرسوم البيانية من المشاريع الحقيقية
  const getMonthlyData = () => {
    if (projects.length === 0) {
      // بيانات وهمية في حالة عدم وجود مشاريع
      return [
        { name: 'يناير', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'فبراير', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'مارس', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'أبريل', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'مايو', المشاريع: 0, الإيرادات: 0, التكاليف: 0 },
        { name: 'يونيو', المشاريع: 0, الإيرادات: 0, التكاليف: 0 }
      ];
    }
    
    // بيانات حقيقية من المشاريع
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
      monthlyStats[month].الإيرادات += (project.estimated_cost || 0) * 1.2; // نسبة ربح 20%
      monthlyStats[month].التكاليف += (project.estimated_cost || 0);
    });
    
    // تحويل إلى مصفوفة وتنظيم الشهور
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
    // حساب استخدام المواد من بيانات المشاريع
    const materialStats = {
      'خرسانة': { الكمية: 0, التكلفة: 0 },
      'حديد': { الكمية: 0, التكلفة: 0 },
      'بلوك': { الكمية: 0, التكلفة: 0 },
      'أسمنت': { الكمية: 0, التكلفة: 0 },
      'رمل': { الكمية: 0, التكلفة: 0 }
    };
    
    projects.forEach(project => {
      // حساب افتراضي للمواد بناءً على تكلفة المشروع
      const cost = project.estimated_cost || 0;
      const multiplier = cost / 100000; // تحويل إلى نسب معقولة
      
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
      
      setProjects(fetchedProjects.slice(0, 5)); // أحدث 5 مشاريع

      // حساب الإحصائيات
      const totalProjects = fetchedProjects.length;
      const completedProjects = fetchedProjects.filter(p => p.status === 'Completed').length;
      const activeProjects = fetchedProjects.filter(p => p.status === 'In Progress').length;
      const pendingProjects = fetchedProjects.filter(p => p.status === 'Planning').length;
      const totalCost = fetchedProjects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
      const monthlyRevenue = totalCost * 0.15; // نسبة ربح استرشادية

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
      
      // عرض رسالة خطأ أكثر تفصيلاً
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
      cancelButtonText: 'إلغاء'
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

  const statusConfig = {
    'Planning': { 
      label: 'تخطيط', 
      color: 'bg-warning-100 text-warning-800 border-warning-200',
      icon: FaClock
    },
    'In Progress': { 
      label: 'قيد التنفيذ', 
      color: 'bg-primary-100 text-primary-800 border-primary-200',
      icon: FaRocket
    },
    'Completed': { 
      label: 'مكتمل', 
      color: 'bg-success-100 text-success-800 border-success-200',
      icon: FaCheckCircle
    },
    'On Hold': { 
      label: 'معلق', 
      color: 'bg-danger-100 text-danger-800 border-danger-200',
      icon: FaExclamationTriangle
    }
  };

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
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="md"
            onClick={() => fetchData()}
            icon={FaAtom}
          >
            تحديث البيانات
          </Button>
          
          <Link to="/calculator">
            <Button 
              variant="primary" 
              size="md"
              icon={FaPlus}
              className="shadow-glow"
            >
              مشروع جديد
            </Button>
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
            color: 'from-primary-500 to-primary-700'
          },
          {
            title: 'قيد التنفيذ',
            value: stats.activeProjects,
            icon: FaRocket,
            color: 'from-accent-500 to-accent-700'
          },
          {
            title: 'مكتملة',
            value: stats.completedProjects,
            icon: FaCheckCircle,
            color: 'from-success-500 to-success-700'
          },
          {
            title: 'إجمالي التكاليف',
            value: `${(stats.totalCost / 1000000).toFixed(1)}م ريال`,
            icon: FaMoneyBillWave,
            color: 'from-purple-500 to-purple-700'
          },
          {
            title: 'الإيرادات الشهرية',
            value: `${(stats.monthlyRevenue / 1000).toFixed(0)}ك ريال`,
            icon: FaArrowUp,
            color: 'from-emerald-500 to-emerald-700'
          },
          {
            title: 'في الانتظار',
            value: stats.pendingProjects,
            icon: FaClock,
            color: 'from-orange-500 to-orange-700'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <Card className="p-6 hover:shadow-glow transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm-ar font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl-ar font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {stat.value}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* رسم بياني للإيرادات والتكاليف */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl-ar font-bold text-gray-900 dark:text-gray-100">
                الإيرادات والتكاليف الشهرية
              </h3>
              <FaChartLine className="h-5 w-5 text-primary-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getMonthlyData()}>
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
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="التكاليف" 
                  stackId="2" 
                  stroke="#ef4444" 
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* رسم بياني لحالة المشاريع */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl-ar font-bold text-gray-900 dark:text-gray-100">
                حالة المشاريع
              </h3>
              <FaStar className="h-5 w-5 text-accent-600" />
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

      {/* جدول استخدام المواد */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl-ar font-bold text-gray-900 dark:text-gray-100">
              استخدام المواد هذا الشهر
            </h3>
            <FaBox className="h-5 w-5 text-success-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getMaterialUsageData()}>
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
                formatter={(value, name) => [
                  name === 'الكمية' ? `${value.toLocaleString()} وحدة` : `${value.toLocaleString()} ريال`,
                  name
                ]}
              />
              <Bar 
                dataKey="الكمية" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="الكمية"
              />
              <Bar 
                dataKey="التكلفة" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="التكلفة"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* جدول المشاريع الأخيرة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl-ar font-bold text-gray-900 dark:text-gray-100">
              المشاريع الأخيرة
            </h3>
            <Link to="/calculator">
              <Button variant="outline" size="sm">
                مشروع جديد
              </Button>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>اسم المشروع</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>التكلفة</th>
                  <th>الإجراءات</th>
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
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td>
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
                      <td>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {project.created_at ? format(new Date(project.created_at), 'dd MMM yyyy', { locale: ar }) : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {project.estimated_cost ? `${project.estimated_cost.toLocaleString()} ريال` : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              navigate(`/project/${project.id}`);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors" 
                            title="عرض"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              navigate(`/project/${project.id}/edit`);
                            }}
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
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
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
                <Card className="p-6 hover:shadow-glow transition-all duration-300 cursor-pointer group">
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
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Dashboard;