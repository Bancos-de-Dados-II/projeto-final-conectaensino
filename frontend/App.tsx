import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppErrorBoundary from "./components/system/AppErrorBoundary";
import { AppearanceProvider } from "./contexts/AppearanceContext";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const RegisterDirector = lazy(() => import("./pages/RegisterDirector"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MapPage = lazy(() => import("./pages/MapPage"));
const MonitorsPage = lazy(() => import("./pages/MonitorsPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const SessionsPage = lazy(() => import("./pages/SessionsPage"));
const SessionActivitiesPage = lazy(
  () => import("./pages/SessionActivitiesPage"),
);
const InstitutionsPage = lazy(() => import("./pages/InstitutionsPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const SessionHistoryPage = lazy(
  () => import("./pages/SessionHistoryPage"),
);
const MonitorProfilePage = lazy(
  () => import("./pages/MonitorProfilePage"),
);
const StudentProfilePage = lazy(
  () => import("./pages/StudentProfilePage"),
);
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const CreateTaskPage = lazy(() => import("./pages/CreateTask")); 
const DirectorsPage = lazy(() => import("./pages/DirectorsPage"));

const currentLayout = localStorage.getItem("theme");
if (!currentLayout) {
  localStorage.setItem("theme", "traditional");
  document.documentElement.setAttribute("data-layout", "traditional");
} else {
  document.documentElement.setAttribute("data-layout", currentLayout);
}

function Loader() {
  return (
    <div className="route-loader">
      <span className="route-loader__spinner" />
      <p>Carregando módulo...</p>
    </div>
  );
}

export default function App() {
  const maintenanceMode =
    import.meta.env.VITE_MAINTENANCE_MODE === "true";

  return (
    <AppErrorBoundary>
      <AppearanceProvider>
        <Suspense fallback={<Loader />}>
          {maintenanceMode ? (
            <MaintenancePage />
          ) : (
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/director" element={<RegisterDirector />} />

              {/* Rotas Protegidas (Requerem login) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/mapa"
                    element={
                      <ProtectedRoute deniedRoles={["director"]}>
                        <MapPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/monitores" element={<MonitorsPage />} />
                  <Route
                    path="/monitores/:id"
                    element={<MonitorProfilePage />}
                  />
                  <Route
                    path="/favoritos"
                    element={
                      <ProtectedRoute deniedRoles={["director", "student", "monitor"]}>
                        <FavoritesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mensagens"
                    element={
                      <ProtectedRoute deniedRoles={["director"]}>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/alunos" element={<StudentsPage />} />
                  <Route path="/diretores" element={<ProtectedRoute allowedRoles={["admin"]}><DirectorsPage /></ProtectedRoute>} />
                  <Route
                    path="/alunos/:id"
                    element={
                      <ProtectedRoute allowedRoles={["monitor"]}>
                        <StudentProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/sessoes" element={<SessionsPage />} />
                  <Route
                    path="/sessoes/atividades"
                    element={<SessionActivitiesPage />}
                  />
                  <Route
                    path="/agenda"
                    element={
                      <ProtectedRoute deniedRoles={["director"]}>
                        <CalendarPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/historico"
                    element={<SessionHistoryPage />}
                  />
                  <Route
                    path="/instituicoes"
                    element={
                      <ProtectedRoute deniedRoles={["director"]}>
                        <InstitutionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/disciplinas"
                    element={
                      <ProtectedRoute deniedRoles={["director"]}>
                        <SubjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/certificados"
                    element={<CertificatesPage />}
                  />
                  <Route path="/avaliacoes" element={<ReviewsPage />} />

                  {/* Rota de perfil específica para monitores */}
                  <Route 
                    path="/perfil" 
                    element={
                      <ProtectedRoute allowedRoles={["monitor"]}>
                        <MonitorProfilePage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Rota de perfil padrão para os demais papéis */}
                  <Route 
                    path="/perfil" 
                    element={
                      <ProtectedRoute deniedRoles={["monitor"]}>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />

                  <Route
                    path="/configuracoes"
                    element={<SettingsPage />}
                  />
                  <Route
                    path="/atividades/nova"
                    element={
                      <ProtectedRoute allowedRoles={["monitor"]}>
                        <CreateTaskPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          )}
        </Suspense>
      </AppearanceProvider>
    </AppErrorBoundary>
  );
}