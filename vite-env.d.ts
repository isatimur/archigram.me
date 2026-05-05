/// <reference types="vite/client" />

interface ImportMetaEnv {
  // AI
  readonly VITE_GEMINI_API_KEY: string;

  // Firebase auth
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;

  // Supabase (community gallery)
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_KEY?: string;

  // RAG
  readonly VITE_RAG_URL?: string;
  readonly VITE_RAG_ENABLED?: string;

  // Observability
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENABLED?: string;

  // Analytics
  readonly VITE_PLAUSIBLE_DOMAIN?: string;

  // Dev
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
