import { useState, useCallback } from 'react';
import { contractorsApi } from './contractorsApi';

export const useContractors = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchContractors = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    setError('');
    try {
      const res = await contractorsApi.list(page, pageSize);
      if (res.success) setContractors(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل المقاولين');
    } finally {
      setLoading(false);
    }
  }, []);

  const createContractor = useCallback(async (data) => {
    const res = await contractorsApi.create(data);
    if (res.success) setContractors(prev => [res.data, ...prev]);
    return res;
  }, []);

  const updateContractor = useCallback(async (id, data) => {
    const res = await contractorsApi.update(id, data);
    if (res.success) setContractors(prev => prev.map(c => c.id === id ? res.data : c));
    return res;
  }, []);

  const deleteContractor = useCallback(async (id) => {
    const res = await contractorsApi.delete(id);
    if (res.success) setContractors(prev => prev.filter(c => c.id !== id));
    return res;
  }, []);

  return { contractors, loading, error, fetchContractors, createContractor, updateContractor, deleteContractor };
};