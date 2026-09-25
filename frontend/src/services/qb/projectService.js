import api from '../../api/axios';
import Swal from 'sweetalert2';

/**
 * خدمة إدارة المشاريع - Project Service
 * Uses the current project's JWT API (api/axios)
 */
class ProjectService {
  
  /**
   * الحصول على جميع المشاريع
   */
  async getAllProjects(page = 1, limit = 10, search = '') {
    try {
      const response = await api.get('/projects', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  }

  /**
   * الحصول على مشروع بواسطة المعرف
   */
  async getProjectById(id) {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project:', error);
      throw error;
    }
  }

  /**
   * إنشاء مشروع جديد
   */
  async createProject(data) {
    try {
      const response = await api.post('/projects', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * تحديث مشروع
   */
  async updateProject(id, data) {
    try {
      const response = await api.put(`/projects/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  /**
   * حذف مشروع
   */
  async deleteProject(id) {
    try {
      await api.delete(`/projects/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * جلب مهام المشروع
   */
  async getProjectTasks(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  /**
   * إضافة مهمة
   */
  async addTask(projectId, task) {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, task);
      return response.data;
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  }

  /**
   * تحديث مهمة
   */
  async updateTask(projectId, taskId, updates) {
    try {
      const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  /**
   * حذف مهمة
   */
  async deleteTask(projectId, taskId) {
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المشروع
   */
  async getProjectStats(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project stats:', error);
      return null;
    }
  }

  /**
   * تحديث معدلات المشروع
   */
  async updateProjectRates(projectId, rates) {
    try {
      const response = await api.put(`/projects/${projectId}/rates`, rates);
      return response.data;
    } catch (error) {
      console.error('Failed to update rates:', error);
      throw error;
    }
  }

  /**
   * البحث عن المشاريع
   */
  async searchProjects(query) {
    try {
      const response = await api.get('/projects', {
        params: { search: query }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }
}

// إنشاء instance وحيد من الخدمة
const projectService = new ProjectService();

export default projectService;
