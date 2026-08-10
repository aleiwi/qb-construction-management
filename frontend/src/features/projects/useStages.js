import { useState, useCallback } from 'react';
import { stagesApi } from './projectsApi';

export const useStages = () => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStages = useCallback(async (buildingId) => {
    setLoading(true);
    setError('');
    try {
      const res = await stagesApi.list(buildingId);
      if (res.success) {
        setStages(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل المراحل');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStage = useCallback(async (data) => {
    const res = await stagesApi.create(data);
    if (res.success) {
      setStages(prev => [...prev, res.data]);
    }
    return res;
  }, []);

  const updateStage = useCallback(async (id, data) => {
    const res = await stagesApi.update(id, data);
    if (res.success) {
      setStages(prev => prev.map(s => s.id === id ? res.data : s));
    }
    return res;
  }, []);

  const updateProgress = useCallback(async (id, progressPercent) => {
    const res = await stagesApi.updateProgress(id, progressPercent);
    if (res.success) {
      setStages(prev => prev.map(s => s.id === id ? res.data : s));
    }
    return res;
  }, []);

  const deleteStage = useCallback(async (id) => {
    const res = await stagesApi.delete(id);
    if (res.success) {
      setStages(prev => prev.filter(s => s.id !== id));
    }
    return res;
  }, []);

  return { stages, loading, error, fetchStages, createStage, updateStage, updateProgress, deleteStage };
};