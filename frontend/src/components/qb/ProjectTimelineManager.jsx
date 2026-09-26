import React, { useState, useMemo } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { toast } from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaClock,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlay,
  FaPause,
  FaFlag,
  FaUsers,
  FaTasks
} from 'react-icons/fa';

const ProjectTimelineManager = ({ 
  projectData, 
  items = [], 
  darkMode = false,
  onUpdateTimeline 
}) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  
  // Calculate project timeline metrics
  const timelineMetrics = useMemo(() => {
    const totalTasks = items.length + 5; // Base tasks + project items
    const completedTasks = items.filter(item => item.status === 'completed').length;
    const inProgressTasks = items.filter(item => item.status === 'in-progress').length;
    const pendingTasks = totalTasks - completedTasks - inProgressTasks;
    
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate estimated vs actual timeline
    const startDate = new Date(projectData.startDate || Date.now());
    const deliveryDate = new Date(projectData.deliveryDate || Date.now() + 90 * 24 * 60 * 60 * 1000);
    const estimatedDuration = Math.ceil((deliveryDate - startDate) / (1000 * 60 * 60 * 24));
    const currentDate = new Date();
    const daysPassed = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, estimatedDuration - daysPassed);
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      progressPercentage: Math.round(progressPercentage),
      startDate,
      deliveryDate,
      estimatedDuration,
      daysPassed: Math.max(0, daysPassed),
      daysRemaining,
      isOnSchedule: daysRemaining >= 0,
      scheduleStatus: daysRemaining > 10 ? 'ahead' : daysRemaining >= 0 ? 'on-time' : 'delayed'
    };
  }, [projectData, items]);

  const projectTasks = useMemo(() => {
    const baseTasks = [
      {
        id: 'planning',
        name: 'التخطيط والتصميم',
        duration: 7,
        dependencies: [],
        status: 'completed',
        progress: 100,
        assignedTo: 'فريق التصميم',
        startDate: projectData.startDate,
        endDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        id: 'permits',
        name: 'التراخيص والموافقات',
        duration: 14,
        dependencies: ['planning'],
        status: timelineMetrics.daysPassed > 7 ? 'completed' : 'in-progress',
        progress: Math.min(100, (timelineMetrics.daysPassed - 7) / 14 * 100),
        assignedTo: 'الإدارة',
        startDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        endDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        id: 'groundwork',
        name: 'الأعمال الأرضية',
        duration: 10,
        dependencies: ['permits'],
        status: timelineMetrics.daysPassed > 21 ? 'completed' : 'in-progress',
        progress: Math.min(100, (timelineMetrics.daysPassed - 21) / 10 * 100),
        assignedTo: 'فريق الحفر',
        startDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString() : null,
        endDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 31 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        id: 'foundation',
        name: 'الأعمال الخرسانية',
        duration: 20,
        dependencies: ['groundwork'],
        status: timelineMetrics.daysPassed > 31 ? 'in-progress' : 'pending',
        progress: Math.min(100, (timelineMetrics.daysPassed - 31) / 20 * 100),
        assignedTo: 'فريق الخرسانة',
        startDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 31 * 24 * 60 * 60 * 1000).toISOString() : null,
        endDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 51 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        id: 'finishing',
        name: 'الأعمال النهائية',
        duration: 30,
        dependencies: ['foundation'],
        status: 'pending',
        progress: 0,
        assignedTo: 'فريق التشطيب',
        startDate: projectData.startDate ? new Date(new Date(projectData.startDate).getTime() + 51 * 24 * 60 * 60 * 1000).toISOString() : null,
        endDate: projectData.deliveryDate
      }
    ];

    // Add project items as tasks
    const itemTasks = items.map((item, index) => ({
      id: `item-${item.id}`,
      name: item.name,
      duration: Math.ceil((item.length || 1) * (item.width || 1) / 10), // Estimated based on area
      dependencies: index > 0 ? [`item-${items[index-1].id}`] : ['foundation'],
      status: item.status || 'pending',
      progress: item.progress || 0,
      assignedTo: item.assignedTo || 'فريق التنفيذ',
      startDate: item.startDate,
      endDate: item.endDate,
      area: item.area || 0,
      cost: item.totalCost || 0
    }));

    return [...baseTasks, ...itemTasks];
  }, [projectData, items, timelineMetrics]);

  const updateTaskStatus = (taskId, newStatus) => {
    // This would typically update the backend
    toast.success(`تم تحديث حالة المهمة بنجاح`);
    if (onUpdateTimeline) {
      onUpdateTimeline(taskId, newStatus);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle />;
      case 'in-progress': return <FaPlay />;
      case 'pending': return <FaPause />;
      case 'delayed': return <FaExclamationTriangle />;
      default: return <FaPause />;
    }
  };

  const getScheduleStatus = (status) => {
    switch (status) {
      case 'ahead': return { text: 'متقدم', color: 'text-green-600', bg: 'bg-green-100' };
      case 'on-time': return { text: 'في الموعد', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'delayed': return { text: 'متأخر', color: 'text-red-600', bg: 'bg-red-100' };
      default: return { text: 'غير محدد', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const scheduleStatus = getScheduleStatus(timelineMetrics.scheduleStatus);

  return (
    <div className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-3 rounded-full">
              <FaCalendarAlt className="text-white text-xl" />
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            📅 إدارة الجدولة الزمنية
          </h2>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${scheduleStatus.bg} ${scheduleStatus.color}`}>
            {scheduleStatus.text}
          </div>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إضافة مهمة
          </button>
        </div>
      </div>

      {/* Timeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>المهام المكتملة</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {timelineMetrics.completedTasks}
              </p>
            </div>
            <FaCheckCircle className={`text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>قيد التنفيذ</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {timelineMetrics.inProgressTasks}
              </p>
            </div>
            <FaPlay className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>المدة المتبقية</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {timelineMetrics.daysRemaining}
              </p>
            </div>
            <FaClock className={`text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>نسبة الإنجاز</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {timelineMetrics.progressPercentage}%
              </p>
            </div>
            <FaChartLine className={`text-2xl ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            تقدم المشروع العام
          </span>
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {timelineMetrics.progressPercentage}%
          </span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full h-3 ${darkMode ? 'bg-gray-700' : ''}`}>
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${timelineMetrics.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <FaTasks className="inline ml-2" />
          المهام والجدولة
        </h3>
        
        {projectTasks.map((task) => (
          <div 
            key={task.id}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
              darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white/50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span className="mr-1">
                      {task.status === 'completed' ? 'مكتمل' :
                       task.status === 'in-progress' ? 'قيد التنفيذ' :
                       task.status === 'pending' ? 'في الانتظار' : task.status}
                    </span>
                  </span>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {task.name}
                  </h4>
                </div>
                
                <div className="flex items-center space-x-6 space-x-reverse text-sm">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <FaUsers className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{task.assignedTo}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <FaClock className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{task.duration} أيام</span>
                  </div>
                  {task.area && (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>📐</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{task.area} م²</span>
                    </div>
                  )}
                  {task.cost && (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💰</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {Number(task.cost).toLocaleString()} ريال
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
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
            
            {/* Progress bar for individual task */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>التقدم</span>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {Math.round(task.progress)}%
                </span>
              </div>
              <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'in-progress' ? 'bg-blue-500' :
                    task.status === 'delayed' ? 'bg-red-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(100, task.progress)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectTimelineManager;