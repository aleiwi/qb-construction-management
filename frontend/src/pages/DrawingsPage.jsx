import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePerformanceMonitor, useLazyImage, useThrottle, useDebounce } from '../hooks/qb/usePerformance';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { confirmDialog } from '../utils/alerts';
import { toast } from 'react-hot-toast';
import { drawingsApi, boqElementsApi, partitionCadFiles } from '../features/boq/boqApi';
import { buildingsApi } from '../features/projects/projectsApi';
import {
  FileText, Upload, RefreshCw, X, AlertCircle,
  CheckCircle2, Clock, AlertTriangle, Trash2, Eye, Layers,
  UploadCloud, Loader2, FileWarning, Search, Filter, SortAsc,
  ChevronDown, ChevronUp, Package, CheckSquare, Square,
  Download, BarChart3, ZoomIn, ZoomOut, Grid3X3, List,
  ArrowUpDown, FileImage, ImageIcon
} from 'lucide-react';
import { DRAWING_STATUS as STATUS_CONFIG } from '../config/status';
import { formatDuration, formatCount } from '../components/dxf/DrawingViewerWidgets';

const STATUS_FILTERS = [
  { key: 'all', label: 'الكل', color: 'text-slate-400' },
  { key: 'completed', label: 'مكتمل', color: 'text-emerald-400' },
  { key: 'processing', label: 'قيد المعالجة', color: 'text-amber-400' },
  { key: 'pending', label: 'في الانتظار', color: 'text-orange-400' },
  { key: 'failed', label: 'فشل', color: 'text-red-400' },
];

const SORT_OPTIONS = [
  { key: 'name_asc', label: 'الاسم ↑' },
  { key: 'name_desc', label: 'الاسم ↓' },
  { key: 'date_asc', label: 'الأقدم أولاً' },
  { key: 'date_desc', label: 'الأحدث أولاً' },
  { key: 'elements_desc', label: 'العناصر ↓' },
  { key: 'status', label: 'حسب الحالة' },
];

const ITEMS_PER_PAGE = 10;

