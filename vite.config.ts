import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [tailwindcss(), react()],
    define: {
      // RAG backend (ragClient.ts uses process.env so it also works in Vercel functions)
      'process.env.VITE_RAG_URL': JSON.stringify(env.VITE_RAG_URL || ''),
      'process.env.VITE_RAG_ENABLED': JSON.stringify(env.VITE_RAG_ENABLED || ''),

      // Gemini (used by geminiService.ts via process.env.API_KEY)
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''
      ),

      // Supabase — lib/supabase/browser.ts falls back to NEXT_PUBLIC_* names
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_KEY || ''),
      'process.env.NEXT_PUBLIC_APP_URL': JSON.stringify(env.VITE_APP_URL || ''),

      // Firebase — lib/firebase/client.ts falls back to NEXT_PUBLIC_* names
      'process.env.NEXT_PUBLIC_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
      'process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': JSON.stringify(
        env.VITE_FIREBASE_AUTH_DOMAIN || ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL': JSON.stringify(
        env.VITE_FIREBASE_DATABASE_URL || ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID': JSON.stringify(
        env.VITE_FIREBASE_PROJECT_ID || ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': JSON.stringify(
        env.VITE_FIREBASE_STORAGE_BUCKET || ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
        env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['dayjs'],
    },
  };
});
