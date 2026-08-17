import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { drawingsApi, boqElementsApi } from '../features/boq/boqApi';
import { useAuth } from '../hooks/useAuth';
import { LogoutButton } from '../components/ui/LogoutButton';
import DxfCanvas, { computeDxfViewBox, collectDxfLayers } from '../components/dxf/DxfCanvas';
import {
  ArrowRight, Download, ZoomIn, ZoomOut,
  FileText, CheckCircle2, AlertTriangle, Clock, Loader2, Eye, Crosshair,
  Layers, Grid3X3, PanelRightClose, RefreshCw,   Maximize, Minimize, HelpCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'في الانتظار', color: 'text-slate-400', icon: Clock },
  processing: { label: 'قيد المعالجة', color: 'text-amber-400', icon: Loader2, pulse: true },
  completed: { label: 'تم بنجاح', color: 'text-emerald-400', icon: CheckCircle2 },
  failed: { label: 'فشل', color: 'text-red-400', icon: AlertTriangle },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

const BackgroundGrid = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns={SVG_NS}>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.04)" strokeWidth="1" />
      </pattern>
      <pattern id="grid-large" width="200" height="200" patternUnits="userSpaceOnUse">
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-large)" />
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

const ELEMENT_TYPE_MAP = {
  wall: { label: 'جدار', color: 'border-r-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  column: { label: 'عمود', color: 'border-r-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  slab: { label: 'بلاطة', color: 'border-r-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  beam: { label: 'جسر', color: 'border-r-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  footing: { label: 'قاعدة', color: 'border-r-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
  door: { label: 'باب', color: 'border-r-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  window: { label: 'نافذة', color: 'border-r-sky-500', bg: 'bg-sky-500/10', text: 'text-sky-400', dot: 'bg-sky-400' },
  staircase: { label: 'درج', color: 'border-r-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  other: { label: 'أخرى', color: 'border-r-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
};

const CoordDisplay = ({ svgX, svgY, visible }) => {
  if (!visible) return null;
  return (
    <span className="flex items-center gap-1 shrink-0 text-slate-400 font-mono text-[10px]" dir="ltr">
      <Crosshair className="w-3 h-3" />
      {Math.round(svgX)}, {Math.round(svgY)}
    </span>
  );
};

const formatFileSize = (bytes) => {
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const formatDistance = (dist) => {
  const num = dist >= 100 ? Math.round(dist) : dist >= 10 ? +dist.toFixed(1) : +dist.toFixed(2);
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export const DrawingViewerPage = () => {
  const { drawingId } = useParams();
  const navigate = useNavigate();
  const [drawing, setDrawing] = useState(null);
  const [elements, setElements] = useState([]);
  const [elementsSummary, setElementsSummary] = useState(null);
  const [elementsTotal, setElementsTotal] = useState(0);
  const [elementsLoading, setElementsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skip, setSkip] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const PAGE_SIZE = 500;
  const [svgContent, setSvgContent] = useState(null);
  const [dxfText, setDxfText] = useState(null);
  const [layers, setLayers] = useState(null);
  const [layerVisibility, setLayerVisibility] = useState(null);
  const [showLayers, setShowLayers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [svgLoading, setSvgLoading] = useState(true);
  const [svgError, setSvgError] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [touchDist, setTouchDist] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showElements, setShowElements] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const toggleGroup = (type) => setExpandedGroups(prev => {
    const next = new Set(prev);
    next.has(type) ? next.delete(type) : next.add(type);
    return next;
  });
  const [immersive, setImmersive] = useState(false);
  const [cursorSvg, setCursorSvg] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [elementFilter, setElementFilter] = useState('');
  const [measuring, setMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState(null);
  const [measureEnd, setMeasureEnd] = useState(null);
  const [processingElapsed, setProcessingElapsed] = useState(0);
  const [zoomTransition, setZoomTransition] = useState('transform 0.08s ease-out');
  const containerRef = useRef(null);
  const zoomContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const wheelTimerRef = useRef(null);
  const viewBoxRef = useRef(null);
  const cursorRafRef = useRef(null);
  const lastMouseRef = useRef(null);
  const zoomStep = 0.25;
  const zoomMin = 0.05;
  const zoomMax = 20;

  panRef.current = pan;
  zoomRef.current = zoom;

  const parseViewBox = useCallback((svg) => {
    const match = svg.match(/viewBox=["']([^"']+)["']/);
    if (!match) return null;
    const parts = match[1].split(/[\s,]+/).map(Number);
    if (parts.length < 4) return null;
    return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
  }, []);

  const fetchDrawing = useCallback(async (id) => {
    try {
      const res = await drawingsApi.get(id);
      if (res.success) {
        setDrawing(res.data);
        return res.data;
      }
      setError(res.error?.message || 'فشل تحميل بيانات المخطط');
      return null;
    } catch (e) {
      setError(e.response?.data?.detail || 'فشل الاتصال بالخادم');
      return null;
    }
  }, []);

  const fetchElementsData = useCallback(async (id, opts = {}) => {
    setElementsLoading(true);
    try {
      const [elemsRes, summaryRes] = await Promise.all([
        boqElementsApi.list(id, {
          skip: opts.skip ?? 0,
          limit: PAGE_SIZE,
          search: opts.search || '',
          elementType: opts.type || '',
          classificationStatus: opts.status || '',
        }),
        boqElementsApi.summary(id),
      ]);
      if (elemsRes.success) {
        const data = elemsRes.data || {};
        setElements(data.items || []);
        setFilteredTotal(data.total ?? 0);
      }
      if (summaryRes.success) {
        const s = summaryRes.data;
        setElementsSummary(s);
        setElementsTotal(s?.total ?? 0);
      }
    } catch (e) {
      setElements([]);
      setElementsSummary(null);
      setElementsTotal(0);
      setFilteredTotal(0);
    } finally {
      setElementsLoading(false);
    }
  }, []);

  const fetchPreview = useCallback(async (id) => {
    setSvgLoading(true);
    setSvgError(false);
    try {
      const raw = await drawingsApi.getView(id);
      if (raw && raw.length > 0) {
        const vb = computeDxfViewBox(raw);
        if (!vb) throw new Error('تعذر قراءة هندسة الملف');
        setDxfText(raw);
        setLayers(collectDxfLayers(raw));
        setLayerVisibility(null);
        viewBoxRef.current = vb;
        return true;
      }
      setDxfText(null);
      setSvgError(true);
      return false;
    } catch (e) {
      setDxfText(null);
      const raw = e.response?.data;
      const data = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
      setSvgError(
        data?.error?.message
        || data?.detail
        || true
      );
      return false;
    } finally {
      setSvgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!drawingId) return;
    setLoading(true);
    fetchDrawing(parseInt(drawingId)).then(d => {
      setLoading(false);
    });
  }, [drawingId, fetchDrawing]);

  useEffect(() => {
    if (!drawingId) return;
    const id = parseInt(drawingId);
    if (drawing && (drawing.status === 'completed' || drawing.status === 'failed')) {
      fetchPreview(id);
    }
  }, [drawingId, drawing, fetchPreview]);

  useEffect(() => {
    if (!drawingId) return;
    const id = parseInt(drawingId);
    if (drawing && drawing.status === 'completed') {
      fetchElementsData(id, { skip, search: searchQuery, type: typeFilter, status: statusFilter });
    }
  }, [drawingId, drawing, skip, searchQuery, typeFilter, statusFilter, fetchElementsData]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setShowElements(false);
    setElementFilter('');
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setSkip(0);
    setFilteredTotal(0);
    setExpandedGroups(new Set());
    setCursorSvg(null);
    setShowShortcuts(false);
    setSvgContent(null);
    setDxfText(null);
    setLayers(null);
    setLayerVisibility(null);
    setShowLayers(false);
    setSvgLoading(true);
    setSvgError(false);
    setError('');
    setImmersive(false);
    setMeasuring(false);
    setMeasureStart(null);
    setMeasureEnd(null);
    wasProcessingRef.current = false;
  }, [drawingId]);

  const pollStatusRef = useRef(null);

  const isProcessing = drawing && (drawing.status === 'pending' || drawing.status === 'processing');

  useEffect(() => {
    if (!drawing) return;
    pollStatusRef.current = drawing.status;
    if (drawing.status === 'completed' || drawing.status === 'failed') return;
    const interval = setInterval(async () => {
      if (pollStatusRef.current === 'completed' || pollStatusRef.current === 'failed') {
        clearInterval(interval);
        return;
      }
      const id = drawing.id;
      const updated = await fetchDrawing(id);
      if (!updated) return;
      pollStatusRef.current = updated.status;
      setDrawing(updated);
    }, 3000);
    return () => clearInterval(interval);
  }, [drawing?.id, fetchDrawing]);

  const startTimeRef = useRef(null);
  const wasProcessingRef = useRef(false);

  useEffect(() => {
    if (!elementFilter) {
      setSearchQuery('');
      setSkip(0);
      return;
    }
    const t = setTimeout(() => {
      setSearchQuery(elementFilter);
      setSkip(0);
    }, 350);
    return () => clearTimeout(t);
  }, [elementFilter]);

  useEffect(() => {
    if (wasProcessingRef.current && !isProcessing && elements.length > 0) {
      setShowElements(true);
    }
    wasProcessingRef.current = isProcessing;
  }, [isProcessing, elements.length]);

  useEffect(() => {
    if (isProcessing) {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        setProcessingElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
    setProcessingElapsed(0);
  }, [isProcessing]);

  const fitToViewport = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const el = zoomContainerRef.current;
    if (el) el.style.transition = 'transform 0.15s ease-out';
    setZoomTransition('transform 0.15s ease-out');
    setTimeout(() => {
      if (el) el.style.transition = '';
      setZoomTransition('transform 0.08s ease-out');
    }, 200);
  }, []);

  useEffect(() => {
    if (svgContent && !svgLoading) {
      const timer = setTimeout(fitToViewport, 50);
      return () => clearTimeout(timer);
    }
  }, [svgContent, svgLoading, fitToViewport]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let resizeTimer;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => fitToViewport(), 200);
    });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(resizeTimer); };
  }, [fitToViewport]);

  const changeZoom = useCallback((delta, centerX, centerY, instant) => {
    const prev = zoomRef.current;
    const newZoom = Math.max(zoomMin, Math.min(zoomMax, prev + delta));
    let newPan = { ...panRef.current };
    if (centerX !== undefined && centerY !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = centerX - rect.left - rect.width / 2;
      const my = centerY - rect.top - rect.height / 2;
      newPan = { x: mx - (mx - newPan.x) * newZoom / prev, y: my - (my - newPan.y) * newZoom / prev };
    }
    if (instant) {
      const el = zoomContainerRef.current;
      if (el) el.style.transition = 'none';
      setZoomTransition('none');
      clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        setZoomTransition('transform 0.08s ease-out');
      }, 80);
    }
    setZoom(newZoom);
    setPan(newPan);
  }, []);

  const handleZoomIn = useCallback(() => changeZoom(zoomStep), [changeZoom]);
  const handleZoomOut = useCallback(() => changeZoom(-zoomStep), [changeZoom]);
  const handleZoomReset = useCallback(() => fitToViewport(), [fitToViewport]);

  const setZoomAbsolute = useCallback((val) => {
    const newZoom = Math.max(zoomMin, Math.min(zoomMax, val));
    const prev = zoomRef.current;
    setZoom(newZoom);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = rect.width / 2;
      const my = rect.height / 2;
      setPan(p => ({ x: mx - (mx - p.x) * newZoom / prev, y: my - (my - p.y) * newZoom / prev }));
    }
  }, []);

  const screenToSvg = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    const vb = viewBoxRef.current;
    if (!el || !vb) return null;
    const rect = el.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    const p = panRef.current;
    const z = zoomRef.current;
    // undo zoom/pan (transform is translate(pan) scale(zoom) around center)
    const cx = (relX - rect.width / 2 - p.x) / z;
    const cy = (relY - rect.height / 2 - p.y) / z;
    const px = cx + rect.width / 2;
    const py = cy + rect.height / 2;
    // fit: aspect-preserving scale + centering (same as DxfCanvas)
    const scale = Math.min(rect.width / vb.width, rect.height / vb.height);
    const ox = (rect.width - vb.width * scale) / 2;
    const oy = (rect.height - vb.height * scale) / 2;
    return {
      x: vb.minX + (px - ox) / scale,
      y: vb.minY + (py - oy) / scale,
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (measuring) {
      if (e.button !== 0) return;
      const coord = screenToSvg(e.clientX, e.clientY);
      if (!coord) return;
      if (!measureStart) {
        setMeasureStart(coord);
      } else {
        setMeasureEnd(coord);
        setMeasuring(false);
      }
      return;
    }
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    setIsPanning(true);
    const p = panRef.current;
    panStartRef.current = { x: e.clientX - p.x, y: e.clientY - p.y };
  }, [measuring, measureStart, screenToSvg]);

  const handleMouseMove = useCallback((e) => {
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    if (isPanning) {
      const start = panStartRef.current;
      setPan({ x: e.clientX - start.x, y: e.clientY - start.y });
    }
    if (!cursorRafRef.current) {
      cursorRafRef.current = requestAnimationFrame(() => {
        cursorRafRef.current = null;
        const pos = lastMouseRef.current;
        if (pos) {
          const coord = screenToSvg(pos.x, pos.y);
          setCursorSvg(coord);
        }
      });
    }
  }, [isPanning, screenToSvg]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);
  const handleMouseLeave = useCallback(() => { setIsPanning(false); setCursorSvg(null); }, []);

  const handleDoubleClick = useCallback((e) => {
    if (measuring) return;
    const delta = e.shiftKey ? -zoomStep * 2 : zoomStep;
    changeZoom(delta, e.clientX, e.clientY, true);
  }, [changeZoom, measuring]);

  const handleTouchStart = useCallback((e) => {
    if (measuring && e.touches.length === 1) {
      const coord = screenToSvg(e.touches[0].clientX, e.touches[0].clientY);
      if (!coord) return;
      if (!measureStart) {
        setMeasureStart(coord);
      } else {
        setMeasureEnd(coord);
        setMeasuring(false);
      }
      return;
    }
    if (e.touches.length === 1) {
      setIsPanning(true);
      const p = panRef.current;
      panStartRef.current = { x: e.touches[0].clientX - p.x, y: e.touches[0].clientY - p.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setTouchDist(Math.sqrt(dx * dx + dy * dy));
    }
  }, [measuring, measureStart, screenToSvg]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (isPanning) {
        const start = panStartRef.current;
        setPan({ x: e.touches[0].clientX - start.x, y: e.touches[0].clientY - start.y });
      }
      if (measuring && !cursorRafRef.current) {
        cursorRafRef.current = requestAnimationFrame(() => {
          cursorRafRef.current = null;
          const pos = lastMouseRef.current;
          if (pos) {
            const coord = screenToSvg(pos.x, pos.y);
            setCursorSvg(coord);
          }
        });
      }
    } else if (e.touches.length === 2) {
      setTouchDist(prevDist => {
        if (prevDist === null) return null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        const scale = newDist / prevDist;
        setZoom(prev => Math.max(zoomMin, Math.min(zoomMax, prev * scale)));
        return newDist;
      });
    }
  }, [isPanning, measuring, screenToSvg]);

  const handleTouchEnd = useCallback(() => { setIsPanning(false); setTouchDist(null); }, []);
  const handleRetry = useCallback(() => { if (drawing) fetchPreview(drawing.id); }, [drawing, fetchPreview]);

  const downloadSvg = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(drawing?.file_name || 'drawing').replace(/\.(dxf|dwg)$/i, '')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [svgContent, drawing]);

  useEffect(() => {
    const endPan = () => setIsPanning(false);
    const handleBlur = () => { setIsPanning(false); setCursorSvg(null); };
    window.addEventListener('mouseup', endPan);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('mouseup', endPan);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const toggleImmersive = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setImmersive(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setImmersive(false)).catch(() => {});
    }
  }, []);
  useEffect(() => {
    const handler = () => setImmersive(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  useEffect(() => { if (immersive && !document.fullscreenElement) setShowElements(false); }, [immersive]);

  useEffect(() => {
    if (showElements && searchInputRef.current) searchInputRef.current.focus();
  }, [showElements]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      changeZoom(delta, e.clientX, e.clientY, true);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [changeZoom]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      const step = e.shiftKey ? 200 : 50;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); setPan(p => ({ ...p, y: p.y + step })); break;
        case 'ArrowDown': e.preventDefault(); setPan(p => ({ ...p, y: p.y - step })); break;
        case 'ArrowLeft': e.preventDefault(); setPan(p => ({ ...p, x: p.x + step })); break;
        case 'ArrowRight': e.preventDefault(); setPan(p => ({ ...p, x: p.x - step })); break;
        case '+': case '=': e.preventDefault(); handleZoomIn(); break;
        case '-': e.preventDefault(); handleZoomOut(); break;
        case '0': e.preventDefault(); handleZoomReset(); break;
        case '?': e.preventDefault(); setShowShortcuts(v => !v); break;
        case 'f': case 'F': e.preventDefault(); toggleImmersive(); break;
        case 'm': case 'M': e.preventDefault(); if (measureEnd) { setMeasureEnd(null); setMeasureStart(null); } setMeasuring(v => !v); break;
        case 'Escape': e.preventDefault(); setShowShortcuts(false); setMeasuring(false); setMeasureStart(null); setMeasureEnd(null); if (document.fullscreenElement) document.exitFullscreen(); setImmersive(false); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleZoomIn, handleZoomOut, handleZoomReset, toggleImmersive]);

  const statusCfg = drawing ? STATUS_CONFIG[drawing.status] || STATUS_CONFIG.pending : null;

  const groupedElements = elements.reduce((acc, el) => {
    const key = el.element_type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(el);
    return acc;
  }, {}) || {};

  const elementTypeCounts = Object.entries(elementsSummary?.by_type || {}).reduce((acc, [type, count]) => {
    const key = ELEMENT_TYPE_MAP[type] ? type : 'other';
    const existing = acc.find(i => i.type === key);
    if (existing) {
      existing.count += count;
    } else {
      acc.push({ type: key, count, config: ELEMENT_TYPE_MAP[key] || ELEMENT_TYPE_MAP.other });
    }
    return acc;
  }, []);

  const hasActiveFilters = !!(elementFilter || typeFilter || statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جارٍ تحميل المخطط...</p>
        </div>
      </div>
    );
  }

  if (error && !drawing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-200 mb-2">خطأ</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/drawings')} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">العودة للمخططات</button>
            <button onClick={async () => { const d = await fetchDrawing(parseInt(drawingId)); if (d && (d.status === 'completed' || d.status === 'failed')) fetchPreview(d.id); }} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20">إعادة المحاولة</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col">
      {!immersive && (
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate('/drawings')} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0">
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-lg flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate">{drawing?.file_name}</h1>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{elementsTotal || drawing?.elements_count || 0} عناصر</span>
                  <span>•</span>
                  {statusCfg && (
                    <span className={`flex items-center gap-1 ${statusCfg.color} ${statusCfg.pulse ? 'animate-pulse' : ''}`}>
                      <statusCfg.icon className={`w-3 h-3 ${statusCfg.pulse ? 'animate-spin' : ''}`} />
                      {statusCfg.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
              <button
                onClick={() => setShowLayers(v => !v)}
                className={`p-1.5 rounded-lg transition shrink-0 ${showLayers ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="الطبقات"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowElements(v => !v)}
                className={`p-1.5 rounded-lg transition shrink-0 relative ${showElements ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="قائمة العناصر"
              >
                {showElements ? <PanelRightClose className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                {!showElements && elementsTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setShowGrid(v => !v)}
                className={`p-1.5 rounded-lg transition shrink-0 ${showGrid ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="إظهار/إخفاء الشبكة"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => { if (measureEnd) { setMeasureEnd(null); setMeasureStart(null); } setMeasuring(v => !v); }}
                className={`p-1.5 rounded-lg transition shrink-0 ${measuring ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="قياس المسافة"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l3-3m0 0l3 3m-3-3V3m12 18l-3-3m0 0l-3 3m3-3V3" />
                </svg>
              </button>
              <button
                onClick={() => setShowShortcuts(v => !v)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
                title="اختصارات لوحة المفاتيح (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-0.5 bg-slate-800/80 border border-slate-700/50 rounded-lg px-1.5 py-1 shrink-0">
                <button onClick={handleZoomOut} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition" title="تصغير (-)">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400 w-9 text-center font-mono select-none">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition" title="تكبير (+)">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-700/50 mx-0.5" />
                <button onClick={handleZoomReset} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition" title="ملاءمة (0)">
                  <Crosshair className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 w-20 sm:w-24 shrink-0">
                <input
                  type="range"
                  min={zoomMin * 100}
                  max={zoomMax * 100}
                  step={1}
                  value={Math.round(zoom * 100)}
                  onChange={e => setZoomAbsolute(parseInt(e.target.value) / 100)}
                  className="w-full h-1 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
                  title="تكبير/تصغير"
                />
              </div>
              <button
                onClick={() => toggleImmersive()}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
                title="ملء الشاشة (F)"
              >
                <Maximize className="w-4 h-4" />
              </button>
              {drawing && (
                <a
                  href={drawingsApi.getDownloadUrl(drawing.id)}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
                  title="تحميل الملف"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تحميل</span>
                </a>
              )}
              {svgContent && (
                <button
                  onClick={downloadSvg}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
                  title="تحميل معاينة SVG"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">SVG</span>
                </button>
              )}
            </div>
            <LogoutButton compact />
          </div>
        </header>
      )}

      {immersive && (
        <div className="absolute top-3 left-3 z-50 flex items-center gap-2">
          <button
            onClick={() => toggleImmersive()}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg backdrop-blur-sm border border-slate-700/50 transition shadow-lg"
            title="الخروج من ملء الشاشة (Esc)"
          >
            <Minimize className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className={`flex-1 relative flex overflow-hidden ${immersive ? 'bg-slate-950' : ''}`}>
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-slate-950 relative select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: measuring ? 'crosshair' : isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
          {showGrid && !isProcessing && <BackgroundGrid />}

          {immersive && !isProcessing && svgContent && (
            <div className="absolute top-3 right-3 z-50">
              <span className="px-2 py-1 bg-slate-900/80 border border-slate-700/50 rounded-lg text-[10px] text-slate-400 font-mono backdrop-blur-sm shadow-lg">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          )}

          {isProcessing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
                <RefreshCw className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-300">جارٍ معالجة المخطط</p>
                <p className="text-[11px] text-slate-500 mt-1">يتم استخراج العناصر وتحليلها تلقائياً...</p>
                {processingElapsed >= 3 && (
                  <p className="text-[10px] text-slate-600 mt-2 font-mono">الوقت المنقضي: {processingElapsed} ث</p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : svgLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <p className="text-xs text-slate-500">جارٍ إنشاء المعاينة...</p>
              </div>
            </div>
          ) : svgContent || dxfText ? (
            <div
              ref={zoomContainerRef}
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: zoomTransition,
                willChange: 'transform',
              }}
            >
              <div
                className="pointer-events-none"
                style={{ width: '100%', height: '100%' }}
                dangerouslySetInnerHTML={{ __html: svgContent || '' }}
              />
              {dxfText && viewBoxRef.current && (
                <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
                  <DxfCanvas
                    dxfText={dxfText}
                    viewBox={viewBoxRef.current}
                    layerVisibility={layerVisibility}
                  />
                </div>
              )}
              {(measuring || measureEnd) && measureStart && viewBoxRef.current && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  viewBox={`${viewBoxRef.current.minX} ${viewBoxRef.current.minY} ${viewBoxRef.current.width} ${viewBoxRef.current.height}`}
                >
                  {(() => {
                    const end = measureEnd || cursorSvg;
                    if (!end) return null;
                    const dx = end.x - measureStart.x;
                    const dy = end.y - measureStart.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const midX = (measureStart.x + end.x) / 2;
                    const midY = (measureStart.y + end.y) / 2;
                    const formattedDist = formatDistance(dist);
                    return (
                      <>
                        <line x1={measureStart.x} y1={measureStart.y} x2={end.x} y2={end.y} stroke="#3b82f6" strokeWidth={2 / zoom} strokeDasharray={`${6 / zoom} ${4 / zoom}`} />
                        <circle cx={measureStart.x} cy={measureStart.y} r={4 / zoom} fill="#3b82f6" />
                        <circle cx={end.x} cy={end.y} r={4 / zoom} fill="#3b82f6" />
                        <rect x={midX - (60 / zoom) / 2} y={midY - 14 / zoom} width={60 / zoom} height={18 / zoom} rx={3 / zoom} fill="#1e293b" fillOpacity={0.9} />
                        <text x={midX} y={midY + 4 / zoom} fill="#3b82f6" fontSize={`${11 / zoom}`} textAnchor="middle" fontFamily="monospace" dominantBaseline="middle">{formattedDist}</text>
                      </>
                    );
                  })()}
                </svg>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-400 mb-2">تعذر عرض المخطط</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {typeof svgError === 'string'
                    ? svgError
                    : 'لا يمكن إنشاء عرض لهذا الملف. تأكد من أن الملف بصيغة DXF وأنه غير تالف.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
                  >
                    <RefreshCw className="w-4 h-4" /> إعادة المحاولة
                  </button>
                  {drawing && (
                    <a
                      href={drawingsApi.getDownloadUrl(drawing.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20"
                    >
                      <Download className="w-4 h-4" /> تحميل الملف الأصلي
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {showLayers && layers && layers.length > 0 && (
          <div className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-y-auto transition-all duration-300">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300">الطبقات</h3>
              <button
                onClick={() => setLayerVisibility(null)}
                className="text-[9px] px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
              >إظهار الكل</button>
            </div>
            <div className="p-2 space-y-0.5">
              {layers.map(l => (
                <label key={l.name} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layerVisibility ? layerVisibility[l.name] !== false : true}
                    onChange={e => setLayerVisibility(prev => {
                      const next = prev ? { ...prev } : Object.fromEntries(layers.map(x => [x.name, true]));
                      next[l.name] = e.target.checked;
                      return next;
                    })}
                    className="accent-blue-500 w-3 h-3"
                  />
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
                  <span className="text-[10px] text-slate-400 truncate" dir="ltr">{l.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {showElements && drawing && elementsTotal > 0 && !isProcessing && (
          <div className="w-72 shrink-0 border-r border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300 flex flex-col">
            <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300">عناصر المخطط</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedGroups(new Set(Object.keys(groupedElements)))}
                    className="text-[9px] px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                    title="توسيع الكل"
                  >توسيع</button>
                  <button
                    onClick={() => setExpandedGroups(new Set())}
                    className="text-[9px] px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                    title="طي الكل"
                  >طي</button>
                  <span className="text-[10px] text-slate-500">
                    {filteredTotal > 0 || hasActiveFilters
                      ? `${elements.length} من ${filteredTotal}`
                      : `${elementsTotal} عنصر`}
                  </span>
                </div>
              </div>
              <div className="relative">
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={elementFilter}
                  onChange={e => setElementFilter(e.target.value)}
                  placeholder="بحث في كل العناصر..."
                  className="w-full pr-7 pl-2 py-1 text-[11px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                />
                {elementFilter && (
                  <button
                    onClick={() => setElementFilter('')}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setTypeFilter('')}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition ${
                    !typeFilter ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
                  }`}
                >الكل</button>
                {elementTypeCounts.map(({ type, count, config }) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition ${config.bg} ${
                      typeFilter === type ? `ring-1 ${config.text}` : config.text
                    }`}
                  >
                    {config.label} ({count.toLocaleString('en-US')})
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {[
                  ['', 'الكل'],
                  ['classified', 'مصنف'],
                  ['unclassified', 'غير مصنف'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition ${
                      statusFilter === value
                        ? value === 'classified'
                          ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/40'
                          : value === 'unclassified'
                            ? 'bg-orange-600/20 text-orange-400 ring-1 ring-orange-500/40'
                            : 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/40'
                        : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {elementsLoading ? (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-[10px] text-slate-500">جارٍ التحميل...</span>
                </div>
              ) : Object.keys(groupedElements).length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">لا توجد نتائج للبحث</p>
              ) : (
                Object.entries(groupedElements).map(([type, items]) => {
                const config = ELEMENT_TYPE_MAP[type] || ELEMENT_TYPE_MAP.other;
                const isOpen = expandedGroups.has(type);
                return (
                  <div key={type}>
                    <button
                      onClick={() => toggleGroup(type)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg ${config.bg} hover:opacity-80 transition`}
                    >
                      <span className={`text-[11px] font-medium ${config.text}`}>
                        {config.label}
                        <span className="text-[10px] text-slate-500 mr-1">({items.length})</span>
                      </span>
                      <span className={`text-[9px] text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isOpen && (
                      <div className="mt-1 space-y-0.5 mr-2">
                        {items.map((el) => (
                          <div key={el.id} className="flex flex-col gap-0.5 px-2.5 py-1 rounded-lg bg-slate-800/30">
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <span className="text-[10px] text-slate-400 truncate" dir="ltr">{el.source_layer_name || '—'}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                                el.classification_status === 'classified' ? 'bg-emerald-500/10 text-emerald-400' :
                                el.classification_status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-slate-500/10 text-slate-400'
                              }`}>
                                {el.classification_status === 'classified' ? 'مصنف' :
                                 el.classification_status === 'pending' ? 'معلق' : '—'}
                              </span>
                            </div>
                            {(el.quantity !== undefined && el.quantity !== null && el.quantity > 0) && (
                              <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                <span className={`w-1 h-1 rounded-full ${config.dot}`} />
                                <span dir="ltr">{Number(el.quantity).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                {el.unit ? <span>{el.unit}</span> : null}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
            {filteredTotal > PAGE_SIZE && (
              <div className="shrink-0 p-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setSkip(s => Math.max(0, s - PAGE_SIZE))}
                  disabled={skip === 0}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >السابق</button>
                <span className="text-[10px] text-slate-500 font-mono">
                  {skip / PAGE_SIZE + 1} / {Math.ceil(filteredTotal / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setSkip(s => s + PAGE_SIZE)}
                  disabled={skip + PAGE_SIZE >= filteredTotal}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >التالي</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showShortcuts && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-200 mb-4 text-center">اختصارات لوحة المفاتيح</h3>
            <div className="space-y-2 text-[11px]">
              {[
                ['🖱️ سحب', 'السحب بالماوس أو الإصبع', 'تحريك المخطط'],
                ['🔄 تكبير', 'Scroll / + / - / slider', 'تكبير وتصغير'],
                ['🎯 ملاءمة', '0 / زر الملاءمة', 'عرض المخطط كاملاً'],
                ['✖️ تكبير سريع', 'نقر مزدوج', 'تكبير عند المؤشر'],
                ['🔽 تصغير سريع', 'Shift + نقر مزدوج', 'تصغير عند المؤشر'],
                ['⬆️ تحريك', 'أسهم لوحة المفاتيح', 'تحريك المخطط'],
                ['⏩ تحريك سريع', 'Shift + أسهم', 'تحريك أسرع'],
                ['🖥️ ملء الشاشة', 'F', 'عرض بملء الشاشة'],
                ['❌ خروج', 'Esc', 'خروج من ملء الشاشة'],
                ['📐 إحداثيات', 'تحريك الماوس', 'إظهار الإحداثيات'],
                ['📋 العناصر', 'زر القائمة', 'عرض العناصر المستخرجة'],
                ['❓ الاختصارات', '?', 'عرض هذه الشاشة'],
              ].map(([key, shortcut, desc]) => (
                <div key={shortcut} className="flex items-start gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-800/50">
                  <span className="text-slate-400 w-8 shrink-0">{key}</span>
                  <span className="text-blue-400 font-mono w-28 shrink-0">{shortcut}</span>
                  <span className="text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إغلاق</button>
          </div>
        </div>
      )}

      {drawing && !isProcessing && (
        <div className={`border-t border-slate-800 bg-slate-900/80 shrink-0 px-4 sm:px-6 lg:px-8 py-1.5 flex items-center gap-3 text-[10px] text-slate-500 overflow-x-auto ${immersive ? 'border-t-slate-800/50' : ''}`}>
          <span className="flex items-center gap-1 shrink-0">
            <FileText className="w-3 h-3" />
            {drawing.file_name}
          </span>
          <span className="shrink-0">{formatFileSize(drawing.file_size)}</span>
          <span className="shrink-0 text-slate-600">|</span>
          <span className="shrink-0" dir="ltr">{Math.round(zoom * 100)}%</span>
          <CoordDisplay svgX={cursorSvg?.x || 0} svgY={cursorSvg?.y || 0} visible={!!cursorSvg && !!viewBoxRef.current} />
          {drawing && drawing.elements_count > 0 && (
            <>
              <span className="shrink-0 text-slate-600">|</span>
              {elementTypeCounts.map(({ type, count, config }) => (
                <span key={type} className={`shrink-0 ${config.text}`} dir="ltr">
                  {count} {config.label}
                </span>
              ))}
              {drawing.classified_count > 0 && (
                <>
                  <span className="shrink-0 text-slate-600">|</span>
                  <span className="text-emerald-400 shrink-0">{drawing.classified_count} مصنف</span>
                </>
              )}
              {drawing.unclassified_count > 0 && (
                <span className="text-orange-400 shrink-0">{drawing.unclassified_count} غير مصنف</span>
              )}
            </>
          )}
          {drawing && drawing.processing_time > 0 && (
            <>
              <span className="shrink-0 text-slate-600">|</span>
              <span className="shrink-0">{drawing.processing_time} ث</span>
            </>
          )}
          {measureStart && (measureEnd || cursorSvg) && (
            <>
              <span className="shrink-0 text-slate-600">|</span>
              <span className="shrink-0 text-blue-400" dir="ltr">
                قياس: {formatDistance(Math.hypot(
                  (measureEnd || cursorSvg).x - measureStart.x,
                  (measureEnd || cursorSvg).y - measureStart.y
                ))}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DrawingViewerPage;
