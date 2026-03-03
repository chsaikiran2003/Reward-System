import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import AdAnalytics from './pages/AdAnalytics'
import Rewards from './pages/Rewards'
import GameAnalytics from './pages/GameAnalytics'
import GameSettingsPage from './pages/GameSettingsPage'
import Users from './pages/Users'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="campaigns" element={<ProtectedRoute adminOnly><Campaigns /></ProtectedRoute>} />
              <Route path="ad-analytics" element={<AdAnalytics />} />
              <Route path="rewards" element={<ProtectedRoute adminOnly><Rewards /></ProtectedRoute>} />
              <Route path="game-analytics" element={<GameAnalytics />} />
              <Route path="game-settings" element={<ProtectedRoute adminOnly><GameSettingsPage /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
