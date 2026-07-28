import { Navigate, Route, Routes } from 'react-router-dom';
import { FiAward, FiBookOpen, FiMap, FiMonitor, FiUser, FiUsers } from 'react-icons/fi';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Placeholder } from './pages/Placeholder';
import MapPage from '../pages/MapPage';

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}><Route element={<MainLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/mapa" element={<MapPage />} />
      <Route path="/monitores" element={<Placeholder title="Monitores" description="Listagem e busca de monitores já possuem rota preparada." icon={FiMonitor} />} />
      <Route path="/alunos" element={<Placeholder title="Alunos" description="Área destinada aos perfis de estudantes." icon={FiUsers} />} />
      <Route path="/sessoes" element={<Placeholder title="Sessões" description="Solicitações e acompanhamento de sessões." icon={FiBookOpen} />} />
      <Route path="/certificados" element={<Placeholder title="Certificados" description="Emissão e download de certificados." icon={FiAward} />} />
      <Route path="/perfil" element={<Placeholder title="Perfil" description="Dados e preferências do usuário autenticado." icon={FiUser} />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
