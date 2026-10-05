/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRAPPE_URL: string;
  readonly VITE_DEFAULT_USER: string;
  readonly VITE_DEFAULT_PASSWORD: string;
  readonly VITE_USE_MOCK_FALLBACK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
