import api from '../../api/axios';

export const qualityChecksApi = {
  list: async (params = {}) => {
    const res = await api.get('/quality-checks', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/quality-checks/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/quality-checks', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/quality-checks/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/quality-checks/${id}`);
    return res.data;
  },
};