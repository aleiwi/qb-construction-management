import React, { useEffect, useMemo, useRef } from 'react';
import DxfParser from 'dxf-parser';

const ACI_COLORS = {
  1: '#ff3b30', 2: '#ff9500', 3: '#ffcc00', 4: '#34c759', 5: '#00c7be',
  6: '#007aff', 7: '#f2f2f7', 8: '#8e8e93', 9: '#c7c7cc',
  30: '#ff3b30', 31: '#ff6961', 40: '#ff9500', 41: '#ffb340',
  50: '#ffcc00', 51: '#ffd60a', 60: '#34c759', 61: '#30d158',
  70: '#00c7be', 71: '#66d4cf', 80: '#007aff', 81: '#0a84ff',
  90: '#5856d6', 91: '#5e5ce6', 100: '#af52de', 101: '#bf5af2',
  110: '#ff2d55', 111: '#ff375f', 120: '#ff3b30', 121: '#ff6961',
  130: '#ff9500', 131: '#ffb340', 140: '#ffcc00', 141: '#ffd60a',
  150: '#34c759', 151: '#30d158', 160: '#00c7be', 161: '#66d4cf',
  170: '#007aff', 171: '#0a84ff', 180: '#5856d6', 181: '#5e5ce6',
  190: '#af52de', 191: '#bf5af2', 200: '#ff2d55', 201: '#ff375f',
  210: '#8e8e93', 220: '#aeaeb2', 230: '#c7c7cc', 240: '#d1d1d6',
  250: '#e5e5ea', 251: '#f2f2f7', 252: '#8e8e93', 253: '#636366',
  254: '#48484a', 255: '#3a3a3c',
};

const BY_LAYER = 256;
const BY_BLOCK = 0;

function colorFor(entity, layerColorMap) {
  let idx = entity.colorIndex;
  if (idx === BY_LAYER) idx = layerColorMap[entity.layer] ?? 7;
  if (idx === BY_BLOCK || idx === undefined || idx === null) idx = 7;
  return ACI_COLORS[idx] || '#f2f2f7';
}

const TEXT_HEIGHT = 0.3;

// نطاق قوي ضد الخردة بعيدة (largest-gap clustering): بعض الملفات تحمل عناقيد
// نقاط عند إحداثيات بعيدة جدًا (قوالب/كيانات داخل INSERT) تشكّل >10% من النقاط،
// فتفشل اقتصاد المئينات ويصبح الإطار ضخمًا فيُصغَّر المخطط الحقيقي إلى نقطة سوداء.
// الخوارزمية: افصل عند أكبر فرجة إن بلغت 20% من مدى القطعة مع الاحتفاظ بالجانب
// الأكثر نقاطًا (حتى 3 مرات)، ثم امتص الأجنحة الحقيقية الملاصقة (فرجات صغيرة فقط).
function robustExtents(sorted) {
  const n = sorted.length;
  if (!n) return null;
  let lo = 0, hi = n - 1;
  for (let round = 0; round < 6; round++) {
    const span = sorted[hi] - sorted[lo];
    if (span <= 0) break;
    let maxGap = 0, gapIdx = -1;
    for (let i = lo; i < hi; i++) {
      const gap = sorted[i + 1] - sorted[i];
      if (gap > maxGap) { maxGap = gap; gapIdx = i; }
    }
    if (maxGap < span * 0.2) break;
    if (hi - gapIdx > gapIdx - lo + 1) lo = gapIdx + 1; else hi = gapIdx;
  }
  const tol = Math.max(sorted[hi] - sorted[lo], 1e-9) * 0.25;
  while (hi + 1 < n && sorted[hi + 1] - sorted[hi] <= tol) hi++;
  while (lo > 0 && sorted[lo] - sorted[lo - 1] <= tol) lo--;
  return { min: sorted[lo], max: sorted[hi] };
}

