import api from '../../api/axios';

export const projectsApi = {
  list: async (page = 1, pageSize = 20) => {
    const res = await api.get('/projects', { params: { page, page_size: pageSize } });
    return res.data;
  },

  get: async (projectId) => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/projects', data);
    return res.data;
  },

  update: async (projectId, data) => {
    const res = await api.put(`/projects/${projectId}`, data);
    return res.data;
  },

  delete: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  },
};

export const buildingsApi = {
  list: async (projectId, page = 1, pageSize = 50) => {
    const params = { page, page_size: pageSize };
    if (projectId) params.project_id = projectId;
    const res = await api.get('/buildings', { params });
    return res.data;
  },

  get: async (buildingId) => {
    const res = await api.get(`/buildings/${buildingId}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/buildings', data);
    return res.data;
  },

  update: async (buildingId, data) => {
    const res = await api.put(`/buildings/${buildingId}`, data);
    return res.data;
  },

  delete: async (buildingId) => {
    const res = await api.delete(`/buildings/${buildingId}`);
    return res.data;
  },
};

export const stagesApi = {
  list: async (buildingId) => {
    const params = {};
    if (buildingId) params.building_id = buildingId;
    const res = await api.get('/stages', { params });
    return res.data;
  },

  get: async (stageId) => {
    const res = await api.get(`/stages/${stageId}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/stages', data);
    return res.data;
  },

  update: async (stageId, data) => {
    const res = await api.put(`/stages/${stageId}`, data);
    return res.data;
  },

  updateProgress: async (stageId, progressPercent) => {
    const res = await api.patch(`/stages/${stageId}/progress`, { progress_percent: progressPercent });
    return res.data;
  },

  delete: async (stageId) => {
    const res = await api.delete(`/stages/${stageId}`);
    return res.data;
  },
};