/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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