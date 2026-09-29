import type { VercelConfig } from '@vercel/config/v1'

// Бэкенд своей среды. У каждого проекта Vercel — свой адрес в
// Settings → Environment Variables:
//   setantadev      → https://setantatest.pythonanywhere.com
//   setanta-preprod → https://setantastaging.pythonanywhere.com
//   setanta-prod    → https://setanta.pythonanywhere.com
// Без переменной сборка падает: молча уйти на чужой бэкенд хуже.
const API_TARGET = process.env.API_PROXY_TARGET?.replace(/\/+$/, '')
if (!API_TARGET) {
  throw new Error('API_PROXY_TARGET не задан в переменных окружения проекта')
}

export const config: VercelConfig = {
  rewrites: [
    // Бэкенд не отдаёт CORS-заголовки, поэтому /api ходит через свой origin.
    { source: '/api/:path*', destination: `${API_TARGET}/api/:path*` },
    { source: '/(.*)', destination: '/index.html' },
  ],
}
