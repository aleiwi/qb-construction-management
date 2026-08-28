import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { drawingsApi } from '../features/boq/boqApi';
import { buildingsApi } from '../features/projects/projectsApi';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import {
  UploadCloud, X, FileText, CheckCircle2, AlertCircle, AlertTriangle,
  Clock, Loader2, Trash2, Upload, Eye
} from 'lucide-react';

const STATUS_ICONS = {
  pending: Clock,
  uploading: Loader2,
  completed: CheckCircle2,
  failed: AlertTriangle,
};

export const BatchUploadPage = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await buildingsApi.list();
        if (res.success && res.data.length > 0) {
          setBuildings(res.data);
          setSelectedBuilding(res.data[0].id);
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  const addFiles = useCallback((newFiles) => {
    setError('');
    const valid = [];
    for (const f of newFiles) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (ext === 'dxf' || ext === 'dwg') valid.push(f);
    }
    if (valid.length === 0) {
      setError('يُرجى اختيار ملفات .dxf أو .dwg فقط');
      return;
    }
    setFiles(prev => [...prev, ...valid]);
  }, []);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResults([]);
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setError('');
    setCompleted(0);
    setTotal(0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleUpload = async () => {
    if (!selectedBuilding) { setError('اختر المبنى أولاً'); return; }
    if (files.length === 0) { setError('اختر ملفات CAD أولاً'); return; }
    setError('');
    setUploading(true);
    setResults([]);
    setCompleted(0);
    setTotal(files.length);

    const items = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      items.push({ file: f.name, status: 'uploading' });
      setResults([...items]);
      try {
        const res = await drawingsApi.upload(selectedBuilding, f);
        const drawingId = res.data?.id;
        items[i] = { file: f.name, status: res.success ? 'completed' : 'failed', error: res.error?.detail || '', drawingId };
        if (res.success) setCompleted(prev => prev + 1);
      } catch (err) {
        items[i] = { file: f.name, status: 'failed', error: err.response?.data?.detail || err.message || 'فشل الرفع' };
      }
      setResults([...items]);
    }

    setUploading(false);
  };

  const successCount = results.filter(r => r.status === 'completed').length;
  const failCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="رفع دفعة من المخططات"
        subtitle="رفع ومعالجة عدة ملفات CAD دفعة واحدة"
        actions={
          <>
            <span className="text-xs text-slate-500 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
              {files.length} ملف
            </span>
          </>
        }
      />

      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Building Selector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">المبنى</label>
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

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer ${
            dragOver
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-slate-700 hover:border-blue-500/50 bg-slate-900/40'
          }`}
        >
          <UploadCloud className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-blue-400' : 'text-slate-500'}`} />
          <p className="text-sm text-slate-300 font-semibold mb-1">اسحب وأفلت ملفات CAD هنا</p>
          <p className="text-xs text-slate-500 mb-4">أو اضغط لاختيار الملفات</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 transition">
            <Upload className="w-3.5 h-3.5" />
            اختر ملفات
          </div>
          <p className="text-[10px] text-slate-600 mt-3">يدعم .dxf و .dwg — يمكن اختيار عدة ملفات</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".dxf,.dwg"
            multiple
            onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300">الملفات المختارة ({files.length})</h3>
              {!uploading && (
                <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />مسح الكل
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {files.map((f, i) => {
                const fileResult = results[i];
                const status = fileResult?.status || 'pending';
                const StatusIcon = STATUS_ICONS[status];
                const isError = status === 'failed';
                return (
                  <div key={i} className={`flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2.5 text-xs ${
                    isError ? 'border border-red-800/30' : ''
                  }`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-200">{f.name}</span>
                      <span className="text-slate-500 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                      {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
                      {isError && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    </div>
                    {status === 'pending' && !uploading && (
                      <button onClick={() => removeFile(i)} className="p-1 text-slate-400 hover:text-red-400 shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">جارٍ رفع ومعالجة الملفات...</span>
              <span className="text-blue-400 font-bold">{completed} / {total}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(completed / total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && !uploading && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300">نتائج الرفع</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> {successCount} نجاح
              </div>
              {failCount > 0 && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="w-4 h-4" /> {failCount} فشل
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-400">
                <FileText className="w-4 h-4" /> {results.length} إجمالي
              </div>
            </div>
            {results.filter(r => r.status === 'completed').length > 0 && (
              <div className="space-y-1">
                {results.filter(r => r.status === 'completed').map((r, i) => (
                  <div key={i} className="text-xs text-emerald-400 flex items-center gap-2 bg-emerald-950/20 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span className="flex-1 truncate">{r.file}</span>
                    {r.drawingId && (
                      <button
                        onClick={() => navigate(`/drawings/${r.drawingId}`)}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 shrink-0"
                      >
                        <Eye className="w-3 h-3" /> عرض
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {failCount > 0 && (
              <div className="space-y-1">
                {results.filter(r => r.status === 'failed').map((r, i) => (
                  <div key={i} className="text-xs text-red-400 flex items-start gap-2 bg-red-950/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span><strong>{r.file}:</strong> {r.error || 'فشل غير معروف'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {files.length > 0 && !uploading && (
            <button
              onClick={handleUpload}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <UploadCloud className="w-4 h-4" />
              رفع {files.length} ملف {files.length > 1 ? 'دفعة واحدة' : ''}
            </button>
          )}
          {uploading && (
            <div className="flex-1 px-6 py-3 bg-blue-600/50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جارٍ الرفع...
            </div>
          )}
          <button
            onClick={() => navigate('/drawings')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
          >
            الذهاب للمخططات
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchUploadPage;
