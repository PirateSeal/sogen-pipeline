import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [tailwindcss(), react()],
  server: { proxy: { '/api': 'http://localhost:3000', '/healthz': 'http://localhost:3000', '/metrics': 'http://localhost:3000', '/readyz': 'http://localhost:3000' } },
  build: { emptyOutDir: false, outDir: '../dist/web' },
});
