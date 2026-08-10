import api from '../../api/axios';

export const employeesApi = {
  list: async (params = {}) => {
    const res = await api.get('/hr/employees', { params });
    return res.data;
  },
  stats: async () => {
    const res = await api.get('/hr/employees/stats');
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/hr/employees/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/hr/employees', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/hr/employees/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/hr/employees/${id}`);
    return res.data;
  },
};

export const attendanceApi = {
  list: async (params = {}) => {
    const res = await api.get('/hr/attendance', { params });
    return res.data;
  },
  stats: async (date) => {
    const res = await api.get('/hr/attendance/stats', { params: { target_date: date } });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/hr/attendance', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/hr/attendance/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/hr/attendance/${id}`);
    return res.data;
  },
};