// Presentational helpers extracted verbatim from DrawingViewerPage (no logic change).
import React from 'react';
import { Crosshair } from 'lucide-react';

const SVG_NS = 'http://www.w3.org/2000/svg';

export const BackgroundGrid = () => (
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

export const CoordDisplay = ({ svgX, svgY, visible }) => {
  if (!visible) return null;
  return (
    <span className="flex items-center gap-1 shrink-0 text-slate-400 font-mono text-[10px]" dir="ltr">
      <Crosshair className="w-3 h-3" />
      {Math.round(svgX)}, {Math.round(svgY)}
    </span>
  );
};

export const formatFileSize = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const formatDistance = (dist) => {
  const num = dist >= 100 ? Math.round(dist) : dist >= 10 ? +dist.toFixed(1) : +dist.toFixed(2);
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

// Single duration formatter for BOQ pages (was duplicated/inconsistent:
// viewer showed raw "222.9 ث" while the list showed "3.7 د").
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `${Number(seconds).toFixed(1)} ث`;
  return `${(seconds / 60).toFixed(1)} د`;
};

// Thousand-separated counts for large element numbers (118k reads as 117,964).
export const formatCount = (n) => {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
};
