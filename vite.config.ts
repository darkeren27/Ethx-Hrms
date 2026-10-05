import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 7080,
    host: true,
    proxy: {
      '/api': {
        target: 'http://45.195.159.86:8280',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
