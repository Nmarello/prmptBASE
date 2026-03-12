import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LearningModeProvider } from './contexts/LearningModeContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Admin from './pages/Admin'
import Settings from './pages/Settings'
import Tos from './pages/Tos'
import Privacy from './pages/Privacy'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ThemeProvider>
      <LearningModeProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/tos" element={<Tos />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Routes>
      </LearningModeProvider>
      </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
