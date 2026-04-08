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
import Gallery from './pages/Gallery'
import Compare from './pages/Compare'
import NotFound from './pages/NotFound'
import AuthCallback from './pages/AuthCallback'
import FeedbackWidget from './components/support/FeedbackWidget'
import SupportWidget from './components/support/SupportWidget'

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
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/tos" element={<Tos />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
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
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <Compare />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FeedbackWidget />
        <SupportWidget />
      </LearningModeProvider>
      </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
