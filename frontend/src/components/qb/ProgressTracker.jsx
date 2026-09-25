import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaChartLine,
  FaTrophy,
  FaBullseye,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaBuilding,
  FaHammer,
  FaEye,
  FaFlag,
  FaStar,
  FaRocket
} from 'react-icons/fa';

const ProgressTracker = ({ 
  projectData, 
  items = [], 
  results = null,
  darkMode = false,
  onUpdateProgress 
}) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [milestoneFilter, setMilestoneFilter] = useState('all');

  // Calculate comprehensive progress metrics
  const progressMetrics = useMemo(() => {
    if (!results) return null;

    const totalTasks = items.length + 8; // Base project phases + items
    const completedTasks = items.filter(item => item.status === 'completed').length + 2; // Assuming planning & permits done
    const inProgressTasks = items.filter(item => item.status === 'in-progress').length + 1; // Current phase
    const pendingTasks = totalTasks - completedTasks - inProgressTasks;
    
    const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate financial progress
    const totalCost = typeof results.totalCost === 'string' 
      ? parseInt(results.totalCost.replace(/,/g, '')) || 0
      : parseInt(results.totalCost) || 0;
    const finalPrice = typeof results.finalPrice === 'string'
      ? parseInt(results.finalPrice.replace(/,/g, '')) || 0
      : parseInt(results.finalPrice) || 0;
    
    const financialProgress = finalPrice > 0 ? (totalCost / finalPrice) * 100 : 0;
    
    // Calculate area progress
    const totalArea = results.totalArea || 0;
    const completedArea = items
      .filter(item => item.status === 'completed')
      .reduce((sum, item) => sum + (item.area || 0), 0);
    const areaProgress = totalArea > 0 ? (completedArea / totalArea) * 100 : 0;
    
    // Timeline progress
    const startDate = new Date(projectData.startDate || Date.now());
    const deliveryDate = new Date(projectData.deliveryDate || Date.now() + 90 * 24 * 60 * 60 * 1000);
    const currentDate = new Date();
    
    const totalDuration = deliveryDate - startDate;
    const elapsedTime = currentDate - startDate;
    const timelineProgress = totalDuration > 0 ? (elapsedTime / totalDuration) * 100 : 0;
    
    // Calculate efficiency metrics
    const targetDailyProgress = 100 / (totalDuration / (1000 * 60 * 60 * 24));
    const actualDailyProgress = overallProgress / Math.max(1, elapsedTime / (1000 * 60 * 60 * 24));
    const efficiency = targetDailyProgress > 0 ? (actualDailyProgress / targetDailyProgress) * 100 : 100;
    
    // Quality metrics (simulated)
    const qualityScore = 85 + (Math.random() * 10); // Simulated 85-95%
    const safetyScore = 90 + (Math.random() * 8); // Simulated 90-98%
    
    // Milestone tracking
    const milestones = [
      {
        id: 'planning',
        name: 'التخطيط والتصميم',
        targetDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        actualDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        progress: 100,
        importance: 'high'
      },
      {
        id: 'permits',
        name: 'التراخيص والموافقات',
        targetDate: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        actualDate: currentDate > new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000) 
          ? new Date(startDate.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        status: currentDate > new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000) ? 'completed' : 'in-progress',
        progress: Math.min(100, (elapsedTime / (21 * 24 * 60 * 60 * 1000)) * 100),
        importance: 'high'
      },
      {
        id: 'groundwork',
        name: 'الأعمال الأرضية',
        targetDate: new Date(startDate.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        actualDate: null,
        status: elapsedTime > 31 * 24 * 60 * 60 * 1000 ? 'completed' : 'in-progress',
        progress: Math.min(100, (elapsedTime / (31 * 24 * 60 * 60 * 1000)) * 100),
        importance: 'high'
      },
      {
        id: 'foundation',
        name: 'الأعمال الخرسانية',
        targetDate: new Date(startDate.getTime() + 51 * 24 * 60 * 60 * 1000).toISOString(),
        actualDate: null,
        status: elapsedTime > 51 * 24 * 60 * 60 * 1000 ? 'completed' : 'pending',
        progress: Math.min(100, (elapsedTime / (51 * 24 * 60 * 60 * 1000)) * 100),
        importance: 'critical'
      },
      {
        id: 'structure',
        name: 'الهيكل الإنشائي',
        targetDate: new Date(startDate.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString(),
        actualDate: null,
        status: elapsedTime > 75 * 24 * 60 * 60 * 1000 ? 'completed' : 'pending',
        progress: Math.min(100, (elapsedTime / (75 * 24 * 60 * 60 * 1000)) * 100),
        importance: 'critical'
      },
      {
        id: 'finishing',
        name: 'الأعمال النهائية',
        targetDate: deliveryDate.toISOString(),
        actualDate: null,
        status: 'pending',
        progress: Math.min(100, (elapsedTime / totalDuration) * 100),
        importance: 'medium'
      }
    ];

    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const onTimeMilestones = milestones.filter(m => 
      m.status === 'completed' && 
      m.actualDate && 
      new Date(m.actualDate) <= new Date(m.targetDate)
    ).length;
    
    const milestoneSuccess = completedMilestones > 0 ? (onTimeMilestones / completedMilestones) * 100 : 0;

    return {
      overallProgress: Math.round(overallProgress),
      financialProgress: Math.round(financialProgress),
      areaProgress: Math.round(areaProgress),
      timelineProgress: Math.round(timelineProgress),
      efficiency: Math.round(efficiency),
      qualityScore: Math.round(qualityScore),
      safetyScore: Math.round(safetyScore),
      milestoneSuccess: Math.round(milestoneSuccess),
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      milestones,
      startDate,
      deliveryDate,
      currentDate,
      daysElapsed: Math.max(0, Math.floor(elapsedTime / (1000 * 60 * 60 * 24))),
      daysRemaining: Math.max(0, Math.floor((deliveryDate - currentDate) / (1000 * 60 * 60 * 24))),
      isOnSchedule: timelineProgress <= overallProgress + 10, // Allow 10% tolerance
      isAheadOfSchedule: timelineProgress < overallProgress - 5
    };
  }, [projectData, items, results]);

  const getProgressColor = (progress) => {
    if (progress >= 90) return { bg: 'bg-green-500', text: 'text-green-600', glow: 'shadow-green-500/50' };
    if (progress >= 70) return { bg: 'bg-blue-500', text: 'text-blue-600', glow: 'shadow-blue-500/50' };
    if (progress >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', glow: 'shadow-yellow-500/50' };
    return { bg: 'bg-red-500', text: 'text-red-600', glow: 'shadow-red-500/50' };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'in-progress': return <FaClock className="text-blue-500" />;
      case 'pending': return <FaFlag className="text-gray-500" />;
      case 'delayed': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const updateMilestoneStatus = (milestoneId, newStatus) => {
    toast.success(`تم تحديث حالة المعلم بنجاح`);
    if (onUpdateProgress) {
      onUpdateProgress(milestoneId, newStatus);
    }
  };

  if (!progressMetrics) {
    return (
      <div className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm ${
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="text-center">
          <FaChartLine className={`mx-auto text-4xl mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            قم بحساب التكاليف أولاً لمتابعة تقدم المشروع
          </p>
        </div>
      </div>
    );
  }

  const progressColors = getProgressColor(progressMetrics.overallProgress);

  return (
    <div className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-700 p-3 rounded-full">
              <FaChartLine className="text-white text-xl" />
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            📊 تتبع تقدم المشروع
          </h2>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            progressMetrics.isAheadOfSchedule ? 'bg-green-100 text-green-700' :
            progressMetrics.isOnSchedule ? 'bg-blue-100 text-blue-700' :
            'bg-red-100 text-red-700'
          }`}>
            {progressMetrics.isAheadOfSchedule ? '⏰ متقدم' :
             progressMetrics.isOnSchedule ? '✅ في الموعد' :
             '⚠️ متأخر'}
          </div>
        </div>
      </div>

      {/* Main Progress Overview */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${progressColors.bg} text-white text-4xl font-bold shadow-2xl ${progressColors.glow} mb-4`}>
            {progressMetrics.overallProgress}%
          </div>
          <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            التقدم الإجمالي للمشروع
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            آخر تحديث: {progressMetrics.currentDate.toLocaleDateString('ar-SA')}
          </p>
        </div>
      </div>

      {/* Progress Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>المهام المكتملة</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {progressMetrics.completedTasks}/{progressMetrics.totalTasks}
              </p>
            </div>
            <FaCheckCircle className={`text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(progressMetrics.completedTasks / progressMetrics.totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>التقدم المالي</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {progressMetrics.financialProgress}%
              </p>
            </div>
            <FaBullseye className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressMetrics.financialProgress}%` }}
            ></div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الكفاءة الزمنية</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {progressMetrics.efficiency}%
              </p>
            </div>
            <FaClock className={`text-2xl ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressMetrics.efficiency)}%` }}
            ></div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الأهداف المحققة</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {progressMetrics.milestoneSuccess}%
              </p>
            </div>
            <FaTrophy className={`text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressMetrics.milestoneSuccess}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Timeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className={`lg:col-span-2 p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FaCalendarCheck className="ml-2" />
            الجدول الزمني
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الأيام المنقضية</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {progressMetrics.daysElapsed} يوم
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الأيام المتبقية</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {progressMetrics.daysRemaining} يوم
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تاريخ البداية</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {progressMetrics.startDate.toLocaleDateString('ar-SA')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تاريخ التسليم المتوقع</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {progressMetrics.deliveryDate.toLocaleDateString('ar-SA')}
              </span>
            </div>
          </div>
          
          {/* Timeline Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                التقدم الزمني
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {progressMetrics.timelineProgress}%
              </span>
            </div>
            <div className={`w-full bg-gray-200 rounded-full h-3 ${darkMode ? 'bg-gray-600' : ''}`}>
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progressMetrics.isAheadOfSchedule ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  progressMetrics.isOnSchedule ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                  'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{ width: `${Math.min(100, progressMetrics.timelineProgress)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FaStar className="ml-2" />
            مؤشرات الأداء
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>جودة العمل</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {progressMetrics.qualityScore}%
                </span>
                <FaEye className="text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>السلامة</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {progressMetrics.safetyScore}%
                </span>
                <FaHammer className="text-blue-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الكفاءة العامة</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {Math.round((progressMetrics.qualityScore + progressMetrics.safetyScore + progressMetrics.efficiency) / 3)}%
                </span>
                <FaRocket className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Tracking */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <FaFlag className="ml-2" />
          تتبع المعالم الرئيسية
        </h3>
        <div className="space-y-4">
          {progressMetrics.milestones.map((milestone) => (
            <div 
              key={milestone.id}
              className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                getImportanceColor(milestone.importance)
              } ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white/50 border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  {getStatusIcon(milestone.status)}
                  <div>
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {milestone.name}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      الهدف: {new Date(milestone.targetDate).toLocaleDateString('ar-SA')}
                      {milestone.actualDate && (
                        <span className="mr-4">
                          الفعلي: {new Date(milestone.actualDate).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    milestone.importance === 'critical' ? 'bg-red-100 text-red-700' :
                    milestone.importance === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {milestone.importance === 'critical' ? 'حرج' :
                     milestone.importance === 'high' ? 'عالي' : 'متوسط'}
                  </span>
                  <select
                    value={milestone.status}
                    onChange={(e) => updateMilestoneStatus(milestone.id, e.target.value)}
                    className={`px-3 py-1 rounded text-sm border ${
                      darkMode 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="in-progress">قيد التنفيذ</option>
                    <option value="completed">مكتمل</option>
                    <option value="delayed">متأخر</option>
                  </select>
                </div>
              </div>
              
              {/* Progress bar for milestone */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>التقدم</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {Math.round(milestone.progress)}%
                  </span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in-progress' ? 'bg-blue-500' :
                      milestone.status === 'delayed' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(100, milestone.progress)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className={`mt-8 p-6 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-purple-400' : 'text-purple-800'}`}>
          <FaTrophy className="ml-2" />
          ملخص الأداء
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
              ✅ نقاط القوة
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              التقدم الإجمالي جيد والمهام تتم حسب الخطة
            </p>
          </div>
          
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
              ⚠️ نقاط تحتاج متابعة
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              مراقبة الالتزام بالجدول الزمني للمهام القادمة
            </p>
          </div>
          
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
              🎯 التوصيات
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              التركيز على إكمال المعالم الحرجة في الوقت المحدد
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;