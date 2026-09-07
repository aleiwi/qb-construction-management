/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages (project site: aleiwi.github.io/qb-construction-management/) needs base path.
// Docker/Caddy and local dev use root "/". Toggle via VITE_GH_PAGES=true at build time.
const isGhPages = process.env.VITE_GH_PAGES === 'true';

export default defineConfig({
  base: isGhPages ? '/qb-construction-management/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core + router — always needed, keep stable across navigations
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Charts only used on /reports — defer until then
          'charts-vendor': ['recharts'],
          // Animation used across late-loaded pages
          'motion-vendor': ['framer-motion'],
          // PDF export only triggered by the completion-percentage page export button
          'pdf-vendor': ['jspdf', 'html2canvas'],
          // Icons used pervasively
          'icons-vendor': ['lucide-react'],
        },
      },
    },
  },
});