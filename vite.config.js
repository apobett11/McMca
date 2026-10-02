import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { describeSupabaseKey, pickBrowserSupabaseKey, pickSupabaseUrl } from './src/lib/supabaseKeys.js';

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), 'SUPABASE_'),
    ...loadEnv(mode, process.cwd(), 'VITE_')
  };
  const supabaseUrl = pickSupabaseUrl(env);
  const supabaseAnonKey = pickBrowserSupabaseKey(env);
  console.log(`[mcmca] Supabase URL host: ${(() => { try { return new URL(supabaseUrl).host; } catch { return '(missing)'; } })()}; browser key: ${describeSupabaseKey(supabaseAnonKey).kind}`);

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
