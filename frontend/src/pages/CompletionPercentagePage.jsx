import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BarChart3, FileText, Edit3, RotateCcw, Save,
  Cloud, CloudOff, AlertCircle, Building2, Loader2, CheckCircle2,
  Copy, ChevronRight, History, Rocket, Calendar
} from 'lucide-react';
import ProgressInputForm from '../components/completion/ProgressInputForm';
import ProgressDashboard from '../components/completion/ProgressDashboard';
import ConfirmModal from '../components/ui/ConfirmModal';
import NewPeriodModal from '../components/completion/NewPeriodModal';
import QuickCreateProjectModal from '../components/completion/QuickCreateProjectModal';
import {
  defaultCompletionData, createEmptyCompletionData, calcStructureProgress,
  calcFinishingProgress, calcOverallProgress
} from '../components/completion/defaultCompletionData';
import { projectsApi } from '../features/projects/projectsApi';
import { completionReportsApi } from '../features/reports/completionReportsApi';

const SAVE_STATUS = {
  IDLE:    { label: 'لا تغييرات', color: 'text-slate-500',   icon: Cloud },
  DIRTY:   { label: 'تعديلات غير محفوظة', color: 'text-amber-400', icon: AlertCircle },
  SAVING:  { label: 'جارٍ الحفظ...', color: 'text-blue-400',  icon: Loader2 },
  SAVED:   { label: 'تم الحفظ', color: 'text-emerald-400', icon: CheckCircle2 },
  OFFLINE: { label: 'وضع تجربة - غير مرتبط بقاعدة البيانات', color: 'text-slate-500', icon: CloudOff },
  ERROR:   { label: 'فشل الحفظ', color: 'text-red-400',    icon: AlertCircle },
};

