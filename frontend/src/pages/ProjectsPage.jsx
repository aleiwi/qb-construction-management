import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../features/projects/useProjects';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import {
  Building2, Plus, RefreshCw, Edit2, Trash2,
  MapPin, Layers, X, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';

const STATUS_CONFIG = {
  planning: { label: 'قيد التخطيط', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '🔍' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: '🔨' },
  on_hold: { label: 'معلق', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: '⏸️' },
  completed: { label: 'مكتمل', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '✅' },
  cancelled: { label: 'ملغي', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '❌' },
};

const ProjectModal = ({ project, onSave, onClose, isEditing }) => {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    location: project?.location || '',
    status: project?.status || 'planning',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('اسم المشروع مطلوب'); return; }
    setSaving(true);
    const result = await onSave(form);
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? 'تعديل المشروع' : 'مشروع جديد'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المشروع</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="مشروع مسقا - عمارة 32"
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الموقع</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="الرياض - حي الملقا"
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="وصف مختصر للمشروع..."
              rows={3}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">حالة المشروع</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
            >
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjects();
  const permissions = usePermissions();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setActionType('success');
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleSave = async (form) => {
    if (editingProject) {
      const res = await updateProject(editingProject.id, form);
      if (res.success) showSuccess('تم تحديث المشروع بنجاح');
      return res;
    } else {
      const res = await createProject(form);
      if (res.success) showSuccess('تم إنشاء المشروع بنجاح');
      return res;
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteProject(id);
    if (res.success) {
      showSuccess('تم حذف المشروع بنجاح');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <PageHeader
        title="المشاريع والمباني"
        subtitle="إدارة المشاريع الإنشائية ومراحل التنفيذ"
        actions={
          <>
            <button onClick={() => fetchProjects()} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button
                onClick={() => { setEditingProject(null); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>مشروع جديد</span>
              </button>
            )}
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Action feedback */}
        {actionMsg && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm ${actionType === 'success'
            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
            : 'bg-red-950/40 border-red-800/50 text-red-300'}`}>
            {actionType === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المشاريع', value: projects.length, color: 'text-blue-400' },
            { label: 'قيد التنفيذ', value: projects.filter(p => p.status === 'in_progress').length, color: 'text-amber-400' },
            { label: 'مكتملة', value: projects.filter(p => p.status === 'completed').length, color: 'text-emerald-400' },
            { label: 'على HOLD', value: projects.filter(p => p.status === 'on_hold').length, color: 'text-orange-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Projects List */}
        {loading && projects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل المشاريع...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-300 text-center text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد مشاريع</h3>
            <p className="text-sm text-slate-500 mb-6">ابدأ بإضافة أول مشروع للمتابعة الإنشائية</p>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button
                onClick={() => { setEditingProject(null); setShowModal(true); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة مشروع
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
              return (
                <div key={project.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{project.name}</h3>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-slate-400 mb-2 line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {project.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {project.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {project.buildings_count || 0} مبنى
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20"
                        title="عرض التفاصيل"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {(permissions.isAdmin || permissions.isProjectManager) && (
                        <>
                          <button
                            onClick={() => { setEditingProject(project); setShowModal(true); }}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition border border-transparent hover:border-emerald-500/20"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(project)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingProject(null); }}
          isEditing={!!editingProject}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-bold text-white text-lg">حذف المشروع</h3>
              <p className="text-sm text-slate-400 mt-1">
                هل أنت متأكد من حذف <strong className="text-white">{deleteConfirm.name}</strong>؟<br />
                سيتم حذف جميع المباني والمراحل المرتبطة. لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">
                إلغاء
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition">
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};