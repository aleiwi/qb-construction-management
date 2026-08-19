import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { confirmDialog } from '../utils/alerts';
import { drawingsApi, boqElementsApi } from '../features/boq/boqApi';
import { buildingsApi } from '../features/projects/projectsApi';
import {
  FileText, Upload, RefreshCw, X, AlertCircle,
  CheckCircle2, Clock, AlertTriangle, Trash2, Eye, Layers,
  UploadCloud, Loader2, FileWarning
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'في الانتظار', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Clock },
  processing: { label: 'قيد المعالجة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  completed: { label: 'تم بنجاح', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  failed: { label: 'فشل', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertTriangle },
};

const UploadModal = ({ buildings, onUpload, onClose }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || '');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validFiles = files.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ext === 'dxf' || ext === 'dwg';
    });
    if (validFiles.length === 0) {
      setError('يُرجى اختيار ملفات .dxf أو .dwg فقط');
      return;
    }
    setError('');
    setSelectedFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedBuilding) { setError('اختر المبنى أولاً'); return; }
    if (selectedFiles.length === 0) { setError('اختر ملفات CAD'); return; }
    setError('');
    setUploading(true);

    if (selectedFiles.length === 1) {
      const res = await onUpload(selectedBuilding, selectedFiles[0]);
      setUploading(false);
      if (!res.success) setError(res.error?.message || 'فشل الرفع');
      else onClose();
    } else {
      const onProgress = (completed, total) => setProgress({ completed, total });
      const results = await drawingsApi.uploadBatch(selectedBuilding, selectedFiles, onProgress);
      setUploading(false);
      const allOk = results.every(r => r.success);
      if (allOk) onClose();
      else setError(`تم رفع ${results.filter(r => r.success).length} من ${results.length} ملف`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            رفع مخططات CAD
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">المبنى</label>
            <select
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(parseInt(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
            >
              <option value="">اختر المبنى</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملفات CAD (.dxf / .dwg)</label>
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-6 text-center transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">اسحب وأفلت الملفات هنا أو اضغط للاختيار</p>
              <p className="text-[10px] text-slate-600 mt-1">يدعم .dxf و .dwg — يمكن اختيار عدة ملفات</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".dxf,.dwg"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-200">{f.name}</span>
                    <span className="text-slate-500 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="p-1 text-slate-400 hover:text-red-400 shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && progress.total > 1 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>جارٍ الرفع...</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={uploading || selectedFiles.length === 0} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{progress.total > 1 ? 'جارٍ الرفع...' : 'جارٍ الرفع...'}</>
              ) : (
                <><Upload className="w-4 h-4" />رفع {selectedFiles.length > 1 ? `(${selectedFiles.length} ملف)` : ''}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DrawingsPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [drawings, setDrawings] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [drawingsRes, buildingsRes] = await Promise.all([
        drawingsApi.list(),
        buildingsApi.list(),
      ]);
      if (drawingsRes.success) setDrawings(drawingsRes.data);
      if (buildingsRes.success) setBuildings(buildingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleUpload = async (buildingId, file) => {
    const res = await drawingsApi.upload(buildingId, file);
    if (res.success) {
      const fileLabel = file.name || '';
      showSuccess(`تم رفع ${fileLabel} وبدء استخراج العناصر`);
      fetchData();
    }
    return res;
  };

  const handleBatchUpload = async (buildingId, files) => {
    const onProgress = (completed, total) => {};
    const results = await drawingsApi.uploadBatch(buildingId, files, onProgress);
    const ok = results.filter(r => r.success).length;
    showSuccess(`تم رفع ${ok} من ${results.length} ملف بنجاح`);
    fetchData();
    return { success: ok > 0 };
  };

  const handleDelete = async (id) => {
    if (!(await confirmDialog('حذف المخطط', 'هل أنت متأكد من حذف هذا المخطط؟'))) return;
    const res = await drawingsApi.delete(id);
    if (res.success) { showSuccess('تم حذف المخطط'); fetchData(); }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '';
    if (seconds < 60) return `${seconds.toFixed(1)} ث`;
    return `${(seconds / 60).toFixed(1)} د`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PageHeader
        title="حصر الكميات (BOQ)"
        subtitle="رفع المخططات CAD واستخراج العناصر"
        actions={
          <>
            <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold" title="تحديث">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {permissions.canManageProjects && (
              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <UploadCloud className="w-4 h-4" />
                <span>رفع مخططات</span>
              </button>
            )}
            <button
              onClick={() => navigate('/boq-review')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold"
            >
              <Layers className="w-4 h-4" />
              <span>مراجعة غير المصنفة</span>
            </button>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المخططات', value: drawings.length, color: 'text-indigo-400' },
            { label: 'تم بنجاح', value: drawings.filter(d => d.status === 'completed').length, color: 'text-emerald-400' },
            { label: 'قيد المعالجة', value: drawings.filter(d => d.status === 'processing').length, color: 'text-amber-400' },
            { label: 'بانتظار المراجعة', value: drawings.filter(d => d.status === 'completed' && d.unclassified_count > 0).length, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-4 text-xs text-indigo-300 flex items-start gap-3">
          <FileText className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-1">محرك حصر الكميات — الإصدار المطوّر</p>
            <p>يدعم الآن: LINE, LWPOLYLINE, POLYLINE, SPLINE, ELLIPSE, CIRCLE, ARC, DIMENSION, HATCH, INSERT/BLOCK. يتم تحويل DWG تلقائياً. يمكن رفع عدة ملفات دفعة واحدة.</p>
          </div>
        </div>

        {/* Drawings List */}
        {loading && drawings.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل المخططات...</p>
            </div>
          </div>
        ) : drawings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد مخططات</h3>
            <p className="text-sm text-slate-500 mb-6">ارفع أول مخطط CAD للمباشرة بحصر الكميات</p>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              <button onClick={() => setShowUpload(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />رفع مخططات
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {drawings.map(d => {
              const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              return (
                <div key={d.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-base">{d.file_name}</h3>
                          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border flex items-center gap-1 ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span>مبنى #{d.building_id}</span>
                          {d.elements_count > 0 && (
                            <>
                              <span className="text-blue-400">{d.elements_count} عنصر</span>
                              <span className="text-emerald-400">{d.classified_count} مصنف</span>
                              {d.unclassified_count > 0 && (
                                <span className="text-orange-400">{d.unclassified_count} غير مصنف</span>
                              )}
                            </>
                          )}
                          {d.processing_time > 0 && (
                            <span className="text-slate-500">{formatTime(d.processing_time)}</span>
                          )}
                        </div>
                        {d.error_message && (
                          <p className="text-xs text-red-400 mt-2">{d.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/drawings/${d.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20"
                        title="عرض المخطط"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {d.status === 'completed' && d.unclassified_count > 0 && (
                        <button
                          onClick={() => navigate('/boq-review')}
                          className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition border border-transparent hover:border-orange-500/20"
                          title="مراجعة غير المصنفة"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                      )}
                      {permissions.isAdmin && (
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal
          buildings={buildings}
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};
