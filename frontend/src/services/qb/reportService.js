// خدمة التقارير والتصدير
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

/**
 * خدمة التقارير
 */
class ReportService {
  /**
   * إنشاء تقرير PDF
   */
  async generatePDFReport(projectData, results) {
    try {
      const response = await api.post('/reports/pdf', {
        project: {
          name: projectData.name || 'مشروع غير مسمى',
          description: projectData.description || '',
          date: new Date().toLocaleDateString('en-US'),
        },
        calculations: {
          items: results.items,
          totals: results.totals,
          summary: {
            totalItems: results.items?.length || 0,
            finalPrice: results.totals?.finalPrice || 0,
            accuracy: '100%',
          }
        },
        settings: {
          concretePrice: projectData.concretePrice,
          steelPrice: projectData.steelPrice,
          blockPrice: projectData.blockPrice,
          factoryRate: projectData.factoryRate,
          overheadRate: projectData.overheadRate,
          profitRate: projectData.profitRate,
        }
      }, {
        responseType: 'blob'
      });
      
      // تحميل الملف
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectData.name || 'تقرير_المشروع'}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('تم إنشاء تقرير PDF بنجاح! 📄');
      return true;
    } catch (error) {
      console.error('خطأ في إنشاء تقرير PDF:', error);
      toast.error('فشل في إنشاء تقرير PDF');
      throw error;
    }
  }

  /**
   * إنشاء تقرير Excel
   */
  async generateExcelReport(projectData, results) {
    try {
      const response = await api.post('/reports/excel', {
        project: {
          name: projectData.name || 'مشروع غير مسمى',
          description: projectData.description || '',
          date: new Date().toLocaleDateString('en-US'),
        },
        data: {
          items: results.items,
          totals: results.totals,
          breakdown: {
            materials: {
              concrete: results.totals?.totalConcrete || 0,
              steel: results.totals?.totalSteel || 0,
              blocks: results.totals?.totalBlocks || 0,
            },
            costs: {
              materials: results.totals?.totalCost || 0,
              additional: results.totals?.totalAdditionalCosts || 0,
              factory: results.totals?.factoryCost || 0,
              overhead: results.totals?.overheadCost || 0,
              profit: results.totals?.profit || 0,
              final: results.totals?.finalPrice || 0,
            }
          }
        }
      }, {
        responseType: 'blob'
      });
      
      // تحميل الملف
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectData.name || 'تقرير_المشروع'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('تم إنشاء تقرير Excel بنجاح! 📊');
      return true;
    } catch (error) {
      console.error('خطأ في إنشاء تقرير Excel:', error);
      toast.error('فشل في إنشاء تقرير Excel');
      throw error;
    }
  }

  /**
   * إنشاء تقرير ملخص
   */
  async generateSummaryReport(projectData, results) {
    try {
      const response = await api.post('/reports/summary', {
        project: projectData,
        results: results,
        format: 'detailed'
      });
      
      return response.data;
    } catch (error) {
      console.error('خطأ في إنشاء تقرير الملخص:', error);
      throw error;
    }
  }

  /**
   * الحصول على تقارير محفوظة
   */
  async getSavedReports(page = 1, limit = 10) {
    try {
      const response = await api.get(`/reports?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('خطأ في جلب التقارير:', error);
      throw error;
    }
  }

  /**
   * حذف تقرير
   */
  async deleteReport(id) {
    try {
      const response = await del(`/reports/${id}`);
      toast.success('تم حذف التقرير بنجاح!');
      return response.data;
    } catch (error) {
      console.error('خطأ في حذف التقرير:', error);
      toast.error('فشل في حذف التقرير');
      throw error;
    }
  }

  /**
   * مشاركة تقرير
   */
  async shareReport(id, shareSettings) {
    try {
      const response = await api.post(`/reports/${id}/share`, shareSettings);
      toast.success('تم إنشاء رابط مشاركة التقرير!');
      return response.data;
    } catch (error) {
      console.error('خطأ في مشاركة التقرير:', error);
      toast.error('فشل في مشاركة التقرير');
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات التقارير
   */
  async getReportsStats() {
    try {
      const response = await api.get('/reports/stats');
      return response.data;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات التقارير:', error);
      throw error;
    }
  }

  /**
   * إنشاء تقرير مقارنة
   */
  async generateComparisonReport(projects) {
    try {
      const response = await api.post('/reports/comparison', {
        projects: projects,
        format: 'detailed',
        includeCharts: true
      });
      
      return response.data;
    } catch (error) {
      console.error('خطأ في إنشاء تقرير المقارنة:', error);
      throw error;
    }
  }
}

// إنشاء instance وحيد من الخدمة
const reportService = new ReportService();

export default reportService;