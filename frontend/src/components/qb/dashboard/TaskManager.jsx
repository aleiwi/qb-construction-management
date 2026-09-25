
import React, { useState } from 'react';
import { FaPlus, FaCheck, FaTrash, FaTasks } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import projectService from '../../services/projectService';
import { toast } from 'react-hot-toast';

const TaskManager = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch tasks on mount
  React.useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectTasks(projectId);
      setTasks(data || []);
    } catch (error) {
      console.error("Failed to load tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !projectId) return;

    const tempId = Date.now();
    const taskText = newTask;
    
    // Optimistic Update
    const optimisticTask = { id: tempId, text: taskText, completed: false, isTemp: true };
    setTasks([...tasks, optimisticTask]);
    setNewTask('');

    try {
      const createdTask = await projectService.addTask(projectId, { text: taskText });
      // Replace temp task with real one
      setTasks(prev => prev.map(t => t.id === tempId ? createdTask : t));
    } catch (error) {
      console.error("Failed to add task", error);
      toast.error('فشل إضافة المهمة');
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const toggleTask = async (task) => {
    // Optimistic Update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));

    try {
      await projectService.updateTask(projectId, task.id, { completed: !task.completed });
    } catch (error) {
      console.error("Failed to update task", error);
      toast.error('فشل تحديث المهمة');
      // Revert
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
    }
  };

  const removeTask = async (id) => {
    const originalTasks = [...tasks];
    // Optimistic Update
    setTasks(tasks.filter(t => t.id !== id));

    try {
      await projectService.deleteTask(projectId, id);
    } catch (error) {
      console.error("Failed to delete task", error);
      toast.error('فشل حذف المهمة');
      setTasks(originalTasks);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FaTasks size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">المهام المطلوبة</h3>
            <p className="text-xs text-gray-400">تابع تقدم العمل خطوة بخطوة</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">
          {tasks.filter(t => t.completed).length}/{tasks.length}
        </span>
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-4 relative">
        <input 
          type="text" 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="أضف مهمة جديدة..." 
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        <button 
          type="submit"
          disabled={!newTask.trim()}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPlus size={12} />
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar max-h-[300px]">
        {loading ? (
             <div className="flex justify-center py-4"><span className="loading loading-spinner loading-sm text-indigo-500"></span></div>
        ) : (
        <AnimatePresence initial={false}>
          {tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`
                group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                ${task.completed ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-100 hover:border-gray-200'}
                ${task.isTemp ? 'opacity-70' : ''}
              `}
              onClick={() => toggleTask(task)}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-indigo-400'}
                `}>
                  {task.completed && <FaCheck size={10} className="text-white" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.text}
                </span>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <FaTrash size={12} />
              </button>
            </motion.div>
          ))}
          {!loading && tasks.length === 0 && (
            <div className="text-center py-8 text-gray-300">
               <p className="text-sm">لا توجد مهام حالياً</p>
            </div>
          )}
        </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
