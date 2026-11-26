import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the demo under /<repo>/ (set by the Pages workflow).
  base: process.env.VITE_BASE || '/',
  server: { port: 5180, proxy: { '/api': 'http://localhost:4100' } },
});