export function computeDxfViewBox(dxfText) {
  let parsed;
  try {
    parsed = new DxfParser().parseSync(dxfText);
  } catch (e) {
    return null;
  }
  if (!parsed || !parsed.entities) return null;
  const blocks = parsed.blocks || {};
  const xs = [], ys = [];

  const add = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    xs.push(x); ys.push(y);
  };

  const walk = (entities, tr = null) => {
    for (const ent of entities || []) {
      if (ent.type === 'INSERT') {
        const block = blocks[ent.name];
        if (!block) continue;
        const local = { x: ent.position?.x ?? 0, y: ent.position?.y ?? 0 };
        const scale = { x: ent.xscale ?? 1, y: ent.yscale ?? 1 };
        const rot = (ent.rotation ?? 0) * Math.PI / 180;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const inner = (x, y) => {
          const sx = x * scale.x, sy = y * scale.y;
          const rx = sx * cos - sy * sin, ry = sx * sin + sy * cos;
          const px = rx + local.x, py = ry + local.y;
          return tr ? tr(px, py) : [px, py];
        };
        walk(block.entities, inner);
        continue;
      }
      const t = (x, y) => (tr ? tr(x, y) : [x, y]);
      switch (ent.type) {
        case 'LINE':
          if (ent.vertices?.length >= 2 && ent.vertices[0] && ent.vertices[1]) {
            const [x1, y1] = t(ent.vertices[0].x, ent.vertices[0].y);
            const [x2, y2] = t(ent.vertices[1].x, ent.vertices[1].y);
            add(x1, y1); add(x2, y2);
          }
          break;
        case 'LWPOLYLINE':
        case 'POLYLINE':
          for (const v of ent.vertices || []) {
            if (!v) continue;
            const [x, y] = t(v.x, v.y);
            add(x, y);
          }
          break;
        case 'CIRCLE':
        case 'ARC': {
          if (!ent.center) break;
          const [cx, cy] = t(ent.center.x, ent.center.y);
          add(cx - ent.radius, cy - ent.radius);
          add(cx + ent.radius, cy + ent.radius);
          break;
        }
        case 'TEXT':
        case 'MTEXT':
        case 'POINT': {
          // dxf-parser: TEXT يرمّز نقطة المحاذاة الأولى كـ startPoint وليس position
          const p = ent.startPoint || ent.position;
          if (!p) break;
          const [x, y] = t(p.x, p.y);
          add(x, y);
          break;
        }
        case 'SOLID':
        case 'TRACE':
          for (const p of ent.points || []) {
            if (!p) continue;
            const [x, y] = t(p.x, p.y);
            add(x, y);
          }
          break;
        default:
          break;
      }
    }
  };
  walk(parsed.entities);
  if (!xs.length) return null;
  const sortedX = [...xs].sort((a, b) => a - b);
  const sortedY = [...ys].sort((a, b) => a - b);
  const rx = robustExtents(sortedX);
  const ry = robustExtents(sortedY);
  if (!rx || !ry) return null;
  let minX = rx.min, maxX = rx.max, minY = ry.min, maxY = ry.max;
  let w = maxX - minX, h = maxY - minY;
  if (w < 1e-9) { w = 1; minX -= 0.5; }
  if (h < 1e-9) { h = 1; minY -= 0.5; }
  const pad = Math.max(w, h) * 0.05;
  return {
    minX: minX - pad, minY: minY - pad,
    width: w + pad * 2, height: h + pad * 2,
  };
}

