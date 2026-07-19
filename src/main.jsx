import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from '@/context/AuthContext.jsx'
import { DataProvider } from '@/context/DataContext.jsx'
import { ToastProvider } from '@/components/ui/Toast.jsx'
import { ConfirmProvider } from '@/components/ui/Confirm.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
