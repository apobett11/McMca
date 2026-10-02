import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  return {
    plugins: [react()],
    define: {
      __MCMCA_SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __MCMCA_SUPABASE_ANON_KEY__: JSON.stringify(supabaseAnonKey)
    },
    optimizeDeps: {
      include: ['tesseract.js']
    },
    server: {
      port: Number(process.env.PORT) || 5173,
      strictPort: true
    }
  };
});
