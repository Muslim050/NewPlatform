import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import { queryClient } from '@/lib/queryClient'
import { setUnauthorizedHandler } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { DataProvider } from '@/context/DataContext.jsx'
import { ToastProvider } from '@/components/ui/Toast.jsx'
import { ConfirmProvider } from '@/components/ui/Confirm.jsx'

// Сервер ответил 401/403 — сессия недействительна: чистим её и кэш,
// дальше роутер сам уводит на /login.
setUnauthorizedHandler(() => {
  useAuthStore.getState().clearSession()
  queryClient.clear()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DataProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </DataProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
