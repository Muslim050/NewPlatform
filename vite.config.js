import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Куда проксировать /api в разработке. Тот же адрес прописан в vercel.json
// для продакшена.
const API_TARGET = 'https://setanta.pythonanywhere.com'

// Standalone-платформа. Порт нестандартный, чтобы не конфликтовать
// с основным проектом (тот обычно занимает 5173).
export default defineConfig({
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
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
