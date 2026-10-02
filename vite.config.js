import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['tesseract.js']
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true
  }
});

