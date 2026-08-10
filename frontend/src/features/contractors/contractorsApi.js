import api from '../../api/axios';

export const contractorsApi = {
  list: async (page = 1, pageSize = 20) => {
    const res = await api.get('/contractors', { params: { page, page_size: pageSize } });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/contractors/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/contractors', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/contractors/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/contractors/${id}`);
    return res.data;
  },
};

export const contractsApi = {
  list: async (params = {}) => {
    const res = await api.get('/contracts', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/contracts/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/contracts', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/contracts/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/contracts/${id}`);
    return res.data;
  },
};