export function collectDxfLayers(dxfText) {
  let parsed;
  try {
    parsed = new DxfParser().parseSync(dxfText);
  } catch (e) {
    return [];
  }
  const layers = parsed.tables?.layer?.layers || {};
  return Object.entries(layers)
    .map(([name, l]) => ({ name, color: ACI_COLORS[l.colorIndex] || '#f2f2f7' }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function DxfCanvas({ dxfText, viewBox, layerVisibility = null, zoom = 1 }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(viewBox);
  boxRef.current = viewBox;

  // حلّل الملف مرة واحدة فقط لكل نص — إعادة التحليل الكامل عند كل تكبير/إخفاء
  // طبقة كانت تجمّد الصفحة ثواني طويلة للملفات الكبيرة (msg.dwg = 147MB محوّلًا).
  const { parsed, parseError } = useMemo(() => {
    if (!dxfText) return { parsed: null, parseError: false };
    try {
      const p = new DxfParser().parseSync(dxfText);
      console.log('[DxfCanvas] Parsed DXF:', { entities: p.entities?.length, types: p.entities?.slice(0, 3).map(e => e.type) });
      return { parsed: p, parseError: false };
    } catch (e) {
      console.error('[DxfCanvas] Parse error:', e);
      return { parsed: null, parseError: true };
    }
  }, [dxfText]);

  useEffect(() => {


    if (!canvasRef.current || !dxfText) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Draw placeholder when viewBox is not yet available
    if (!viewBox) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('جارٍ تحميل المعاينة...', canvas.width / 2, canvas.height / 2);
      return;
    }
    if (parseError) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('خطأ في قراءة ملف DXF', canvas.width / 2, canvas.height / 2);
      return;
    }
    if (!parsed || !parsed.entities || parsed.entities.length === 0) {
      console.warn('[DxfCanvas] No entities found');
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('لا توجد كيانات في الملف', canvas.width / 2, canvas.height / 2);
      return;
    }

    const layerColorMap = {};
    if (parsed.tables?.layer?.layers) {
      for (const [name, l] of Object.entries(parsed.tables.layer.layers)) {
        layerColorMap[name] = l.colorIndex ?? 7;
      }
    }
    console.log('[DxfCanvas] Layers:', Object.keys(layerColorMap).length);
    const blocks = parsed.blocks || {};

    const drawPolyline = (pts, color, close = false, widthPx = 1) => {
      if (!pts.length) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = widthPx;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (close) ctx.closePath();
      ctx.stroke();
    };

    const walk = (entities, insertTransform = null) => {
      for (const ent of entities || []) {
        const isVisible = layerVisibility === null || layerVisibility[ent.layer] !== false;
        if (!isVisible) continue;

        if (ent.type === 'INSERT') {
          const block = blocks[ent.name];
          if (!block) continue;
          const local = { x: 0, y: 0 };
          if (ent.position) local.x = ent.position.x;
          if (ent.position) local.y = ent.position.y;
          const scale = { x: ent.xscale ?? 1, y: ent.yscale ?? 1 };
          const rot = (ent.rotation ?? 0) * Math.PI / 180;
          const cos = Math.cos(rot), sin = Math.sin(rot);
          const tr = (x, y) => {
            const sx = x * scale.x, sy = y * scale.y;
            const rx = sx * cos - sy * sin;
            const ry = sx * sin + sy * cos;
            return [rx + local.x, ry + local.y];
          };
          walk(block.entities, tr);
          continue;
        }

        const color = colorFor(ent, layerColorMap);
        const tx = insertTransform || ((x, y) => [x, y]);

        switch (ent.type) {
          case 'LINE': {
            if (!ent.vertices || ent.vertices.length < 2 || !ent.vertices[0] || !ent.vertices[1]) break;
            const [x1, y1] = tx(ent.vertices[0].x, ent.vertices[0].y);
            const [x2, y2] = tx(ent.vertices[1].x, ent.vertices[1].y);
            drawPolyline([[x1, y1], [x2, y2]], color);
            break;
          }
          case 'LWPOLYLINE':
          case 'POLYLINE': {
            const pts = (ent.vertices || []).filter(Boolean).map(v => tx(v.x, v.y));
            drawPolyline(pts, color, !!ent.shape, 1);
            break;
          }
          case 'CIRCLE': {
            if (!ent.center) break;
            const [cx, cy] = tx(ent.center.x, ent.center.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, ent.radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
          case 'ARC': {
            if (!ent.center) break;
            const [cx, cy] = tx(ent.center.x, ent.center.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, ent.radius,
              (ent.startAngle || 0) * Math.PI / 180,
              (ent.endAngle || 0) * Math.PI / 180);
            ctx.stroke();
            break;
          }
          case 'ELLIPSE': {
            if (!ent.center) break;
            const [cx, cy] = tx(ent.center.x, ent.center.y);
            const rx = ent.majorAxisEndPoint
              ? Math.hypot(ent.majorAxisEndPoint.x, ent.majorAxisEndPoint.y)
              : 1;
            const ry = Math.abs(rx * (ent.axisRatio ?? 1));
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((ent.rotation || 0) * Math.PI / 180);
            ctx.beginPath();
            ctx.ellipse(0, 0, Math.max(rx, 1e-9), Math.max(ry, 1e-9),
              0, ent.startAngle || 0, ent.endAngle || Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            break;
          }
          case 'TEXT':
          case 'MTEXT': {
            // dxf-parser: TEXT يرمّز نقطة المحاذاة الأولى كـ startPoint وليس position
            const p = ent.startPoint || ent.position;
            if (!p) break;
            const [tx1, ty1] = tx(p.x, p.y);
            ctx.fillStyle = color;
            ctx.font = `${ent.textHeight || TEXT_HEIGHT}px monospace`;
            ctx.fillText((ent.text || '').replace(/\\n/g, ' '), tx1, ty1);
            break;
          }
          case 'SOLID':
          case 'TRACE': {
            const pts = (ent.points || []).filter(Boolean).map(p => tx(p.x, p.y));
            if (pts.length >= 3) {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.moveTo(pts[0][0], pts[0][1]);
              for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
              ctx.closePath();
              ctx.fill();
            }
            break;
          }
          case 'POINT': {
            if (!ent.position) break;
            const [px, py] = tx(ent.position.x, ent.position.y);
            ctx.fillStyle = color;
            ctx.fillRect(px - 1, py - 1, 2, 2);
            break;
          }
          default:
            break;
        }
      }
    };

    // fit: world coords -> container pixels (aspect preserved, centered)
    const fitToSize = () => {
      const rect = canvas.getBoundingClientRect();
      const vb = boxRef.current;
      if (!vb || rect.width < 1 || rect.height < 1) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const scale = Math.min(rect.width / vb.width, rect.height / vb.height);
      const ox = (rect.width - vb.width * scale) / 2;
      const oy = (rect.height - vb.height * scale) / 2;
      // شاشة = (عالم - min) * scale * zoom + o — تمركز صحيح حتى عندما min ≠ 0
      // (سابقًا كان يفترض min≈0 فينزاح المخطط خارج الكادر)
      const a = dpr * scale * zoom;
      const e = dpr * (ox - vb.minX * scale * zoom);
      const f = dpr * (oy - vb.minY * scale * zoom);
      ctx.setTransform(a, 0, 0, a, e, f);
      ctx.fillStyle = '#020617';
      // تعبئة كامل منطقة الرؤية بالخلفية (بالوحدات العالمية عبر معكوس التحويل)
      ctx.fillRect((0 - e) / a, (0 - f) / a, canvas.width / a, canvas.height / a);
      walk(parsed.entities);
    };
    fitToSize();
    const ro = new ResizeObserver(fitToSize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [dxfText, parsed, parseError, layerVisibility, zoom]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}