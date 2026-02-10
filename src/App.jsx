import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import AlumnosPage from './pages/Alumnos/AlumnosPage';
import GruposPage from './pages/Grupos/GruposPage';
import AsistenciaPage from './pages/Asistencia/AsistenciaPage';
import ReportesPage from './pages/Reportes/ReportesPage';
import FinanzasPage from './pages/Finanzas/FinanzasPage';
import LoginPage from './pages/Login/LoginPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="alumnos" element={<AlumnosPage />} />
            <Route path="grupos" element={<GruposPage />} />
            <Route path="asistencia" element={<AsistenciaPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="finanzas" element={<FinanzasPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
