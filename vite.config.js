import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

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
  },
})
