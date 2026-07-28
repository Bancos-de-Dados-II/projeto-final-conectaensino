import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import {
  CertificatesPage,
  DisciplinesPage,
  InstitutionsPage,
  MapPage,
  MonitorsPage,
  SessionsPage,
  StudentsPage,
} from '../pages/PlaceholderPages';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="mapa" element={<MapPage />} />
          <Route path="monitores" element={<MonitorsPage />} />
          <Route path="alunos" element={<StudentsPage />} />
          <Route path="instituicoes" element={<InstitutionsPage />} />
          <Route path="disciplinas" element={<DisciplinesPage />} />
          <Route path="sessoes" element={<SessionsPage />} />
          <Route path="certificados" element={<CertificatesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
