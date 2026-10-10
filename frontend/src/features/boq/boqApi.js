import api from '../../api/axios';

const BASE = api.defaults.baseURL;

// Shared CAD upload policy (P1: single source — both DrawingsPage modal and
// BatchUploadPage previously re-implemented extension checks with no size cap).
export const CAD_EXTENSIONS = ['dxf', 'dwg'];
export const MAX_CAD_FILE_SIZE_MB = 50;
export const MAX_CAD_FILE_SIZE = MAX_CAD_FILE_SIZE_MB * 1024 * 1024;

/** Returns an Arabic error message, or null when the file is acceptable. */
export function validateCadFile(file) {
  if (!file) return 'ملف غير صالح';
  const ext = (file.name?.split('.').pop() || '').toLowerCase();
  if (!CAD_EXTENSIONS.includes(ext)) return `الصيغة غير مدعومة (${file.name}): يُقبل .dxf و .dwg فقط`;
  if (file.size === 0) return `الملف فارغ (${file.name})`;
  if (file.size > MAX_CAD_FILE_SIZE) {
    return `الملف كبير جدًا (${file.name} — ${(file.size / 1048576).toFixed(1)}MB، الحد ${MAX_CAD_FILE_SIZE_MB}MB)`;
  }
  return null;
}

/** Splits a FileList/array into {valid, rejected:[{file, error}]}. */
export function partitionCadFiles(files) {
  const valid = [];
  const rejected = [];
  for (const f of files || []) {
    const err = validateCadFile(f);
    if (err) rejected.push({ file: f, error: err });
    else valid.push(f);
  }
  return { valid, rejected };
}

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
  uploadBatch: async (buildingId, files, onProgress, concurrency = 3) => {
    // P1: bounded-parallel uploads (was strictly sequential — N files took N
    // round-trips back-to-back; unbounded Promise.all would spike memory).
    const results = new Array(files.length);
    let completed = 0;
    let next = 0;
    const worker = async () => {
      while (true) {
        const i = next++;
        if (i >= files.length) return;
        try {
          const res = await drawingsApi.upload(buildingId, files[i]);
          results[i] = { file: files[i].name, success: !!res.success, data: res.data, error: res.success ? undefined : (res.error?.message || res.message || 'فشل الرفع') };
        } catch (err) {
          results[i] = { file: files[i].name, success: false, error: err.response?.data?.error?.message || err.response?.data?.message || err.message || 'فشل الرفع' };
        }
        completed++;
        if (onProgress) onProgress(completed, files.length);
      }
    };
    const workers = Array.from({ length: Math.min(Math.max(concurrency, 1), files.length) }, () => worker());
    await Promise.all(workers);
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
  unclassifiedCount: async () => {
    const res = await api.get('/boq-elements/unclassified/count');
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
  history: async (id, limit = 50) => {
    const res = await api.get(`/price-library/${id}/history`, { params: { limit } });
    return res.data;
  },
};

export const boqSummaryApi = {
  getByProject: async (projectId) => {
    // تجميع مشروع ضخم (مليون+ عنصر) يتجاوز مهلة 30ث الافتراضية — سابقة 300ث معتمدة
    const res = await api.get(`/boq-summary/project/${projectId}`, { timeout: 300000 });
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