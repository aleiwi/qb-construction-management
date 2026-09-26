import React, { useState, useEffect, useCallback, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTrash, FaPlus, FaSpinner, FaTasks, FaEdit } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TaskManager = ({ projectId }) => {
  const taskRef = useRef(null);
    const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      if (res.data.success) setTasks(res.data.data);
    } catch (e) {}
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async () => {
    if (!newTask.trim() || !projectId) return;
    try {
      const res = await api.post(`/projects/${projectId}/tasks`, { task_text: newTask });
      if (res.data.success) {
        setTasks(prev => [...prev, res.data.data]);
        setNewTask('');
        toast.success('تم إضافة المهمة');
      }
    } catch (e) { toast.error('فشل الإضافة'); }
  };

  const toggleTask = async (taskId, isCompleted) => {
    if (!projectId) return;
    try {
      const res = await api.put(`/projects/${projectId}/tasks/${taskId}`, { is_completed: !isCompleted });
      if (res.data.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !isCompleted } : t));
        toast.success(isCompleted ? 'تم إعادة المهمة' : 'تم إنجاز المهمة');
      }
    } catch (e) {}
  };

  const deleteTask = async (taskId) => {
    if (!projectId) return;
    try {
      const res = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      if (res.data.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success('تم حذف المهمة');
      }
    } catch (e) {}
  };

  if (loading) return <div className="flex items-center justify-center p-8"><FaSpinner className="animate-spin text-blue-500" /></div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <FaTasks className="text-blue-500" /> المهام ({tasks.length})
      </h3>
      <div className="flex gap-2 mb-4">
        <input value={newTask} onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          placeholder="أضف مهمة جديدة..." />
        <button onClick={addTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1">
          <FaPlus /> إضافة
        </button>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {tasks.map(task => (
            <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${task.is_completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}`}>
              <button onClick={() => toggleTask(task.id, task.is_completed)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition">
                {task.is_completed ? <FaCheck className="text-green-500" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
              </button>
              <span className={`flex-1 text-sm ${task.is_completed ? 'line-through text-green-600' : 'text-slate-700 dark:text-slate-200'}`}>
                {task.task_text}
              </span>
              <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600"><FaTrash className="w-3 h-3" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaskManager;
