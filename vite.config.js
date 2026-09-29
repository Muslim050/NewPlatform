import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Standalone-платформа. Порт нестандартный, чтобы не конфликтовать
// с основным проектом (тот обычно занимает 5173).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      // fileURLToPath корректно декодирует пробелы в пути проекта.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5178,
    open: false,
    // На бэкенде не настроен CORS, поэтому в разработке ходим к нему через
    // собственный origin: браузер видит запрос как same-origin, а Vite
    // переправляет его на стенд. Убрать, когда сервер начнёт отдавать
    // Access-Control-Allow-Origin.
    proxy: {
      '/api': {
        // Куда проксировать /api в разработке. На Vercel ту же роль играет
        // rewrite из vercel.ts с адресом своей среды.
        target:
          loadEnv(mode, process.cwd(), '').API_PROXY_TARGET ||
          'https://setanta.pythonanywhere.com',
        changeOrigin: true,
      },
    },
  },
}))
