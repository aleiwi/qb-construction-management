
import React from 'react';
import { motion } from 'framer-motion';
import { FaProjectDiagram, FaMapMarkerAlt, FaCog } from 'react-icons/fa';

const ProjectCard = ({ project, onView, onEdit, onDelete }) => {
  return (
    <motion.div 
      whileHover={{ y: -6, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 text-[#8B5CF6] flex items-center justify-center text-xl group-hover:from-[#8B5CF6] group-hover:to-[#6366F1] group-hover:text-white transition-all duration-500">
          <FaProjectDiagram />
        </div>
        <div className="flex gap-1">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
            project.status === 'مكتمل' 
              ? 'bg-emerald-100 text-emerald-600' 
              : 'bg-blue-50 text-blue-600'
          }`}>
            {project.status || 'قيد العمل'}
          </span>
        </div>
      </div>
      
      <h3 className="font-bold text-gray-800 mb-1 text-lg line-clamp-1 group-hover:text-[#8B5CF6] transition-colors">{project.name}</h3>
      <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 font-medium">
        <FaMapMarkerAlt className="text-gray-300" /> {project.location || 'غير محدد'}
      </p>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
           <span className="text-gray-400 text-xs font-medium">الميزانية</span>
           <span className="font-bold text-gray-800 font-mono">{(project.estimated_cost || 0).toLocaleString()} <span className="text-xs text-gray-400">ر.س</span></span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
           <div 
             className="bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] h-full rounded-full transition-all duration-1000" 
             style={{ width: `${Math.random() * 40 + 20}%` }} 
           />
        </div>
      </div>
      
      <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
        <button onClick={onView} className="flex-1 py-2.5 text-xs font-bold text-white bg-[#1F2937] rounded-xl hover:bg-black transition-colors shadow-lg shadow-gray-200">عرض التفاصيل</button>
        <button onClick={onEdit} className="p-2.5 text-gray-400 hover:text-[#8B5CF6] hover:bg-purple-50 rounded-xl transition-colors"><FaCog /></button>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
