import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import AlumnosPage from './pages/Alumnos/AlumnosPage';
import GruposPage from './pages/Grupos/GruposPage';
import AsistenciaPage from './pages/Asistencia/AsistenciaPage';
import ReportesPage from './pages/Reportes/ReportesPage';
import FinanzasPage from './pages/Finanzas/FinanzasPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="alumnos" element={<AlumnosPage />} />
          <Route path="grupos" element={<GruposPage />} />
          <Route path="asistencia" element={<AsistenciaPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="finanzas" element={<FinanzasPage />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
