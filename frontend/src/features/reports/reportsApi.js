import api from '../../api/axios';

export const reportsApi = {
  kpis: async () => {
    const res = await api.get('/reports/kpis');
    return res.data;
  },
};