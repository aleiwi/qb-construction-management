import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaTasks, FaSpinner, FaSave, FaFilePdf, FaFileExcel, FaChartLine, FaInfoCircle, FaExclamationTriangle, FaCalendarAlt, FaLayerGroup, FaPaintRoller } from 'react-icons/fa';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import projectService from '../../services/projectService';

const ExecutionDashboard = ({ projects = [], onUpdateProject }) => {
  const [localProjects, setLocalProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (projects) {
      // Initialize rate fields if they don't exist
      const initializedProjects = projects.map(p => ({
          ...p,
          bone_rate: p.bone_rate || 0,
          finishing_rate: p.finishing_rate || 0
      }));
      setLocalProjects(initializedProjects);
    }
  }, [projects]);

  const calculateDateProgress = (project) => {
    if (!project.start_date || !project.delivery_date) return 0;

    const startDate = new Date(project.start_date);
    const endDate = new Date(project.delivery_date);
    const today = new Date();

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

  const handleRateChange = (id, field, value) => {
    setLocalProjects(prev => prev.map(p => {
      if (p.id !== id) return p;

      const numValue = parseInt(value);
      const updatedProject = { ...p, [field]: numValue };
      
      // Auto-calculate total completion rate
      // Assuming equal weight (50% Bone, 50% Finishing)
      // Or you can adjust weights: (Bone * 0.4) + (Finishing * 0.6) etc.
      updatedProject.completion_rate = Math.round(
          (updatedProject.bone_rate + updatedProject.finishing_rate) / 2
      );

      return updatedProject;
    }));
  };

  const saveAllProgress = async () => {
    setLoading(true);
    try {
      const updates = localProjects.map(project => {
        const original = projects.find(p => p.id === project.id);
        
        // Check if ANY field changed
        const hasChanged = original && (
            original.completion_rate !== project.completion_rate ||
            original.bone_rate !== project.bone_rate ||
            original.finishing_rate !== project.finishing_rate
        );

        if (hasChanged) {
           return projectService.updateProject(project.id, { 
             completion_rate: project.completion_rate,
             bone_rate: project.bone_rate,
             finishing_rate: project.finishing_rate
           });
        }
        return Promise.resolve();
      });

      await Promise.all(updates);
      
      Swal.fire({
        icon: 'success',
        title: 'تم الحفظ',
        text: 'تم تحديث نسب الإنجاز (العظم والتشطيب) بنجاح',
        timer: 1500,
        showConfirmButton: false
      });
      
      if (onUpdateProject) onUpdateProject();
      
    } catch (error) {
      console.error('Save Error:', error);
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء حفظ التغييرات' });
    }
    setLoading(false);
  };

  const handleExportPdf = async () => {
    // ... Existing PDF Export Logic (unchanged for now, just capturing the screen)
    const reportElement = document.getElementById('printable-report');
    if (!reportElement) return;

    try {
      Swal.fire({ title: 'جاري التصدير...', didOpen: () => Swal.showLoading() });
      const canvas = await html2canvas(reportElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`execution_report_${new Date().toISOString().split('T')[0]}.pdf`);
      Swal.close();
      Swal.fire({ icon: 'success', title: 'تم التصدير', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("PDF Export Error:", error);
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل التصدير' });
    }
  };

  const handleExportExcel = async () => {
       // Ideally update this to include new columns, but for now it uses the same generic generator.
       // We can pass enriched data if needed, or update the generator separately.
       try {
        Swal.fire({ title: 'جاري التصدير...', didOpen: () => Swal.showLoading() });
        let chartImage = null;
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
            chartImage = canvas.toDataURL('image/png');
        }
        const { generateExecutionExcel } = await import('../../utils/executionReportGenerator');
        
        // Pass enriched projects with formatted name for Excel if needed, 
        // or modify the generator to accept arbitrary columns.
        // For now, let's keep it simple as the user asked for UI/Chart primarily.
        await generateExecutionExcel(localProjects, chartImage); 
        
        Swal.close();
        Swal.fire({ icon: 'success', title: 'تم التصدير', timer: 1500, showConfirmButton: false });
      } catch (error) {
        console.error("Excel Export Error:", error);
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تصدير Excel' });
      }
  };

  // Prepare Chart Data
  const chartData = localProjects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0,15) + '...' : p.name,
    actual: p.completion_rate,
    bone: p.bone_rate || 0,
    finishing: p.finishing_rate || 0,
    planned: calculateDateProgress(p), 
    status: p.status
  }));

  const getStatusColor = (rate, planned) => {
    if (rate >= 100) return 'text-green-600';
    if (rate < planned - 10) return 'text-red-500'; 
    return 'text-blue-600'; 
  };

  return (
    <div className="space-y-6 print:space-y-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
        <div>
          <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-white">
            <FaTasks className="ml-2 text-blue-500" />
            متابعة نسب الإنجاز (عظم / تشطيب)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">تحديث مراحل العمل التفصيلية</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button onClick={saveAllProgress} disabled={loading} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? <FaSpinner className="animate-spin ml-2" /> : <FaSave className="ml-2" />} حفظ
          </button>
          <div className="h-8 w-px bg-gray-300 mx-2 self-center"></div>
          <button onClick={handleExportPdf} className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition"><FaFilePdf className="ml-2" /> PDF</button>
          <button onClick={handleExportExcel} className="flex items-center px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition"><FaFileExcel className="ml-2" /> Excel</button>
        </div>
      </div>

      {/* Charts Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 print:shadow-none print:border-none">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center text-gray-800 dark:text-white">
            <FaChartLine className="ml-2 text-purple-500" />
            تفاصيل الإنجاز (عظم vs تشطيب)
          </h3>
        </div>
        <div className="h-96 w-full text-xs" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{fill: '#6b7280'}} />
              <YAxis unit="%" tick={{fill: '#6b7280'}} domain={[0, 100]} />
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', textAlign: 'right' }}
                 formatter={(value, name) => {
                     if (name === 'bone') return [`${value}%`, 'عظم'];
                     if (name === 'finishing') return [`${value}%`, 'تشطيب'];
                     if (name === 'planned') return [`${value}%`, 'المخطط'];
                     return [`${value}%`, name];
                 }}
              />
              <Legend verticalAlign="top" height={36}/>
              {/* Side by Side Bars */}
              <Bar dataKey="bone" name="عظم" fill="#f59e0b" barSize={20} radius={[4, 4, 0, 0]} />
              <Bar dataKey="finishing" name="تشطيب" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
              {/* Line for context */}
              <Line type="monotone" name="المخطط الزمني" dataKey="planned" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Grid List for Editing */}
      <div className="grid grid-cols-1 gap-4">
        {localProjects.map((project, index) => {
           const planned = calculateDateProgress(project);
           return (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-stretch gap-4"
            >
              {/* Top Row: Info & Total */}
              <div className="flex justify-between items-start border-b pb-4 mb-2">
                  <div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">{project.name}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1 gap-3">
                        <span className="flex items-center"><FaCalendarAlt className="ml-1" /> تسليم: {project.delivery_date ? new Date(project.delivery_date).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                      </div>
                  </div>
                  <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">الإنجاز الكلي</div>
                      <div className={`text-2xl font-bold ${getStatusColor(project.completion_rate, planned)}`}>
                          {project.completion_rate}%
                      </div>
                      <div className="text-[10px] text-gray-400">محسوب تلقائياً</div>
                  </div>
              </div>

              {/* Sliders Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                  {/* Bone Slider */}
                  <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                      <div className="flex justify-between mb-2">
                          <span className="flex items-center text-orange-800 font-bold text-sm">
                              <FaLayerGroup className="ml-2" /> عظم
                          </span>
                          <span className="font-bold text-orange-600">{project.bone_rate}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={project.bone_rate || 0}
                        onChange={(e) => handleRateChange(project.id, 'bone_rate', e.target.value)}
                        className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                  </div>

                  {/* Finishing Slider */}
                  <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                      <div className="flex justify-between mb-2">
                          <span className="flex items-center text-emerald-800 font-bold text-sm">
                              <FaPaintRoller className="ml-2" /> تشطيب
                          </span>
                          <span className="font-bold text-emerald-600">{project.finishing_rate}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={project.finishing_rate || 0}
                        onChange={(e) => handleRateChange(project.id, 'finishing_rate', e.target.value)}
                        className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                  </div>
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* Hidden Report Template for Capture - PROPERLY STYLED FOR HTML2CANVAS */}
      <div 
        id="printable-report" 
        style={{ 
          position: 'fixed', 
          top: '-10000px', 
          left: '0', 
          width: '297mm', // A4 Landscape
          minHeight: '210mm',
          height: 'auto', // Allow expansion
          backgroundColor: '#fff',
          padding: '20mm',
          direction: 'rtl',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: -1,
          visibility: 'visible' // Explicitly visible for capture
        }}
      >
        <div className="text-center mb-10">
           <h1 className="text-4xl font-bold mb-6 text-gray-800">تقرير متابعة تنفيذ المشاريع</h1>
           <div className="flex justify-center items-center gap-3 text-xl text-gray-600">
             <span className="font-bold">تاريخ التقرير:</span>
             <span dir="ltr" className="font-sans">{new Date().toLocaleDateString('en-GB')}</span>
           </div>
        </div>

        {/* Chart Section in Report */}
        <div className="mb-10 p-6 border rounded-xl bg-white shadow-sm" style={{ height: '400px' }}>
           <h3 className="text-2xl font-bold mb-6 text-right flex items-center gap-2">
             <span className="w-4 h-4 bg-purple-500 rounded-full inline-block"></span>
             مخطط الإنجاز العام
           </h3>
           <div className="w-full h-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 14 }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '16px' }} />
                    <Bar dataKey="bone" name="عظم" fill="#f59e0b" barSize={30} />
                    <Bar dataKey="finishing" name="تشطيب" fill="#10b981" barSize={30} />
                    <Line type="monotone" name="المخطط الزمني" dataKey="planned" stroke="#6366f1" strokeWidth={3} dot={false} />
                  </ComposedChart>
               </ResponsiveContainer>
           </div>
        </div>

        {/* Table Section in Report */}
        <div className="mt-8">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-4 text-xl border">اسم المشروع</th>
                <th className="p-4 text-xl border">عظم</th>
                <th className="p-4 text-xl border">تشطيب</th>
                <th className="p-4 text-xl border">الإنجاز الكلي</th>
              </tr>
            </thead>
            <tbody>
              {localProjects.map((p, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-4 text-lg border font-bold">{p.name}</td>
                  <td className="p-4 text-lg border text-orange-600 font-bold" dir="ltr">{p.bone_rate}%</td>
                  <td className="p-4 text-lg border text-emerald-600 font-bold" dir="ltr">{p.finishing_rate}%</td>
                  <td className="p-4 text-lg border font-black text-blue-800" dir="ltr">{p.completion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        

      </div>

    </div>
  );
};

export default ExecutionDashboard;
