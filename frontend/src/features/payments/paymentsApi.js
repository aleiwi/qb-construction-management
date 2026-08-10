import api from '../../api/axios';

export const paymentsApi = {
  list: async (params = {}) => {
    const res = await api.get('/payments', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/payments/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/payments', data);
    return res.data;
  },
  approve: async (id) => {
    const res = await api.patch(`/payments/${id}/approve`);
    return res.data;
  },
  markPaid: async (id) => {
    const res = await api.patch(`/payments/${id}/mark-paid`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/payments/${id}`);
    return res.data;
  },
};

export const retentionsApi = {
  list: async (params = {}) => {
    const res = await api.get('/retention-releases', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/retention-releases', data);
    return res.data;
  },
  release: async (id) => {
    const res = await api.patch(`/retention-releases/${id}/release`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/retention-releases/${id}`);
    return res.data;
  },
};