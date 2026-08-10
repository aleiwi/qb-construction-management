import { useState, useCallback } from 'react';
import { buildingsApi } from './projectsApi';

export const useBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBuildings = useCallback(async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const res = await buildingsApi.list(projectId);
      if (res.success) {
        setBuildings(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل المباني');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBuilding = useCallback(async (data) => {
    const res = await buildingsApi.create(data);
    if (res.success) {
      setBuildings(prev => [res.data, ...prev]);
    }
    return res;
  }, []);

  const updateBuilding = useCallback(async (id, data) => {
    const res = await buildingsApi.update(id, data);
    if (res.success) {
      setBuildings(prev => prev.map(b => b.id === id ? res.data : b));
    }
    return res;
  }, []);

  const deleteBuilding = useCallback(async (id) => {
    const res = await buildingsApi.delete(id);
    if (res.success) {
      setBuildings(prev => prev.filter(b => b.id !== id));
    }
    return res;
  }, []);

  return { buildings, loading, error, fetchBuildings, createBuilding, updateBuilding, deleteBuilding };
};