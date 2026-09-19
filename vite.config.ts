import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    allowedHosts: true,
  },
  build: {
    target: 'esnext',
    reportCompressedSize: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-pixi': ['pixi.js'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-query': ['@tanstack/react-query', 'axios'],
        },
      },
    },
  },
});
