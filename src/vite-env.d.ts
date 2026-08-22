/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** База API. Пусто — работает мок-транспорт из src/api/mock. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
