// خدمة الحسابات - ربط مع Backend APIs
import { get, post } from '../../utils/qb/utils/api';
import Swal from 'sweetalert2'; // Import SweetAlert2

/**
 * خدمة الحسابات
 */
class CalculationService {
  /**
   * حساب بند واحد
   */
  async calculateSingleItem(itemData) {
    try {
      const response = await post('/api/calculations/item', {
        itemType: itemData.name,
        area: parseFloat(itemData.length) * parseFloat(itemData.width),
        length: parseFloat(itemData.length),
        thickness: parseFloat(itemData.thickness),
        concretePrice: parseFloat(itemData.concretePrice),
        steelPrice: parseFloat(itemData.steelPrice),
        blockPrice: parseFloat(itemData.blockPrice),
      });
      
      return response.data;
    } catch (error) {
      console.error('خطأ في حساب البند:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في حساب البند',
      });
      throw error;
    }
  }

  /**
   * حساب مشروع كامل
   */
  async calculateProject(projectData) {
    try {
      // تحويل بيانات المشروع إلى الشكل المطلوب للBackend
      const payload = {
        items: projectData.items.map(item => ({
          itemType: item.name,
          area: parseFloat(item.length || 0) * parseFloat(item.width || 0),
          length: parseFloat(item.length || 0),
          thickness: parseFloat(item.thickness || 0),
          // إضافة الأسعار لكل بند حسب متطلبات الواجهة الخلفية
          concretePrice: parseFloat(projectData.projectData.concretePrice || 0),
          steelPrice: parseFloat(projectData.projectData.steelPrice || 0),
          blockPrice: parseFloat(projectData.projectData.blockPrice || 0),
        })),
        additionalCosts: {
          backfillQuantity: parseFloat(projectData.backfillData?.quantity || 0),
          backfillPrice: parseFloat(projectData.backfillData?.price || 0),
          insulationQuantity: parseFloat(projectData.insulationData?.quantity || 0),
          insulationPrice: parseFloat(projectData.insulationData?.price || 0),
        },
      };

      const response = await post('/api/calculations/project', payload);
      
      // تحويل الاستجابة إلى الشكل المتوقع في Frontend
      return this.transformBackendResponse(response.data, projectData.items);
    } catch (error) {
      console.error('خطأ في حساب المشروع:', error);
      
      // في حالة فشل الاتصال بالBackend، استخدم الحسابات المحلية
      console.warn('استخدام الحسابات المحلية كبديل...');
      Swal.fire({
        icon: 'info',
        title: 'معلومة',
        text: 'تم استخدام الحسابات المحلية - تحقق من اتصال الخادم',
      });
      
      // استراد دوال الحسابات المحلية
      const { calculateAllItems } = await import('../utils/calculationHelpers');
      return calculateAllItems(
        projectData.items,
        projectData.projectData,
        projectData.backfillData,
        projectData.insulationData
      );
    }
  }

  /**
   * حساب سريع للمواد فقط
   */
  async quickCalculation(itemData) {
    try {
      const response = await post('/api/calculations/quick', {
        itemType: itemData.name,
        area: parseFloat(itemData.length) * parseFloat(itemData.width),
        thickness: parseFloat(itemData.thickness),
        concretePrice: parseFloat(itemData.concretePrice),
        steelPrice: parseFloat(itemData.steelPrice),
        blockPrice: parseFloat(itemData.blockPrice),
      });
      
      return response.data;
    } catch (error) {
      console.error('خطأ في الحساب السريع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في الحساب السريع',
      });
      throw error;
    }
  }

  /**
   * مقارنة بين عدة خيارات
   */
  async compareOptions(options) {
    try {
      const response = await post('/api/calculations/compare', {
        options: options.map(option => ({
          name: option.name,
          items: option.items,
          prices: option.prices,
        }))
      });
      
      return response.data;
    } catch (error) {
      console.error('خطأ في مقارنة الخيارات:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في مقارنة الخيارات',
      });
      throw error;
    }
  }

  /**
   * حفظ حسابات المشروع
   */
  async saveCalculation(projectData, results) {
    try {
      const response = await post('/api/calculations/save', {
        project: {
          name: projectData.name,
          description: projectData.description,
        },
        calculation: {
          items: projectData.items,
          results: results,
          timestamp: new Date().toISOString(),
        }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم حفظ المشروع بنجاح!',
      });
      return response.data;
    } catch (error) {
      console.error('خطأ في حفظ المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في حفظ المشروع',
      });
      throw error;
    }
  }

  /**
   * الحصول على قائمة أنواع البنود
   */
  async getItemTypes() {
    try {
      const response = await get('/api/calculations/item-types');
      return response.data;
    } catch (error) {
      console.error('خطأ في جلب أنواع البنود:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في جلب أنواع البنود',
      });
      
      // ارجاع البيانات المحلية كبديل
      const { itemDefinitions } = await import('../utils/calculationConstants');
      return itemDefinitions;
    }
  }

  /**
   * حساب متقدم لمشروع مع تحليلات شاملة
   */
  async calculateAdvancedProject(projectData) {
    try {
      const response = await post('/api/calculations/advanced-project', projectData);
      return response.data;
    } catch (error) {
      console.error('خطأ في الحساب المتقدم:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في الحساب المتقدم',
      });
      throw error;
    }
  }

  /**
   * تحويل استجابة Backend إلى الشكل المتوقع في Frontend
   */
  transformBackendResponse(backendData, originalItems) {
    try {
      // مطابقة بيانات Backend مع بنية Frontend
      const items = originalItems.map((item, index) => {
        const backendItem = backendData.items?.[index] || {};
        return {
          ...item,
          concreteQuantity: backendItem.quantities?.concrete || 0,
          steelQuantity: backendItem.quantities?.steel || 0,
          blockQuantity: backendItem.quantities?.blocks || 0,
          concreteCost: backendItem.costs?.concrete || 0,
          steelCost: backendItem.costs?.steel || 0,
          blockCost: backendItem.costs?.blocks || 0,
          totalCost: backendItem.costs?.total || 0,
        };
      });

      const totals = {
        totalConcrete: backendData.summary?.totalQuantities?.concrete || 0,
        totalSteel: backendData.summary?.totalQuantities?.steel || 0,
        totalBlocks: backendData.summary?.totalQuantities?.blocks || 0,
        totalCost: backendData.summary?.totalCosts?.materials || 0,
        backfillCost: backendData.summary?.additionalCosts?.backfill || 0,
        insulationCost: backendData.summary?.additionalCosts?.insulation || 0,
        totalAdditionalCosts: backendData.summary?.additionalCosts?.total || 0,
        factoryCost: backendData.summary?.additionalCosts?.factory || 0,
        overheadCost: backendData.summary?.additionalCosts?.overhead || 0,
        totalProjectCost: backendData.summary?.totalCosts?.project || 0,
        profit: backendData.summary?.profit?.amount || 0,
        finalPrice: backendData.summary?.finalPrice || 0,
        costPerSquareMeter: backendData.summary?.costPerSquareMeter || 0,
      };

      return {
        items,
        totals,
        accuracy: backendData.accuracy || '100%',
        calculationTime: backendData.calculationTime || new Date().toISOString(),
      };
    } catch (error) {
      console.error('خطأ في تحويل بيانات Backend:', error);
      
      // في حالة الخطأ، ارجع بيانات فارغة
      return {
        items: originalItems,
        totals: {},
        accuracy: 'خطأ في الحساب',
        calculationTime: new Date().toISOString(),
      };
    }
  }
}

// إنشاء instance وحيد من الخدمة
const calculationService = new CalculationService();

export default calculationService;