export const CompletionPercentagePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(createEmptyCompletionData);
  const [activeView, setActiveView] = useState('dashboard');

  // project picker
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // snapshots (historical reports list)
  const [reportsList, setReportsList] = useState([]);
  const [activeReportId, setActiveReportId] = useState(null);
  const [parentOverall, setParentOverall] = useState(null); // for delta calc

  // persistence
  const [dirty, setDirty] = useState(false);
  const [saveStatusKey, setSaveStatusKey] = useState('OFFLINE');
  const [serverError, setServerError] = useState('');

  // modals
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState({ open: false, target: null });
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [cloning, setCloning] = useState(false);

  // live progress
  const stProgress = calcStructureProgress(data.structureItems);
  const fnProgress = calcFinishingProgress(data.finishingItems);
  const overall = calcOverallProgress(data.structureItems, data.finishingItems);
  const delta = parentOverall !== null ? +(overall - parentOverall).toFixed(1) : null;

  // ===== load projects =====
  useEffect(() => {
    (async () => {
      setLoadingProjects(true);
      try {
        const res = await projectsApi.list(1, 100);
        if (res.success) setProjects(res.data);
      } catch (e) { console.error('projects list failed', e); }
      finally { setLoadingProjects(false); }
    })();
  }, []);

  // ===== dirty flag (only user edits mark the page dirty — not report loads) =====
  const handleDataChange = useCallback((updater) => {
    setData(updater);
    setDirty(true);
  }, []);
  useEffect(() => { if (dirty && saveStatusKey !== 'ERROR' && saveStatusKey !== 'OFFLINE') setSaveStatusKey('DIRTY'); }, [dirty]);

  // ===== load report lists + active report =====
  const fetchReportsList = useCallback(async (projectId) => {
    try {
      const res = await completionReportsApi.list(projectId);
      if (res.success) {
        setReportsList(res.data);
        return res.data;
      }
    } catch { /* ignore */ }
    setReportsList([]);
    return [];
  }, []);

  const loadReport = useCallback(async (reportId) => {
    setLoadingReport(true);
    setServerError('');
    try {
      const res = await completionReportsApi.get(reportId);
      if (res.success && res.data) {
        const loaded = res.data.report_data || {};
        const base = { ...defaultCompletionData, ...loaded };
        setData(base);
        setActiveReportId(res.data.id);

        // compute parent snapshot for delta
        if (res.data.parent_report_id) {
          try {
            const parentRes = await completionReportsApi.get(res.data.parent_report_id);
            if (parentRes.success && parentRes.data?.report_data) {
              const pr = parentRes.data.report_data;
              setParentOverall(calcOverallProgress(pr.structureItems || [], pr.finishingItems || []));
            } else setParentOverall(null);
          } catch { setParentOverall(null); }
        } else {
          setParentOverall(null);
        }

        setDirty(false);
        setSaveStatusKey('IDLE');
      }
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'فشل تحميل التقرير');
      setSaveStatusKey('ERROR');
    } finally {
      setLoadingReport(false);
    }
  }, []);

  // ===== handle project select =====
  const enterProject = async (projectId) => {
    setSelectedProjectId(projectId);
    setServerError('');
    const listRes = await fetchReportsList(projectId);
    // auto-load latest report if any (list is newest-first)
    if (listRes && listRes.length > 0) {
      await loadReport(listRes[0].id);
    } else {
      setData(createEmptyCompletionData());
      setActiveReportId(null);
      setParentOverall(null);
      setDirty(false);
      setSaveStatusKey('IDLE');
    }
  };

  const resetToChoice = () => {
    setSelectedProjectId(null);
    setReportsList([]);
    setActiveReportId(null);
    setData(createEmptyCompletionData());
    setParentOverall(null);
    setDirty(false);
    setSaveStatusKey('OFFLINE');
  };

  const handleSelectProject = async (e) => {
    const val = e.target.value;

    // "" → العودة لشاشة الاختيار
    if (val === '') {
      if (dirty) {
        setConfirmSwitch({ open: true, target: null });
        return;
      }
      resetToChoice();
      return;
    }

    const projectId = parseInt(val);
    if (dirty && selectedProjectId !== projectId) {
      setConfirmSwitch({ open: true, target: projectId });
      return;
    }
    await enterProject(projectId);
  };

  const handleConfirmSwitch = async () => {
    const target = confirmSwitch.target;
    setConfirmSwitch({ open: false, target: null });
    if (target === null) {
      resetToChoice();
      return;
    }
    await enterProject(target);
  };

  // ===== save (create or update based on activeReportId) =====
  const handleSave = async () => {
    if (!selectedProjectId) {
      setSaveStatusKey('ERROR');
      setServerError('اختر مشروعاً أولاً للحفظ في قاعدة البيانات');
      return;
    }
    setSaveStatusKey('SAVING');
    setServerError('');
    try {
      const payload = {
        project_id: selectedProjectId,
        report_data: data,
        report_period: data.reportPeriod,
        period_type: 'monthly',
        status: 'draft',
      };
      let res;
      if (activeReportId) {
        res = await completionReportsApi.update(activeReportId, payload);
      } else {
        res = await completionReportsApi.create(payload);
        if (res.success) setActiveReportId(res.data.id);
      }
      if (res.success) {
        setDirty(false);
        setSaveStatusKey('SAVED');
        await fetchReportsList(selectedProjectId);
        setTimeout(() => {
          // only auto-reset if nothing changed meanwhile (avoids overriding a newer DIRTY/ERROR state)
          setSaveStatusKey((prev) => (prev === 'SAVED' ? 'IDLE' : prev));
        }, 2500);
      } else throw new Error(res.error?.message || 'فشل الحفظ');
    } catch (err) {
      setSaveStatusKey('ERROR');
      setServerError(err.response?.data?.error?.message || err.message || 'فشل الحفظ');
    }
  };

  // ===== clone previous report =====
  const handleClone = async (payload) => {
    setCloning(true);
    setServerError('');
    try {
      const res = await completionReportsApi.clonePrevious(selectedProjectId, payload);
      if (res.success) {
        setShowNewPeriod(false);
        await fetchReportsList(selectedProjectId);
        await loadReport(res.data.id);
      } else throw new Error(res.error?.message || 'فشل الاستنساخ');
    } catch (err) {
      setServerError(err.response?.data?.error?.message || err.message || 'فشل الاستنساخ');
    } finally {
      setCloning(false);
    }
  };

  // ===== reset =====
  const handleReset = () => {
    setData(createEmptyCompletionData());
    setDirty(false);
    setSaveStatusKey('IDLE');
    setConfirmReset(false);
  };

  const StatusCfg = SAVE_STATUS[saveStatusKey] || SAVE_STATUS.IDLE;
  const StatusIcon = StatusCfg.icon;
  const isSaving = saveStatusKey === 'SAVING';
  const noProjects = !loadingProjects && projects.length === 0;
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const activeReport = reportsList.find((report) => report.id === activeReportId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 print:bg-white print:text-black">
      <header className="print:hidden border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition shrink-0"><ArrowRight className="w-5 h-5" /></button>
              <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-3xl flex items-center justify-center shrink-0"><BarChart3 className="w-6 h-6 text-white" /></div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">تقرير نسب الإنجاز الشامل</h1>
                <p className="text-sm text-slate-400 truncate">
                  {selectedProject ? `${selectedProject.name} · ${activeReport?.report_period || 'تقرير جديد'}` : 'ابدأ باختيار مشروع أو إنشاء مشروع جديد'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedProjectId !== null && (
                <div className="flex items-center gap-2 rounded-2xl bg-slate-800/90 px-3 py-2 border border-slate-700">
                  <StatusIcon className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span className={`text-xs font-semibold ${StatusCfg.color}`}>{StatusCfg.label}</span>
                </div>
              )}
              {selectedProjectId !== null && (
                <button onClick={handleSave} disabled={isSaving || !dirty || !selectedProjectId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2">
                  <Save className="w-4 h-4" /> حفظ
                </button>
              )}
              {selectedProjectId !== null && (
                <button onClick={() => setConfirmReset(true)} title="استعادة الافتراضي"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold transition flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> إعادة ضبط
                </button>
              )}
              <div className="flex bg-slate-800/80 border border-slate-700 rounded-2xl p-1">
                <button onClick={() => setActiveView('dashboard')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><FileText className="w-4 h-4" /> التقرير</button>
                <button onClick={() => setActiveView('edit')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeView === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><Edit3 className="w-4 h-4" /> التحرير</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:p-0 print:m-0 print:max-w-none">
        {selectedProjectId === null ? (
          loadingProjects ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            /* ====== Choice screen: new project file OR existing project ====== */
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-500 flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">ماذا تريد أن تفعل؟</h2>
                <p className="text-xs text-slate-400 mt-1">اختر لبدء إنشاء تقرير نسب إنجاز جديد، أو متابعة أحد المشاريع القائمة</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {/* New project file */}
                <button onClick={() => setShowQuickCreate(true)}
                  className="group p-6 rounded-3xl border border-slate-700 bg-slate-900/80 hover:border-amber-500/60 hover:bg-slate-900 transition text-right shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="text-sm font-bold text-white">ملف مشروع جديد</div>
                      <div className="text-[12px] text-slate-400 mt-1 leading-relaxed">إنشاء مشروع جديد والبدء بتقرير إنجاز فارغ له</div>
                    </div>
                    <div className="w-12 h-12 rounded-3xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-inner">
                      <Rocket className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">جميع البنود تنطلق على نسبة 0% ويمكنك تعديلها لاحقاً بسهولة.</div>
                </button>

                {/* Existing project */}
                <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-3xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">مشروع قائم</div>
                      <div className="text-[11px] text-slate-400">اختر مشروعاً متاحاً لمراجعة تقرير سابق أو متابعة نسبة الإنجاز الحالية</div>
                    </div>
                  </div>
                  {noProjects ? (
                    <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/70 p-4 text-[11px] text-slate-400 leading-relaxed">
                      لا توجد مشاريع بعد — أنشئ أول مشروع من الخيار الأول <strong className="text-slate-100">ملف مشروع جديد</strong>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {projects.map((p) => (
                        <button key={p.id} onClick={() => enterProject(p.id)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950/70 hover:border-blue-500/60 text-sm text-slate-200 font-semibold transition">
                          <div className="min-w-0 text-right">
                            <div className="truncate">{p.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">{p.location}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <>
            {/* Project switcher */}
            <div className="print:hidden bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-3xl bg-blue-500/10 text-blue-300 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-300">المشروع الحالي</div>
                  <div className="text-sm font-bold text-white">{selectedProject?.name || 'لم يتم اختيار مشروع'}</div>
                </div>
              </div>

              <div className="flex-1 min-w-[220px]">
                <label className="text-[11px] text-slate-400 mb-1 inline-block">تغيير المشروع</label>
                <select value={selectedProjectId || ''} onChange={handleSelectProject}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-slate-100 outline-none transition">
                  <option value="">— اختر مشروعاً آخر —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap gap-2 justify-end lg:justify-center">
                {selectedProjectId && reportsList.length > 0 && (
                  <button onClick={() => setShowNewPeriod(true)}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2">
                    <Copy className="w-4 h-4" /> تقرير فترة جديدة
                  </button>
                )}
                <div className="rounded-2xl bg-slate-950/80 border border-slate-700 px-4 py-3 text-xs font-semibold text-slate-300">
                  {reportsList.length} فترات محفوظة
                </div>
              </div>
            </div>

            {/* Snapshot Periods nav bar */}
            {reportsList.length > 0 && (
              <div className="print:hidden bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-300">سجل فترات التقارير</div>
                      <div className="text-[11px] text-slate-500">اختر فترة مراجعة سابقة أو قم بتحديث التقرير الحالي</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-950/70 px-3 py-1 text-[11px] text-slate-300">{reportsList.length} فترات</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                  {reportsList.map((r) => (
                    <button key={r.id} onClick={() => loadReport(r.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-semibold whitespace-nowrap transition ${activeReportId === r.id ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:border-slate-500'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{r.report_period}</span>
                      {r.is_archived && <span className="px-2 py-0.5 rounded-full bg-slate-700 text-[10px]">أرشيف</span>}
                      {r.parent_report_id && <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {serverError && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {serverError}
              </div>
            )}

            {loadingReport ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-3 text-xs text-slate-400">جارٍ تحميل التقرير...</span>
              </div>
            ) : (
              <>
                {activeView === 'edit' && (
                  <div className="print:hidden flex items-center gap-x-6 gap-y-2 flex-wrap bg-slate-900/80 border border-slate-800 rounded-3xl px-5 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> العظم
                      <span dir="ltr" className="font-mono text-amber-400">{stProgress}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> التشطيبات
                      <span dir="ltr" className="font-mono text-purple-400">{fnProgress}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> الإنجاز الإجمالي
                      <span dir="ltr" className="font-mono text-emerald-400">{overall}%</span>
                    </div>
                  </div>
                )}

                {activeView === 'edit' ? (
                  <ProgressInputForm data={data} setData={handleDataChange} />
                ) : (
                  <ProgressDashboard data={data} delta={delta} parentOverall={parentOverall} />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <ConfirmModal open={confirmReset} title="استعادة بيانات المرجع"
        message="سيتم استعادة بيانات التقرير المرجعي (مسقا 32) كما في التقرير المعتمد، وحذف أي تعديلات غير محفوظة. متابعة؟"
        confirmLabel="استعادة" danger onConfirm={handleReset} onClose={() => setConfirmReset(false)} />
      <ConfirmModal open={confirmSwitch.open} title="تبديل المشروع"
        message="لديك تعديلات غير محفوظة. متابعة التبديل ستفقدها. متابعة؟"
        confirmLabel="متابعة" danger onConfirm={handleConfirmSwitch} onClose={() => setConfirmSwitch({ open: false, target: null })} />
      <NewPeriodModal open={showNewPeriod} latestPeriod={reportsList[0]?.report_period}
        loading={cloning} onCreate={handleClone} onClose={() => setShowNewPeriod(false)} />
      <QuickCreateProjectModal open={showQuickCreate}
        onCreated={async (p) => {
          // refresh projects list & select the new one
          const res = await projectsApi.list(1, 100);
          if (res.success) setProjects(res.data);
          setSelectedProjectId(p.id);
          await fetchReportsList(p.id);
          setData(createEmptyCompletionData());
          setActiveReportId(null);
          setDirty(false);
          setSaveStatusKey('IDLE');
        }}
        onClose={() => setShowQuickCreate(false)} />
    </div>
  );
};

export default CompletionPercentagePage;