// completionReportsApi.js — Multi-snapshot API integration (after plan update 2026-07-27)
import api from '../../api/axios';

export const completionReportsApi = {
  // قائمة كافة تقارير المشروع عبر الفترات
  list: async (projectId) => {
    const res = await api.get('/completion-reports', { params: { project_id: projectId } });
    return res.data;
  },
  // جلب تقرير محدد بـ ID
  get: async (reportId) => {
    const res = await api.get(`/completion-reports/${reportId}`);
    return res.data;
  },
  // إنشاء تقرير جديد
  create: async (payload) => {
    const res = await api.post('/completion-reports', payload);
    return res.data;
  },
  // تحديث تقرير محدد
  update: async (reportId, payload) => {
    const res = await api.put(`/completion-reports/${reportId}`, payload);
    return res.data;
  },
  // حذف تقرير
  remove: async (reportId) => {
    const res = await api.delete(`/completion-reports/${reportId}`);
    return res.data;
  },
  // === استنساخ آخر تقرير للفترة الجديدة (Snapshot Inheritance) ===
  clonePrevious: async (projectId, payload) => {
    const res = await api.post(`/completion-reports/projects/${projectId}/clone-previous`, payload);
    return res.data;
  },
  // === تصدير PDF احترافي عبر Playwright Headless (Backend) ===
  exportPDF: async (reportData) => {
    const res = await api.post(
      '/completion-reports/export-pdf',
      { report_data: reportData },
      {
        responseType: 'blob',
        timeout: 120000, // 2 minutes — Playwright rendering takes time
      }
    );
    // Trigger browser download
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    const projectName = reportData.projectName?.replace(/\s+/g, '_') || 'تقرير';
    link.setAttribute('download', `تقرير_الإنجاز_${projectName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};