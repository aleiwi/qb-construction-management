import { useState, useCallback } from 'react';
import { projectsApi } from './projectsApi';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    setError('');
    try {
      const res = await projectsApi.list(page, pageSize);
      if (res.success) {
        setProjects(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل المشاريع');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data) => {
    const res = await projectsApi.create(data);
    if (res.success) {
      setProjects(prev => [res.data, ...prev]);
    }
    return res;
  }, []);

  const updateProject = useCallback(async (id, data) => {
    const res = await projectsApi.update(id, data);
    if (res.success) {
      setProjects(prev => prev.map(p => p.id === id ? res.data : p));
    }
    return res;
  }, []);

  const deleteProject = useCallback(async (id) => {
    const res = await projectsApi.delete(id);
    if (res.success) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
    return res;
  }, []);

  return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject };
};