
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaChartPie, FaArrowUp, FaArrowDown, FaWallet } from 'react-icons/fa';

const FinancialAnalytics = ({ projects }) => {
  
  // 1. حساب البيانات المالية
  const totalBudget = projects.reduce((acc, p) => acc + (parseFloat(p.estimated_cost) || parseFloat(p.budget) || 0), 0);

  // دالة لحساب التقدم (مطابقة تماماً لمنطق Overview)
  const calculateProgress = (project) => {
    if (!project.start_date || !project.delivery_date) {
      // للمشاريع الجديدة أو التي بدون تواريخ، نفترض 0% أو قيمة للحالة
       if (project.status === 'ميكتمل') return 100;
       if (project.status === 'قيد التنفيذ') return 0; // أو يمكن افتراض نسبة بسيطة
       return 0;
    }

    const startDate = new Date(project.start_date);
    const endDate = new Date(project.delivery_date);
    const today = new Date();

    // إزالة الوقت
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) return 100;
    if (elapsedDays < 0) return 0;
    if (elapsedDays >= totalDays) return 100;

    return Math.round((elapsedDays / totalDays) * 100);
  };

  // دالة لحساب المصروف بناءً على هذا التقدم (قيمة مكتسبة)
  const calculateSpent = (project) => {
    const budget = parseFloat(project.estimated_cost) || parseFloat(project.budget) || 0;
    const progress = calculateProgress(project);
    
    // المصروف = الميزانية * نسبة الإنجاز
    return Math.round(budget * (progress / 100));
  };

  const totalSpent = projects.reduce((acc, p) => acc + calculateSpent(p), 0);
  const variance = totalBudget - totalSpent;

  // 2. تحضير بيانات المخطط البياني (Budget vs Spent based on Progress)
  const budgetData = projects.slice(0, 10).map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '), // اسم قصير
    Mizanya: parseFloat(p.estimated_cost) || parseFloat(p.budget) || 0,
    Masroof: calculateSpent(p) // يعبر الآن عن القيمة المنجزة
  }));

  // 3. تحضير بيانات التوزيع حسب النوع (Type Distribution)
  const typeMap = projects.reduce((acc, p) => {
    const type = p.project_type || 'أخرى';
    acc[type] = (acc[type] || 0) + (parseFloat(p.estimated_cost) || parseFloat(p.budget) || 0);
    return acc;
  }, {});

  const pieData = Object.keys(typeMap).map(type => ({
    name: type,
    value: typeMap[type]
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      
      {/* Cards Row - ملخص مالي سريع */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">إجمالي الميزانية المرصودة</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalBudget.toLocaleString()} ر.س
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <FaWallet className="text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">إجمالي المصروفات الفعلية</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSpent.toLocaleString()} ر.س
              </h3>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <FaMoneyBillWave className="text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">المتبقي (الفائض)</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {variance.toLocaleString()} ر.س
              </h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <FaArrowUp className="text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Budget vs Actual Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FaChartPie className="ml-2 text-blue-500" />
            تحليل الميزانية مقابل المصروف (لأهم المشاريع)
          </h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{fill: '#6b7280'}} />
                <YAxis tick={{fill: '#6b7280'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend />
                <Bar name="الميزانية المخططة" dataKey="Mizanya" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="المصروف الفعلي" dataKey="Masroof" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cost by Type Chart */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.4 }}
           className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FaChartPie className="ml-2 text-purple-500" />
            توزيع التكاليف حسب نوع المشروع
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default FinancialAnalytics;
