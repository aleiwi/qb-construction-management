
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCircle, FaEllipsisH, FaPlus, FaGripVertical, FaHandRock, FaInfoCircle } from 'react-icons/fa';
import ProjectCard from './ProjectCard';

const COLUMNS = [
  { id: 'تخطيط', label: 'تخطيط', color: 'bg-purple-500', description: 'اسحب المشاريع هنا لإعادتها لمرحلة التخطيط والدراسة.' },
  { id: 'قيد التنفيذ', label: 'قيد التنفيذ', color: 'bg-blue-500', description: 'اسحب المشاريع هنا لبدء العمل الفعلي عليها.' },
  { id: 'معلق', label: 'معلق', color: 'bg-orange-400', description: 'اسحب المشاريع هنا لإيقافها تعليقها مؤقتاً.' },
  { id: 'مكتمل', label: 'مكتمل', color: 'bg-green-500', description: 'اسحب المشاريع هنا لأرشفتها وإغلاقها نهائياً.' },
];

const KanbanBoard = ({ projects, onView, onEdit, onDelete, onStatusChange, onAdd }) => {
  const [draggedProject, setDraggedProject] = React.useState(null);

  // Group projects by status
  const columns = React.useMemo(() => COLUMNS.reduce((acc, col) => {
    acc[col.id] = projects.filter(p => {
        // Normalize status
        const status = p.status || 'تخطيط'; 
        
        // Planning Column: Strict check
        if (col.id === 'تخطيط') {
             return status === 'تخطيط';
        }

        // In Progress Column: Catch-all for active work
        if (col.id === 'قيد التنفيذ') {
            return status === 'قيد التنفيذ' || status === 'الهيكل العظمي' || status === 'تشطيبات' || 
                   (!['تخطيط', 'معلق', 'مكتمل'].includes(status));
        }
        
        return status === col.id;
    });
    return acc;
  }, {}), [projects]);

  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
    e.dataTransfer.setData('text/plain', project.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggedProject && draggedProject.status !== targetStatus) {
      onStatusChange(draggedProject.id, targetStatus);
    }
    setDraggedProject(null);
  };

  return (
    <div className="flex overflow-x-auto gap-8 pb-12 min-h-[calc(100vh-200px)] items-start pt-6 px-4">
      {COLUMNS.map(col => (
        <div 
          key={col.id} 
          className={`
            min-w-[320px] w-full max-w-[380px] flex flex-col h-full transition-all duration-300 rounded-3xl p-4
            ${draggedProject 
                ? 'bg-gray-50/80 ring-2 ring-gray-100 border-2 border-transparent' 
                : 'bg-gray-50/30 border-2 border-dashed border-gray-200'}
          `}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          {/* Minimal Header with Tooltip */}
          <div className="flex items-center justify-between mb-4 px-2 group/header">
            <div className="flex items-center gap-3 relative">
              <span className={`w-3 h-3 rounded-full ${col.color} ring-2 ring-white shadow-sm`}></span>
              
              <div className="flex items-center gap-2 cursor-help relative group/tooltip">
                  <h3 className="font-bold text-gray-700 text-lg">{col.label}</h3>
                  <FaInfoCircle size={12} className="text-gray-300 group-hover/tooltip:text-gray-500 transition-colors" />
                  
                  {/* Tooltip Content */}
                  <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-50 pointer-events-none translate-y-2 group-hover/tooltip:translate-y-0 text-right leading-relaxed font-medium">
                      <div className="absolute -top-1 right-8 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                      {col.description}
                  </div>
              </div>

              <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-semibold text-gray-500 border border-gray-100/50">
                {columns[col.id]?.length || 0}
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-black/5 transition-colors">
              <FaPlus size={12} onClick={onAdd} />
            </button>
          </div>

          {/* Cards List - Clean & Open */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 pb-8 custom-scrollbar">
            <AnimatePresence>
            {columns[col.id]?.map((project, index) => (
              <motion.div
                key={project.id}
                layoutId={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, project)}
                className="group cursor-grab active:cursor-grabbing"
                onClick={() => onView(project.id)}
              >
                  {/* "Ticket" Style Card - iOS Handle */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative">
                    
                    {/* Drag Handlebar (iOS Style) */}
                    <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-3 group-hover:bg-gray-200 transition-colors" />

                    {/* Hover Actions: Menu */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(project.id); }} className="p-1.5 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all">
                            <FaEllipsisH size={12} />
                        </button>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-col gap-2">
                        {/* Tags / ID */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${col.color}`}></span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                {String(project.id || '').split('-')[0].slice(0,6)}
                            </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-gray-800 text-[0.95rem] leading-snug group-hover:text-sky-700 transition-colors">
                            {project.name}
                        </h4>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2 pt-3 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400">الميزانية</span>
                                <span className="text-xs font-bold text-gray-700 font-mono">
                                    {(project.estimated_cost || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-gray-400">الإنجاز</span>
                                <div className="flex items-center gap-2 w-full justify-end">
                                    <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${col.color}`} style={{ width: `${project.completion_rate || 0}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600">{project.completion_rate}%</span>
                                </div>
                            </div>
                            
                            {project.deadline && (
                                <div className="col-span-2 flex items-center gap-1.5 mt-1 bg-gray-50 rounded px-2 py-1 w-fit">
                                    <div className={`w-1.5 h-1.5 rounded-sm ${new Date(project.deadline) < new Date() ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                    <span className={`text-[10px] font-medium ${new Date(project.deadline) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
                                        {new Date(project.deadline).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
            
          {/* Sticky Footer: Add Button & Hint */}
          <div className="mt-auto pt-3 relative z-10">
            {columns[col.id]?.length > 0 && (
                <div className="flex items-center justify-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-1 group-hover:translate-y-0">
                     <span className="text-[10px] text-gray-400 font-medium select-none">
                        اسحب البطاقة للنقل
                     </span>
                     <FaHandRock size={10} className="text-gray-400 animate-bounce" />
                </div>
            )}
            
            <button onClick={onAdd} className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition-all flex items-center justify-center gap-2 text-xs font-bold group bg-white/40 backdrop-blur-md">
                <FaPlus size={10} />
                <span>إضافة بطاقة</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
