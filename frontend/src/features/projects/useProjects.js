import { useState, useCallback } from 'react';
import { projectsApi } from './projectsApi';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async ({ page = 1, pageSize = 20, search = '', status = 'all', sort = 'newest' } = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await projectsApi.list(page, pageSize, { search, status, sort });
      if (res.success) {
        setProjects(res.data || []);
        setTotal(res.meta?.total ?? (res.data || []).length);
        setStatusCounts(res.meta?.status_counts || {});
        setPage(res.meta?.page ?? page);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل المشاريع');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data) => {
    const res = await projectsApi.create(data);
    return res;
  }, []);

  const updateProject = useCallback(async (id, data) => {
    const res = await projectsApi.update(id, data);
    if (res.success) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...res.data } : p));
    }
    return res;
  }, []);

  const deleteProject = useCallback(async (id) => {
    const res = await projectsApi.delete(id);
    if (res.success) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    }
    return res;
  }, []);

  return { projects, total, statusCounts, page, loading, error, fetchProjects, createProject, updateProject, deleteProject };
};
