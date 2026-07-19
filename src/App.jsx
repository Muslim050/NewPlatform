import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext.jsx'
import { AppShell } from '@/components/layout/AppShell.jsx'
import Login from '@/pages/Login.jsx'
import Dashboard from '@/pages/Dashboard.jsx'
import Campaigns from '@/pages/Campaigns.jsx'
import Advertisers from '@/pages/Advertisers.jsx'
import Channels from '@/pages/Channels.jsx'
import Reports from '@/pages/Reports.jsx'
import NotFound from '@/pages/NotFound.jsx'

function Protected({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/app" replace /> : <Login />}
      />

      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route
          path="advertisers"
          element={
            <Protected roles={['admin']}>
              <Advertisers />
            </Protected>
          }
        />
        <Route path="channels" element={<Channels />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route
        path="/"
        element={<Navigate to={user ? '/app' : '/login'} replace />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
