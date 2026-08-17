import api from '../../api/axios';

const BASE = api.defaults.baseURL;

export const drawingsApi = {
  list: async (params = {}) => {
    const res = await api.get('/drawings', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/drawings/${id}`);
    return res.data;
  },
  upload: async (buildingId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/drawings?building_id=${buildingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      return res.data;
    } catch (err) {
      return err.response?.data || { success: false, data: null, message: null, error: { code: 'ERROR', message: err.message || 'فشل الرفع' } };
    }
  },
  uploadBatch: async (buildingId, files, onProgress) => {
    const results = [];
    let completed = 0;
    for (const file of files) {
      try {
        const res = await drawingsApi.upload(buildingId, file);
        results.push({ file: file.name, success: true, data: res.data });
      } catch (err) {
        results.push({ file: file.name, success: false, error: err.response?.data?.error?.message || err.response?.data?.message || err.message });
      }
      completed++;
      if (onProgress) onProgress(completed, files.length);
    }
    return results;
  },
  delete: async (id) => {
    const res = await api.delete(`/drawings/${id}`);
    return res.data;
  },
  getPreview: async (id) => {
    const res = await api.get(`/drawings/${id}/preview`);
    return res.data;
  },
  getDownloadUrl: (id) => {
    return `${BASE}/drawings/${id}/download`;
  },
  download: async (id, filename = 'drawing.dxf') => {
    const res = await api.get(`/drawings/${id}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  getViewUrl: (id) => {
    return `${BASE}/drawings/${id}/view`;
  },
  getView: async (id) => {
    const res = await api.get(`/drawings/${id}/view`, { responseType: 'text', timeout: 300000 });
    return res.data;
  },
};

export const boqElementsApi = {
  list: async (drawingId, { skip = 0, limit = 500, search = '', elementType = '', classificationStatus = '' } = {}) => {
    const params = { drawing_id: drawingId, skip, limit };
    if (search) params.search = search;
    if (elementType) params.element_type = elementType;
    if (classificationStatus) params.classification_status = classificationStatus;
    const res = await api.get('/boq-elements', { params });
    return res.data;
  },
  summary: async (drawingId) => {
    const res = await api.get('/boq-elements/summary', { params: { drawing_id: drawingId } });
    return res.data;
  },
  unclassified: async (skip = 0, limit = 50) => {
    const res = await api.get('/boq-elements/unclassified', { params: { skip, limit } });
    return res.data;
  },
  classify: async (elementId, data) => {
    const res = await api.patch(`/boq-elements/${elementId}/classify`, data);
    return res.data;
  },
  bulkClassify: async (elementIds, elementType) => {
    const res = await api.post('/boq-elements/bulk-classify', null, {
      params: { element_ids: elementIds, element_type: elementType },
    });
    return res.data;
  },
  reclassifyAI: async (drawingId = null, useLlm = false, limit = 200) => {
    const params = { use_llm: useLlm, limit };
    if (drawingId) params.drawing_id = drawingId;
    const res = await api.post('/boq-elements/reclassify-ai', null, { params });
    return res.data;
  },
  stats: async () => {
    const res = await api.get('/boq-elements/stats');
    return res.data;
  },
};

export const priceLibraryApi = {
  list: async () => {
    const res = await api.get('/price-library');
    return res.data;
  },
  upsert: async (data) => {
    const res = await api.post('/price-library', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/price-library/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/price-library/${id}`);
    return res.data;
  },
};

export const boqSummaryApi = {
  getByProject: async (projectId) => {
    const res = await api.get(`/boq-summary/project/${projectId}`);
    return res.data;
  },
};

export const boqItemsApi = {
  list: async (boqElementId) => {
    const res = await api.get('/boq-items', { params: { boq_element_id: boqElementId } });
    return res.data;
  },
  link: async (data) => {
    const res = await api.post('/boq-items', data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/boq-items/${id}`);
    return res.data;
  },
};