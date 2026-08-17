import React, { useEffect, useRef } from 'react';
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
          if (!ent.position) break;
          const [x, y] = t(ent.position.x, ent.position.y);
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
  let minX = xs[0], maxX = xs[0], minY = ys[0], maxY = ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] < minX) minX = xs[i];
    if (xs[i] > maxX) maxX = xs[i];
    if (ys[i] < minY) minY = ys[i];
    if (ys[i] > maxY) maxY = ys[i];
  }
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

export default function DxfCanvas({ dxfText, viewBox, layerVisibility = null }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(viewBox);
  boxRef.current = viewBox;

  useEffect(() => {
    if (!canvasRef.current || !dxfText) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let parsed;
    try {
      parsed = new DxfParser().parseSync(dxfText);
    } catch (e) {
      return;
    }
    if (!parsed || !parsed.entities) return;

    const layerColorMap = {};
    if (parsed.tables?.layer?.layers) {
      for (const [name, l] of Object.entries(parsed.tables.layer.layers)) {
        layerColorMap[name] = l.colorIndex ?? 7;
      }
    }
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
            if (!ent.position) break;
            const [tx1, ty1] = tx(ent.position.x, ent.position.y);
            ctx.fillStyle = color;
            ctx.font = `${TEXT_HEIGHT}px monospace`;
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
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
      ctx.fillStyle = '#020617';
      ctx.fillRect(
        -ox / scale, -oy / scale,
        rect.width / scale, rect.height / scale
      );
      walk(parsed.entities);
    };
    fitToSize();
    const ro = new ResizeObserver(fitToSize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [dxfText, layerVisibility]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}