const UploadModal = ({ buildings, onUpload, onClose }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || '');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const { valid, rejected } = partitionCadFiles(files);
    if (rejected.length > 0) {
      setError(rejected.length === 1 ? rejected[0].error : `${rejected.length} ملف مرفوض`);
      toast.error(`تم رفض ${rejected.length} ملف`);
    }
    if (valid.length > 0) {
      setError('');
      setSelectedFiles(prev => [...prev, ...valid]);
      toast.success(`تم إضافة ${valid.length} ملف`);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    const { valid, rejected } = partitionCadFiles(files);
    if (rejected.length > 0) toast.error(`${rejected.length} ملف مرفوض`);
    if (valid.length > 0) {
      setSelectedFiles(prev => [...prev, ...valid]);
      toast.success(`تم إضافة ${valid.length} ملف`);
    }
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

    try {
      if (selectedFiles.length === 1) {
        const res = await onUpload(selectedBuilding, selectedFiles[0]);
        setUploading(false);
        if (!res.success) {
          setError(res.error?.message || 'فشل الرفع');
          toast.error('فشل الرفع');
        } else {
          toast.success('تم رفع المخطط بنجاح');
          onClose();
        }
      } else {
        const onProgress = (completed, total) => setProgress({ completed, total });
        const results = await drawingsApi.uploadBatch(selectedBuilding, selectedFiles, onProgress);
        setUploading(false);
        const ok = results.filter(r => r.success).length;
        if (ok === results.length) {
          toast.success(`تم رفع ${ok} ملف بنجاح`);
          onClose();
        } else {
          toast.error(`تم رفع ${ok} من ${results.length} ملف`);
        }
      }
    } catch (err) {
      setUploading(false);
      setError('حدث خطأ أثناء الرفع');
      toast.error('خطأ في الرفع');
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
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-500/50'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">اسحب وأفلت الملفات هنا أو اضغط للاختيار</p>
              <p className="text-[10px] text-slate-600 mt-1">يدعم .dxf و .dwg — عدة ملفات — الحد 50MB للملف</p>
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
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
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

const DrawingCard = React.memo(({ drawing, statusCfg, onView, onReview, onDelete, canManage, canAdmin }) => {
  const iconRef = useRef(null);
  useLazyImage(iconRef);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div ref={iconRef} className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h3 className="font-bold text-white text-base">{drawing.file_name}</h3>
              <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border flex items-center gap-1 ${statusCfg.color}`}>
                <statusCfg.icon className="w-3 h-3" />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span>مبنى #{drawing.building_id}</span>
              {drawing.elements_count > 0 && (
                <>
                  <span className="text-blue-400">{formatCount(drawing.elements_count)} عنصر</span>
                  <span className="text-emerald-400">{formatCount(drawing.classified_count)} مصنف</span>
                  {drawing.unclassified_count > 0 && (
                    <span className="text-orange-400">{formatCount(drawing.unclassified_count)} غير مصنف</span>
                  )}
                </>
              )}
              {drawing.processing_time > 0 && (
                <span className="text-slate-500">{formatDuration(drawing.processing_time)}</span>
              )}
            </div>
            {drawing.error_message && (
              <p className="text-xs text-red-400 mt-2">{drawing.error_message}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onView(drawing.id)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20" title="عرض المخطط">
            <Eye className="w-4 h-4" />
          </button>
          {drawing.status === 'completed' && drawing.unclassified_count > 0 && (
            <button onClick={() => onReview(drawing.id)} className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition border border-transparent hover:border-orange-500/20" title="مراجعة غير المصنفة">
              <Layers className="w-4 h-4" />
            </button>
          )}
          {canManage && (
            <button onClick={() => onDelete(drawing.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20" title="حذف">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export const DrawingsPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { user } = useAuth();
  const [drawings, setDrawings] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Search, filter, sort, pagination
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [previewDrawing, setPreviewDrawing] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Performance monitoring
  usePerformanceMonitor('DrawingsPage');

  const fetchData = useCallback(async () => {
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
      toast.error('فشل تحميل المخططات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleUpload = async (buildingId, file) => {
    const res = await drawingsApi.upload(buildingId, file);
    if (res.success) {
      toast.success(`تم رفع المخطط بنجاح`);
      fetchData();
    }
    return res;
  };

  const handleBatchUpload = async (buildingId, files) => {
    const onProgress = (completed, total) => {};
    const results = await drawingsApi.uploadBatch(buildingId, files, onProgress);
    const ok = results.filter(r => r.success).length;
    toast.success(`تم رفع ${ok} من ${results.length} ملف`);
    fetchData();
    return { success: ok > 0 };
  };

  const handleDelete = async (id) => {
    if (!(await confirmDialog('حذف المخطط', 'هل أنت متأكد من حذف هذا المخطط؟'))) return;
    const res = await drawingsApi.delete(id);
    if (res.success) { toast.success('تم حذف المخطط'); fetchData(); }
  };

  const handleBatchDelete = async () => {
    if (!(await confirmDialog('حذف مخططات', `هل أنت متأكد من حذف ${selectedIds.length} مخطط؟`))) return;
    const results = await Promise.all(selectedIds.map(id => drawingsApi.delete(id)));
    const ok = results.filter(r => r.success).length;
    toast.success(`تم حذف ${ok} مخطط`);
    setSelectedIds([]);
    fetchData();
  };

  // Filter and sort
  const filteredDrawings = useMemo(() => {
    let result = [...drawings];

    // Search
    if (debouncedSearch) {
      result = result.filter(d =>
        d.file_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        String(d.building_id).includes(debouncedSearch)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    // Building filter
    if (buildingFilter !== 'all') {
      result = result.filter(d => String(d.building_id) === buildingFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return (a.file_name || '').localeCompare(b.file_name || '');
        case 'name_desc': return (b.file_name || '').localeCompare(a.file_name || '');
        case 'date_asc': return new Date(a.created_at) - new Date(b.created_at);
        case 'date_desc': return new Date(b.created_at) - new Date(a.created_at);
        case 'elements_desc': return (b.elements_count || 0) - (a.elements_count || 0);
        case 'status': return (a.status || '').localeCompare(b.status || '');
        default: return 0;
      }
    });

    return result;
  }, [drawings, debouncedSearch, statusFilter, buildingFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredDrawings.length / ITEMS_PER_PAGE);
  const paginatedDrawings = filteredDrawings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.length === paginatedDrawings.length) return [];
      return paginatedDrawings.map(d => d.id);
    });
  }, [paginatedDrawings]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const formatTime = formatDuration;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="إدارة المخططات"
        subtitle="رفع وعرض وإدارة مخططات CAD واستخراج العناصر"
        actions={
          <>
            <button onClick={fetchData} disabled={loading} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50" title="تحديث">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {permissions.canManageProjects && (
              <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20">
                <UploadCloud className="w-4 h-4" />
                <span>رفع مخططات</span>
              </button>
            )}
            <button onClick={() => navigate('/boq-review')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold">
              <Layers className="w-4 h-4" />
              <span>مراجعة غير المصنفة</span>
            </button>
            <button onClick={() => toast.success('جارٍ تصدير التقرير...')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold">
              <Download className="w-4 h-4" />
              <span>تصدير</span>
            </button>
          </>
        }
      />

      <div className="space-y-6">
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المخططات', value: drawings.length, color: 'text-indigo-400', icon: FileText },
            { label: 'تم بنجاح', value: drawings.filter(d => d.status === 'completed').length, color: 'text-emerald-400', icon: CheckCircle2 },
            { label: 'قيد المعالجة', value: drawings.filter(d => d.status === 'processing').length, color: 'text-amber-400', icon: Clock },
            { label: 'بانتظار المراجعة', value: drawings.filter(d => d.status === 'completed' && d.unclassified_count > 0).length, color: 'text-orange-400', icon: AlertTriangle },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                  </div>
                  <Icon className={`w-6 h-6 ${s.color} opacity-50`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم المبنى..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-100 outline-none transition"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 border ${
                showFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>فلترة</span>
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none transition"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">الحالة:</span>
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setStatusFilter(f.key); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition border ${
                    statusFilter === f.key
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-slate-400 mr-2">المبنى:</span>
              <select
                value={buildingFilter}
                onChange={e => { setBuildingFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none"
              >
                <option value="all">الكل</option>
                {buildings.map(b => (
                  <option key={b.id} value={String(b.id)}>#{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Batch Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-300">{selectedIds.length} مخطط محدد</span>
              <button onClick={toggleSelectAll} className="text-xs text-blue-400 hover:text-blue-300 underline">
                {selectedIds.length === paginatedDrawings.length ? 'إلغاء الكل' : 'حدد الكل'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button onClick={handleBatchDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3" />
                  حذف الكل
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drawings List */}
        {loading && drawings.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل المخططات...</p>
            </div>
          </div>
        ) : filteredDrawings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">
              {debouncedSearch || statusFilter !== 'all' ? 'لا توجد نتائج' : 'لا توجد مخططات'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {debouncedSearch || statusFilter !== 'all'
                ? 'جرّب تغيير الفلتر أو بحث كلمة مختلفة'
                : 'ارفع أول مخطط CAD للمباشرة بحصر الكميات'}
            </p>
            {(permissions.isAdmin || permissions.isProjectManager) && !debouncedSearch && statusFilter === 'all' && (
              <button onClick={() => setShowUpload(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />رفع مخططات
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">
                عرض {filteredDrawings.length} مخطط
                {debouncedSearch && ` — نتائج البحث عن "${debouncedSearch}"`}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>ترتيب: {SORT_OPTIONS.find(s => s.key === sortBy)?.label}</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Select all checkbox */}
              <div className="flex items-center gap-2 px-2">
                <button onClick={toggleSelectAll} className="p-1 text-slate-500 hover:text-blue-400 transition">
                  {selectedIds.length === paginatedDrawings.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </div>

              {paginatedDrawings.map(d => {
                const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
                return (
                  <div key={d.id} className={selectedIds.includes(d.id) ? 'ring-2 ring-blue-500/50 rounded-2xl' : ''}>
                    <DrawingCard
                      drawing={d}
                      statusCfg={statusCfg}
                      onView={(id) => navigate(`/drawings/${id}`)}
                      onReview={(id) => navigate(`/drawings/${id}`)}
                      onDelete={handleDelete}
                      canManage={permissions.canManageProjects}
                      canAdmin={permissions.isAdmin}
                    />
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  السابق
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showPreview && previewDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                معاينة {previewDrawing.file_name}
              </h2>
              <button onClick={() => setShowPreview(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center">
                <FileImage className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                <p className="text-sm text-slate-300 mb-2">{previewDrawing.file_name}</p>
                <p className="text-xs text-slate-500 mb-4">مبنى #{previewDrawing.building_id} | {previewDrawing.elements_count || 0} عنصر</p>
                {previewDrawing.svg_content ? (
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={'data:image/svg+xml;base64,' + btoa(previewDrawing.svg_content)} alt="Preview" className="max-w-full max-h-full" />
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-400">جارٍ تحميل المعاينة...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'العناصر', value: previewDrawing.elements_count || 0 },
                  { label: 'المصنفة', value: previewDrawing.classified_count || 0 },
                  { label: 'غير المصنفة', value: previewDrawing.unclassified_count || 0 },
                  { label: 'الحالة', value: previewDrawing.status || 'N/A' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white">{s.value}</div>
                    <div className="text-[10px] text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-800">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إغلاق</button>
              <button onClick={() => { setShowPreview(false); navigate('/drawings/' + previewDrawing.id); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition">عرض كامل</button>
            </div>
          </div>
        </div>
      )}

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
