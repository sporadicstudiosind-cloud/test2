import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // No backend proxy — all data goes direct to GitHub API
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Allow GitHub API calls from dev server
  define: {
    'process.env': {},
  },
});
