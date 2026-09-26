
import React, { useState, useRef, useEffect } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { 
  FaPlus,
  FaCog,
  FaRocket,
  FaCheckCircle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaProjectDiagram,
  FaEllipsisV,
  FaList,
  FaThLarge,
  FaColumns
} from 'react-icons/fa';

// Services
import projectService from '../../services/qb/projectService';

// Sub Components
import ExecutionDashboard from './dashboard/ExecutionDashboard';
import SmartAssistant from './SmartAssistant';
import Sidebar from './dashboard/Sidebar';
import Header from './dashboard/Header';
import { AreaChartComponent, BarChartComponent, CustomGridGauge } from './dashboard/Charts';
import ProjectCard from './dashboard/ProjectCard';
import StatRow from './dashboard/StatRow';
import KanbanBoard from './dashboard/KanbanBoard';
import CalendarView from './dashboard/CalendarView';

const AdvancedDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAssistant, setShowAssistant] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0
  });

  // Effects
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await projectService.getAllProjects();
        setProjects(data || []);
        
        const total = data?.length || 0;
        const active = data?.filter(p => p.status !== 'مكتمل').length || 0;
        const completed = total - active;
        const budget = data?.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0) || 0;

        setStats({
          totalProjects: total,
          activeProjects: active,
          completedProjects: completed,
          totalBudget: budget
        });
      } catch (err) {
        console.error("Failed to load projects", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers
  const handleNewProject = () => navigate('/calculator?mode=new');
  const handleView = (id) => navigate(`/project/${id}`);
  const handleEdit = (id) => navigate(`/calculator?mode=edit&projectId=${id}`);
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "سيتم حذف المشروع نهائياً!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء',
      background: '#fff',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        await projectService.deleteProject(id);
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        // Recalc stats
        const active = updated.filter(p => p.status !== 'مكتمل').length;
        const budget = updated.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0);
        setStats({
            totalProjects: updated.length,
            activeProjects: active,
            completedProjects: updated.length - active,
            totalBudget: budget
        });
        Swal.fire({ title: 'تم الحذف!', text: 'تم حذف المشروع بنجاح.', icon: 'success', customClass: { popup: 'rounded-2xl' } });
      } catch (e) {
        Swal.fire({ title: 'خطأ!', text: 'حدث خطأ أثناء الحذف.', icon: 'error', customClass: { popup: 'rounded-2xl' } });
      }
    }
  };

      const handleStatusChange = async (projectId, newStatus) => {
        const oldProjects = [...projects];
        try {
            // Optimistic update
            const updatedProjects = projects.map(p => 
                p.id === projectId ? { ...p, status: newStatus } : p
            );
            setProjects(updatedProjects);
            
            // Recalc stats for immediate feedback
            const active = updatedProjects.filter(p => !['مكتمل', 'Completed', 'completed'].includes(p.status)).length;
            const total = updatedProjects.length;
            setStats(prev => ({
                ...prev,
                activeProjects: active,
                completedProjects: total - active
            }));

            // Call API
            await projectService.updateProject(projectId, { status: newStatus });
            
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on failure
            setProjects(oldProjects);
            Swal.fire({
                title: 'فشل التحديث',
                text: 'لم نتمكن من حفظ الحالة الجديدة، يرجى المحاولة مرة أخرى.',
                icon: 'error',
                customClass: { popup: 'rounded-2xl' }
            });
        }
      };

  const OverviewTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Top Row: Main Stats / Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Card 1: Unique Gradient Big Number (Hero) */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl shadow-violet-200 transition-all hover:scale-[1.01]"
             style={{ background: 'linear-gradient(120deg, #8B5CF6 0%, #6366F1 100%)' }}>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
            <div>
                <h3 className="text-lg font-medium opacity-80 mb-1">إجمالي الميزانية المرصودة</h3>
                <div className="flex items-baseline gap-2 mt-2">
                <span className="text-6xl font-extrabold tracking-tight">
                    {(stats.totalBudget / 1000000).toFixed(1)}
                </span>
                <span className="text-2xl font-bold opacity-70">مليون</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4 mt-auto">
              <button 
                onClick={handleNewProject}
                className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-white hover:text-[#8B5CF6] transition-all flex items-center gap-2"
              >
                <FaPlus /> مشروع جديد
              </button>
              <div className="text-sm opacity-70 font-medium">
                  + {projects.filter(p => new Date(p.created_at) > new Date(Date.now() - 86400000 * 30)).length} مشاريع جديدة هذا الشهر
              </div>
            </div>
          </div>
          {/* Decor */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 p-8 opacity-10 transform translate-x-4 translate-y-4">
            <FaMoneyBillWave size={200} />
          </div>
        </div>

        {/* Card 2: Area Chart (Performance) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
                <h3 className="font-bold text-lg text-gray-800">الأداء المالي</h3>
                <p className="text-xs text-gray-400">تحليل النمو الشهري</p>
            </div>
            <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">+12%</span>
          </div>
          <div className="h-40 w-full relative">
            <AreaChartComponent projects={projects} />
          </div>
        </div>

        {/* Card 3: Gauge (Completion) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
           <h3 className="font-bold text-gray-800 text-center w-full">إنجاز المشاريع</h3>
           <CustomGridGauge percent={stats.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0} />
        </div>
      </div>

      {/* Middle Row: Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-800">توزيع الميزانية حسب النوع</h3>
              <p className="text-sm text-gray-400 mt-1">مقارنة التكاليف التقديرية لكل قطاع</p>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><FaEllipsisV /></button>
          </div>
          <div className="h-[300px]">
            <BarChartComponent projects={projects} />
          </div>
        </div>

        {/* Breakdown List */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
           <h3 className="text-xl font-bold text-gray-800 mb-6">إحصائيات سريعة</h3>
           <div className="space-y-4">
             <StatRow 
                icon={FaRocket} 
                color="blue" 
                label="مشاريع قيد التنفيذ" 
                value={stats.activeProjects} 
                total={stats.totalProjects}
             />
             <StatRow 
                icon={FaCheckCircle} 
                color="emerald" 
                label="مشاريع مكتملة" 
                value={stats.completedProjects} 
                total={stats.totalProjects}
             />
             <StatRow 
                icon={FaCalendarAlt} 
                color="orange" 
                label="مشاريع متأخرة" 
                value={Math.round(stats.activeProjects * 0.2)} 
                total={stats.totalProjects}
             />
           </div>
           
           <div className="mt-8 pt-6 border-t border-gray-100">
               <p className="text-xs text-gray-400 mb-3 text-center">هل تحتاج للمزيد من التفاصيل؟</p>
               <button className="w-full py-3.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-[#8B5CF6] hover:text-white transition-all">
                   عرض التقارير المتقدمة
               </button>
           </div>
        </div>
      </div>

      {/* Bottom Row: Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1F2937]">المشاريع الأخيرة</h2>
            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-bold">{projects.length}</span>
          </div>
          <button className="text-[#8B5CF6] text-sm font-bold bg-[#8B5CF6]/10 px-4 py-2 rounded-lg hover:bg-[#8B5CF6] hover:text-white transition-all">
            عرض الكل
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.slice(0, 4).map((project) => (
             <ProjectCard 
               key={project.id} 
               project={project} 
               onView={() => handleView(project.id)}
               onEdit={() => handleEdit(project.id)}
               onDelete={() => handleDelete(project.id)}
             />
          ))}
          {projects.length === 0 && (
             <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <FaProjectDiagram size={30} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد مشاريع حتى الآن</h3>
                <p className="text-gray-500 mb-6">ابدأ رحلتك بإضافة أول مشروع لك</p>
                <button 
                  onClick={handleNewProject}
                  className="bg-[#8B5CF6] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl transition-all"
                >
                    إنشاء مشروع جديد
                </button>
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-800 font-sans selection:bg-[#8B5CF6] selection:text-white" dir="rtl">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main 
        className={`transition-all duration-300 min-h-screen
          ${sidebarOpen ? 'md:mr-[260px]' : 'md:mr-[80px]'}
        `}
      >
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
          <Header 
             title={
               activeTab === 'overview' ? 'لوحة القيادة' : 
               activeTab === 'projects' ? 'إدارة المشاريع' :
               activeTab === 'reports' ? 'التقارير التحليلية' : 'الإعدادات'
             }
             showAssistant={showAssistant}
             setShowAssistant={setShowAssistant}
          />

          <AnimatePresence mode="wait">
            {loading ? (
                <motion.div 
                    key="loader"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[60vh]"
                >
                    <div className="w-16 h-16 border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 animate-pulse">جاري تحميل البيانات...</p>
                </motion.div>
            ) : (
                <>
                {activeTab === 'overview' && <OverviewTab />}
                
                {activeTab === 'projects' && (
                <motion.div 
                    key="projects"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* View Switcher & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex bg-gray-100/80 p-1.5 rounded-xl self-start md:self-auto">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-[#8B5CF6] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FaThLarge /> شبكة
                            </button>
                            <button 
                                onClick={() => setViewMode('kanban')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-[#8B5CF6] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FaColumns /> كانبان
                            </button>
                            <button 
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-[#8B5CF6] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FaCalendarAlt /> التقويم
                            </button>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                             <span className="text-gray-400 text-sm font-medium hidden md:inline-block">
                                {projects.length} مشاريع
                             </span>
                             <button 
                                onClick={handleNewProject}
                                className="bg-[#8B5CF6] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#7C3AED] transition-colors flex items-center gap-2 text-sm shadow-lg shadow-purple-200"
                            >
                                <FaPlus /> مشروع جديد
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[600px]">
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">


                                {projects.map(p => (
                                    <ProjectCard 
                                        key={p.id} 
                                        project={p}
                                        onView={() => handleView(p.id)}
                                        onEdit={() => handleEdit(p.id)}
                                        onDelete={() => handleDelete(p.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {viewMode === 'kanban' && (
                            <KanbanBoard 
                                projects={projects}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onStatusChange={handleStatusChange}
                                onAdd={handleNewProject}
                            />
                        )}

                        {viewMode === 'calendar' && (
                            <CalendarView 
                                projects={projects}
                                onView={handleView}
                            />
                        )}
                    </div>
                </motion.div>
                )}

                {activeTab === 'reports' && (
                <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ExecutionDashboard 
                    projects={projects}
                    onUpdateProject={async () => {
                        const data = await projectService.getAllProjects();
                        setProjects(data);
                    }}
                    />
                </motion.div>
                )}

                {activeTab === 'settings' && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 border-2 border-dashed border-gray-200 rounded-[2rem]">
                    <FaCog size={64} className="mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-gray-500">الإعدادات قيد التطوير</h3>
                    <p className="text-sm mt-2 opacity-60">ستتمكن قريباً من تخصيص لوحة التحكم بالكامل</p>
                </div>
                )}
                </>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay: Smart Assistant */}
      {showAssistant && (
        <SmartAssistant 
          projects={projects}
          onAssistantAction={(action) => console.log(action)}
          onClose={() => setShowAssistant(false)}
        />
      )}
    </div>
  );
};

export default AdvancedDashboard;