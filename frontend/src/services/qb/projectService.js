import api from '../../api/axios';
import Swal from 'sweetalert2'; // Import SweetAlert2

/**
 * خدمة إدارة المشاريع
 */
class ProjectService {
  /**
   * الحصول على جميع المشاريع
   */
  async getAllProjects(page = 1, limit = 10, search = '') {
    try {
      console.log('📊 جلب جميع المشاريع...');
      const projects = await projectsAPI.getProjects();
      console.log('✅ تم جلب المشاريع بنجاح:', projects.length, 'مشروع');
      return projects;
    } catch (error) {
      console.error('خطأ في جلب المشاريع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في جلب المشاريع',
      });
      throw error;
    }
  }

  /**
   * تحديث مشروع موجود مع بيانات الحاسبة
   */
  async updateProjectWithCalculator(projectId, projectData, items, results) {
    try {
      console.log('📝 تحديث مشروع مع الحاسبة...', {
        projectId,
        name: projectData.name,
        itemsCount: items?.length || 0,
        hasResults: !!results
      });

      // فحص تسجيل الدخول أولاً
      const { data: { user }, error: authError } = await authAPI.getMe();
      
      if (authError || !user) {
        throw new Error('❌ يجب تسجيل الدخول أولاً لحفظ المشروع');
      }

      // أولاً، تحديث المشروع الأساسي
      console.log('📝 تحديث المشروع الأساسي...');
      const updatedProject = await this.updateProject(projectId, {
        name: projectData.name,
        description: projectData.description,
        location: projectData.location || '',
        estimated_cost: results ? parseFloat(results.finalPrice) : 0,
        // استخدام نوع المشروع القادم من الحاسبة للحفاظ على التوافق
        project_type: projectData.project_type || 'سكني',
        // حفظ تواريخ المشروع وحالته ليستفيد منها AdvancedDashboard
        start_date: projectData.start_date || null,
        delivery_date: projectData.delivery_date || null,
        status: projectData.status || 'قيد التنفيذ'
      });

      console.log('📊 تحديث بيانات الحاسبة...');

      // ثم حفظ بيانات الحاسبة
      const calculatorData = {
        items: items || [],
        prices: {
          concretePrice: projectData.concretePrice,
          steelPrice: projectData.steelPrice,
          blockPrice: projectData.blockPrice,
          plasterPrice: projectData.plasterPrice,
          laborRate: projectData.laborRate,
          equipmentRate: projectData.equipmentRate,
          profitRate: projectData.profitRate,
          // إضافة بيانات العزل والدفان
          backfillPrice: projectData.backfillPrice,
          insulationPrice: projectData.insulationPrice,
          factoryRate: projectData.factoryRate,
          overheadRate: projectData.overheadRate
        }
      };

      const projectSettings = {
        ...projectData,
        backfillQuantity: projectData.backfillQuantity,
        backfillPrice: projectData.backfillPrice,
        insulationQuantity: projectData.insulationQuantity,
        insulationPrice: projectData.insulationPrice
      };

      await this.saveCalculatorData(projectId, calculatorData, projectSettings, results);

      console.log('✅ تم تحديث المشروع مع الحاسبة بنجاح!');

      Swal.fire({
        icon: 'success',
        title: '🎉 تم التحديث بنجاح!',
        text: `تم تحديث مشروع "${projectData.name}" وحفظ جميع البيانات`,
        timer: 3000,
        showConfirmButton: false
      });

      return updatedProject;
    } catch (error) {
      console.error('خطأ في تحديث المشروع مع الحاسبة:', error);

      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: error.message || 'فشل في حفظ المشروع',
      });

      throw error;
    }
  }

  /**
   * الحصول على مشروع بعينه
   */
  async getProject(id) {
    try {
      console.log('📊 جلب مشروع بعينه...', id);
      const project = await projectsAPI.getProject(id);
      console.log('✅ تم جلب المشروع بنجاح:', project);
      return project;
    } catch (error) {
      console.error('خطأ في جلب المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في جلب المشروع',
      });
      throw error;
    }
  }

  /**
   * الحصول على مشروع بعينه (alias للـ getProject)
   */
  async getProjectById(id) {
    return this.getProject(id);
  }

  /**
   * إنشاء مشروع جديد
   */
  async createProject(projectData) {
    try {
      console.log('🚀 إنشاء مشروع جديد...', projectData);
      
      // بناء الحمولة للجدول
      const payload = {
        name: projectData.name || 'مشروع جديد',
        description: projectData.description || '',
        location: projectData.location || '',
        estimated_cost: projectData.estimated_cost || 0,
        project_type: projectData.project_type || 'سكني',
        // حفظ تواريخ المشروع وحالته إذا توفرت
        start_date: projectData.start_date || null,
        delivery_date: projectData.delivery_date || null,
        status: projectData.status || 'قيد التنفيذ'
      };

      const project = await projectsAPI.createProject(payload);
      
      console.log('✅ تم إنشاء المشروع بنجاح:', project);
      
      // إشعار النجاح
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم إنشاء المشروع بنجاح!',
        timer: 2000,
        showConfirmButton: false
      });
      
      return project;
    } catch (error) {
      console.error('خطأ في إنشاء المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: error.message || 'فشل في إنشاء المشروع',
      });
      throw error;
    }
  }

  /**
   * تحديث مشروع
   */
  async updateProject(id, projectData) {
    try {
      console.log('📝 تحديث مشروع...', id, projectData);
      
      const project = await projectsAPI.updateProject(id, projectData);
      
      console.log('✅ تم تحديث المشروع بنجاح:', project);
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم تحديث المشروع بنجاح!',
        timer: 2000,
        showConfirmButton: false
      });
      
      return project;
    } catch (error) {
      console.error('خطأ في تحديث المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: error.message || 'فشل في تحديث المشروع',
      });
      throw error;
    }
  }

  /**
   * حذف مشروع
   */
  async deleteProject(id) {
    try {
      const response = await projectsAPI.deleteProject(id);
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم حذف المشروع بنجاح!',
      });
      
      // التعامل مع response - قد يكون null أو يحتوي على data
      return response?.data || response || { success: true };
    } catch (error) {
      console.error('خطأ في حذف المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في حذف المشروع',
      });
      throw error;
    }
  }

  /**
   * حفظ إعدادات المشروع
   */
  async saveProjectSettings(id, settings) {
    try {
      const response = await put(`/api/projects/${id}/settings`, settings);
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم حفظ إعدادات المشروع!',
      });
      return response.data;
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في حفظ الإعدادات',
      });
      throw error;
    }
  }

  /**
   * حفظ بيانات حاسبة المشروع
   */
  async saveCalculatorData(projectId, calculatorData, projectSettings, calculationResults) {
    try {
      console.log('📊 بدء حفظ بيانات الحاسبة...', {
        projectId,
        itemsCount: calculatorData?.items?.length || 0,
        hasResults: !!calculationResults
      });

      console.log('💾 حفظ البيانات في قاعدة البيانات...');

      const result = await projectsAPI.saveCalculatorData(
        projectId, 
        calculatorData, 
        projectSettings, 
        calculationResults
      );
      
      console.log('✅ تم حفظ بيانات الحاسبة بنجاح:', result);
      return result;
    } catch (error) {
      console.error('❌ خطأ في حفظ بيانات الحاسبة:', error);
      // إعادة رمي الخطأ ليتم التعامل معه في مستوى أعلى (مثل createProjectWithCalculator)
      throw error;
    }
  }

  /**
   * إنشاء مشروع جديد مع بيانات الحاسبة
   */
  async createProjectWithCalculator(projectData, items, results) {
    try {
      console.log('🚀 إنشاء مشروع مع حاسبة...', {
        name: projectData.name,
        itemsCount: items?.length || 0,
        hasResults: !!results
      });

      // فحص تسجيل الدخول أولاً
      const { data: { user }, error: authError } = await authAPI.getMe();
      
      if (authError || !user) {
        throw new Error('❌ يجب تسجيل الدخول أولاً لحفظ المشروع');
      }
      
      // أولاً، إنشاء المشروع الأساسي
      console.log('📝 إنشاء المشروع الأساسي...');
      const project = await this.createProject({
        name: projectData.name,
        description: projectData.description,
        location: projectData.location || '',
        estimated_cost: results ? parseFloat(results.finalPrice) : 0,
        // استخدام نفس نوع المشروع القادم من الحاسبة
        project_type: projectData.project_type || 'سكني',
        // تمرير التواريخ والحالة القادمة من additionalData
        start_date: projectData.start_date || null,
        delivery_date: projectData.delivery_date || null,
        status: projectData.status || 'قيد التنفيذ'
      });

      console.log('📊 حفظ بيانات الحاسبة...');
      
      // ثم حفظ بيانات الحاسبة
      const calculatorData = {
        items: items || [],
        prices: {
          concretePrice: projectData.concretePrice,
          steelPrice: projectData.steelPrice,
          blockPrice: projectData.blockPrice,
          plasterPrice: projectData.plasterPrice,
          laborRate: projectData.laborRate,
          equipmentRate: projectData.equipmentRate,
          profitRate: projectData.profitRate,
          // إضافة بيانات العزل والدفان
          backfillPrice: projectData.backfillPrice,
          insulationPrice: projectData.insulationPrice,
          factoryRate: projectData.factoryRate,
          overheadRate: projectData.overheadRate
        }
      };

      // حفظ projectSettings مع بيانات العزل والدفان
      const projectSettings = {
        ...projectData,
        // إضافة بيانات العزل والدفان من additionalData إذا كانت موجودة
        backfillQuantity: projectData.backfillQuantity,
        backfillPrice: projectData.backfillPrice,
        insulationQuantity: projectData.insulationQuantity,
        insulationPrice: projectData.insulationPrice
      };

      await this.saveCalculatorData(project.id, calculatorData, projectSettings, results);

      console.log('✅ تم إنشاء المشروع مع الحاسبة بنجاح!');
      
      Swal.fire({
        icon: 'success',
        title: '🎉 تم الحفظ بنجاح!',
        text: `تم إنشاء مشروع "${project.name}" وحفظ جميع البيانات`,
        timer: 3000,
        showConfirmButton: false
      });

      return project;
    } catch (error) {
      console.error('خطأ في إنشاء المشروع مع الحاسبة:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: error.message || 'فشل في حفظ المشروع',
      });
      
      throw error;
    }
  }

  /**
   * تحميل بيانات حاسبة المشروع
   */
  async getCalculatorData(projectId) {
    try {
      console.log('📊 تحميل بيانات الحاسبة...', projectId);
      
      const calculatorData = await projectsAPI.getCalculatorData(projectId);
      
      console.log('✅ تم تحميل بيانات الحاسبة بنجاح:', calculatorData);
      return calculatorData;
    } catch (error) {
      console.error('خطأ في تحميل بيانات الحاسبة:', error);
      throw error;
    }
  }

  /**
   * الحصول على تاريخ المشروع
   */
  async getProjectHistory(id) {
    try {
      const response = await get(`/api/projects/${id}/history`);
      return response.data;
    } catch (error) {
      console.error('خطأ في جلب تاريخ المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في جلب تاريخ المشروع',
      });
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المشروع
   */
  async getProjectStats(id) {
    try {
      const response = await get(`/api/projects/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في جلب إحصائيات المشروع',
      });
      throw error;
    }
  }

  /**
   * نسخ مشروع
   */
  async duplicateProject(id, newName) {
    try {
      const response = await post(`/api/projects/${id}/duplicate`, {
        name: newName || `نسخة من المشروع`
      });
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم نسخ المشروع بنجاح!',
      });
      return response.data;
    } catch (error) {
      console.error('خطأ في نسخ المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في نسخ المشروع',
      });
      throw error;
    }
  }

  /**
   * مشاركة مشروع
   */
  async shareProject(id, shareSettings) {
    try {
      const response = await post(`/api/projects/${id}/share`, shareSettings);
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم إنشاء رابط المشاركة!',
      });
      return response.data;
    } catch (error) {
      console.error('خطأ في مشاركة المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في مشاركة المشروع',
      });
      throw error;
    }
  }

  /**
   * استيراد بيانات مشروع
   */
  async importProject(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await post('/api/projects/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم استيراد المشروع بنجاح!',
      });
      return response.data;
    } catch (error) {
      console.error('خطأ في استيراد المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في استيراد المشروع',
      });
      throw error;
    }
  }

  /**
   * تصدير بيانات مشروع
   */
  async exportProject(id, format = 'json') {
    try {
      const response = await get(`/api/projects/${id}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      // إنشاء رابط تحميل
      const blob = new Blob([response], { type: response.type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      Swal.fire({
        icon: 'success',
        title: 'نجاح!',
        text: 'تم تصدير المشروع بنجاح!',
      });
      return true;
    } catch (error) {
      console.error('خطأ في تصدير المشروع:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في تصدير المشروع',
      });
      throw error;
    }
  }
  /**
   * --- TASKS MANAGEMENT ---
   */

  /**
   * --- TASKS MANAGEMENT (Direct Database Access) ---
   */

  /**
   * جلب مهام المشروع
   */
  async getProjectTasks(projectId) {
    try {
      console.log('🔄 Fetching tasks for project:', projectId);
      
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform snake_case to camelCase for frontend if needed, 
      // but TaskManager uses: id, text, completed.
      // Assuming DB has: id, task_text, is_completed, project_id, created_at
      // Let's map it to be safe.
      return data.map(task => ({
        id: task.id,
        text: task.task_text || task.text, // Handle both potential column names
        completed: task.is_completed || task.completed || false,
        createdAt: task.created_at
      }));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  async addTask(projectId, task) {
    try {
      // Map frontend object to DB columns
      const dbTask = {
        project_id: projectId,
        task_text: task.text,
        is_completed: false
      };

      const { data, error } = await supabase
        .from('project_tasks')
        .insert([dbTask])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        text: data.task_text,
        completed: data.is_completed
      };
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  }

  async updateTask(projectId, taskId, updates) {
    try {
      // Map updates
      const dbUpdates = {};
      if (updates.text !== undefined) dbUpdates.task_text = updates.text;
      if (updates.completed !== undefined) dbUpdates.is_completed = updates.completed;

      const { data, error } = await supabase
        .from('project_tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        text: data.task_text,
        completed: data.is_completed
      };
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(projectId, taskId) {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }



}

// إنشاء instance وحيد من الخدمة
const projectService = new ProjectService();

export default projectService;