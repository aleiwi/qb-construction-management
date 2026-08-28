import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { confirmDialog, promptInput, showAlert } from '../utils/alerts';
import { projectsApi, buildingsApi, stagesApi } from '../features/projects/projectsApi';
import api from '../api/axios';
import {
  Building2, Plus, RefreshCw, Edit2, Trash2,
  Layers, X, CheckCircle2, AlertCircle, ChevronDown,
  FileText, BarChart3, DollarSign, BrainCircuit, MapPin
} from 'lucide-react';
import { PROJECT_STATUS as STATUS_CONFIG } from '../config/status';

const BuildingModal = ({ building, projectId, onSave, onClose, isEditing }) => {
  const [form, setForm] = useState({ name: building?.name || '', floors_count: building?.floors_count || 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('اسم المبنى مطلوب'); return; }
    setSaving(true);
    const data = isEditing ? form : { ...form, project_id: projectId };
    const result = await onSave(data);
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{isEditing ? 'تعديل المبنى' : 'مبنى جديد'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المبنى</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="العمارة أ - المرحلة الأولى"
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">عدد الطوابق</label>
            <input type="number" min="1" value={form.floors_count} onChange={e => setForm(f => ({ ...f, floors_count: parseInt(e.target.value) || 1 }))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StageModal = ({ stage, buildingId, onSave, onClose, isEditing }) => {
  const [form, setForm] = useState({
    name: stage?.name || '',
    description: stage?.description || '',
    weight_percent: stage?.weight_percent || 0,
    progress_percent: stage?.progress_percent || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('اسم المرحلة مطلوب'); return; }
    setSaving(true);
    const data = isEditing ? form : { ...form, building_id: buildingId };
    const result = await onSave(data);
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{isEditing ? 'تعديل المرحلة' : 'مرحلة جديدة'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المرحلة</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="الحفر والتسوية"
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="حفر وتسوية الموقع للمرحلة الأولى"
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوزن النسبي (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={form.weight_percent} onChange={e => setForm(f => ({ ...f, weight_percent: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نسبة الإنجاز (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={form.progress_percent} onChange={e => setForm(f => ({ ...f, progress_percent: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BuildingCard = ({ building, projectId, onRefresh, permissions }) => {
  const [expanded, setExpanded] = useState(false);
  const [stages, setStages] = useState([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const loadStages = useCallback(async () => {
    setLoadingStages(true);
    try {
      const res = await stagesApi.list(building.id);
      if (res.success) setStages(res.data);
    } finally {
      setLoadingStages(false);
    }
  }, [building.id]);

  useEffect(() => {
    if (expanded) loadStages();
  }, [expanded, loadStages]);

  const handleSaveStage = async (form) => {
    if (editingStage) {
      const res = await stagesApi.update(editingStage.id, form);
      if (res.success) { showSuccess('تم تحديث المرحلة'); await loadStages(); }
      return res;
    } else {
      const res = await stagesApi.create(form);
      if (res.success) { showSuccess('تم إضافة المرحلة'); await loadStages(); }
      return res;
    }
  };

  const handleProgressUpdate = async (stageId, progress) => {
    const res = await stagesApi.updateProgress(stageId, progress);
    if (res.success) { showSuccess('تم تحديث نسبة الإنجاز'); await loadStages(); }
    return res;
  };

  const handleDeleteStage = async (stageId) => {
    const res = await stagesApi.delete(stageId);
    if (res.success) { showSuccess('تم حذف المرحلة'); await loadStages(); }
  };

  const handleDeleteBuilding = async () => {
    if (!(await confirmDialog('حذف المبنى', `هل أنت متأكد من حذف "${building.name}" وجميع مراحله؟`))) return;
    const res = await buildingsApi.delete(building.id);
    if (res.success) onRefresh();
  };

  const totalWeight = stages.reduce((sum, s) => sum + parseFloat(s.weight_percent || 0), 0);
  const overallProgress = totalWeight > 0
    ? stages.reduce((sum, s) => sum + (parseFloat(s.weight_percent) * parseFloat(s.progress_percent)) / 100, 0) / totalWeight * 100
    : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      {actionMsg && (
        <div className="mx-4 mt-4 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{actionMsg}</span>
        </div>
      )}

      {/* Building Header */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm">{building.name}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>{building.floors_count} طوابق</span>
              <span>{stages.length} مراحل</span>
              {expanded && (
                <div className="flex items-center gap-1">
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
                  </div>
                  <span className="text-blue-400 font-semibold">{overallProgress.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded(!expanded)}
            className={`p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ${expanded ? 'bg-slate-800 text-blue-400' : ''}`}>
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {(permissions.isAdmin || permissions.isProjectManager) && (
            <>
              <button onClick={() => { setEditingStage(null); setShowStageModal(true); }}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition border border-transparent hover:border-emerald-500/20" title="إضافة مرحلة">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => { setEditingBuilding(building); setShowBuildingModal(true); }}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20" title="تعديل">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={handleDeleteBuilding}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20" title="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stages List */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-2 space-y-2">
          {loadingStages ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stages.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              لا توجد مراحل. أضف أول مرحلة للمتابعة.
            </div>
          ) : (
            stages.map((stage) => (
              <div key={stage.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-slate-200">{stage.name}</h5>
                    {stage.description && <p className="text-[10px] text-slate-500 mt-0.5">{stage.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-left">
                      <div className="text-xs font-bold text-blue-400">{parseFloat(stage.progress_percent).toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-500">من {parseFloat(stage.weight_percent)}%</div>
                    </div>
                    {(permissions.isAdmin || permissions.isProjectManager || permissions.isEngineer) && (
                      <button onClick={async () => {
                        const newVal = await promptInput('تحديث نسبة الإنجاز', 'نسبة الإنجاز الجديدة (0-100)', stage.progress_percent);
                        if (newVal !== null) {
                          const val = parseFloat(newVal);
                          if (!isNaN(val) && val >= 0 && val <= 100) {
                            handleProgressUpdate(stage.id, val);
                          }
                        }
                      }} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition" title="تحديث الإنجاز">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    {permissions.isAdmin && (
                      <button onClick={() => handleDeleteStage(stage.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="حذف">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${parseFloat(stage.progress_percent) >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${stage.progress_percent}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showBuildingModal && (
        <BuildingModal
          building={editingBuilding}
          projectId={projectId}
          onSave={async (data) => {
            const res = editingBuilding
              ? await buildingsApi.update(editingBuilding.id, data)
              : await buildingsApi.create(data);
            if (res.success) { showSuccess('تم حفظ المبنى'); await onRefresh(); }
            return res;
          }}
          onClose={() => { setShowBuildingModal(false); setEditingBuilding(null); }}
          isEditing={!!editingBuilding}
        />
      )}

      {showStageModal && (
        <StageModal
          stage={editingStage}
          buildingId={building.id}
          onSave={handleSaveStage}
          onClose={() => { setShowStageModal(false); setEditingStage(null); }}
          isEditing={!!editingStage}
        />
      )}
    </div>
  );
};

export const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [project, setProject] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projRes, buildRes] = await Promise.all([
        projectsApi.get(projectId),
        buildingsApi.list(projectId),
      ]);
      if (projRes.success) setProject(projRes.data);
      if (buildRes.success) setBuildings(buildRes.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleSaveBuilding = async (form) => {
    if (editingBuilding) {
      const res = await buildingsApi.update(editingBuilding.id, form);
      if (res.success) { showSuccess('تم تحديث المبنى'); fetchData(); }
      return res;
    } else {
      const res = await buildingsApi.create(form);
      if (res.success) { showSuccess('تم إضافة المبنى'); fetchData(); }
      return res;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جارٍ تحميل بيانات المشروع...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 text-sm">{error || 'المشروع غير موجود'}</p>
          <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition">
            العودة للمشاريع
          </button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={project.name}
        subtitle="تفاصيل المشروع والمباني"
        actions={
          <>
            <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button
                onClick={() => { setEditingBuilding(null); setShowBuildingModal(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مبنى</span>
              </button>
            )}
          </>
        }
      />

      <div className="space-y-6">
        {actionMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        {/* Project Info Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xl font-bold text-white">{project.name}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
              {project.description && <p className="text-sm text-slate-400 mb-3">{project.description}</p>}
              {project.location && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{project.location}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{buildings.length}</div>
                <div className="text-[11px] text-slate-500">المباني</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {buildings.reduce((sum, b) => sum + (b.stages_count || 0), 0)}
                </div>
                <div className="text-[11px] text-slate-500">المراحل</div>
              </div>
            </div>
          </div>
        </div>

        {/* Buildings List */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            المباني والمراحل
          </h3>
          {buildings.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">لا توجد مبانٍ مسجلة</p>
              <p className="text-slate-600 text-xs mt-1">أضف أول مبنى للمتابعة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buildings.map(building => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  projectId={projectId}
                  onRefresh={fetchData}
                  permissions={permissions}
                />
              ))}
            </div>
          )}
        </div>

        {/* BOQ Navigation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-emerald-400" />
            حصر الكميات والتسعير
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => navigate(`/boq-summary/${projectId}`)}
              className="p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 rounded-2xl transition text-right">
              <FileText className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-sm font-bold text-white">BOQ المشروع</div>
              <div className="text-[10px] text-slate-500">عرض حصر الكميات والتكاليف</div>
            </button>
            <button onClick={async () => {
              try {
                const res = await api.get(`/boq-summary/project/${projectId}/comparison`);
                if (res.data.success) {
                  const data = res.data.data;
                  const msg = `مقارنة التصنيف:\nمطابق: ${data.type_agreements}\nمختلف: ${data.type_mismatches}\nتغير الكمية: ${data.summary.qty_variance_pct}%\nتغير التكلفة: ${data.summary.cost_variance_pct}%`;
                  showAlert('info', 'تقرير المقارنة', msg);
                }
              } catch {
                showAlert('error', 'فشل تحميل تقرير المقارنة');
              }
            }}
              className="p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 rounded-2xl transition text-right">
              <BarChart3 className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-sm font-bold text-white">تقرير المقارنة</div>
              <div className="text-[10px] text-slate-500">مقارنة تلقائي vs يدوي</div>
            </button>
            <button onClick={() => navigate('/price-library')}
              className="p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 rounded-2xl transition text-right">
              <DollarSign className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-sm font-bold text-white">المكتبة السعرية</div>
              <div className="text-[10px] text-slate-500">أسعار الوحدات والعناصر</div>
            </button>
            <button onClick={() => navigate('/boq-analytics')}
              className="p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 rounded-2xl transition text-right">
              <BrainCircuit className="w-5 h-5 text-purple-400 mb-2" />
              <div className="text-sm font-bold text-white">تحليلات التصنيف</div>
              <div className="text-[10px] text-slate-500">دقة التصنيف والإحصائيات</div>
            </button>
          </div>
        </div>
      </div>

      {showBuildingModal && (
        <BuildingModal
          building={editingBuilding}
          projectId={projectId}
          onSave={handleSaveBuilding}
          onClose={() => { setShowBuildingModal(false); setEditingBuilding(null); }}
          isEditing={!!editingBuilding}
        />
      )}
    </div>
  );
};