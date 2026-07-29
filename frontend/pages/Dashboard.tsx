import { useCallback, useEffect, useState } from "react";
import {
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  GraduationCap,
  ListTodo,
  RefreshCw,
  Star,
  UserRound,
  UsersRound,
  ArrowRight,
  ArrowLeft,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardCharts from "../components/dashboard/DashboardCharts";
import DirectorDashboard from "../components/dashboard/DirectorDashboard";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import ReportExport from "../components/reports/ReportExport";
import StatCard from "../components/StatCard";
import { useAuth } from "../hooks/useAuth";
import { getDashboardData } from "../services/dashboard.service";
import {
  getTasks,
  updateTaskStatus as persistTaskStatus,
} from "../services/task.service";
import type {
  DashboardActivity,
  DashboardData,
} from "../types/dashboard";
import type { TaskStatus } from "../types/task";
import { getApplicationRole } from "../utils/auth-role";

const activityIcons = {
  student: UserRound,
  monitor: GraduationCap,
  session: CalendarClock,
  certificate: Award,
  review: Star,
};

function formatActivityDate(value?: string): string {
  if (!value) {
    return "Agora";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

interface KanbanTask {
  id: string;
  title: string;
  subject: string;
  monitorName: string;
  studentName: string;
  status: "pending" | "in_progress" | "completed";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [tasks, setTasks] = useState<KanbanTask[]>([]);

  const userRole = getApplicationRole(user);
  const isDirector = userRole === "director";
  const isMonitor = userRole === "monitor"; 

  const displayName =
    typeof user?.user_metadata?.name === "string"
      ? user.user_metadata.name.split(" ")[0]
      : user?.email?.split("@")[0] || "Usuário";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setData(await getDashboardData());
    } catch {
      setErrorMessage(
        "Não foi possível carregar os indicadores do dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const loadAssignedTasks = useCallback(async (showError = true) => {
    if (isDirector) return;
    try {
      const items = await getTasks();
      setTasks(
        items.map((task) => ({
          id: task._id,
          title: task.title,
          subject: task.subject,
          monitorName: task.monitorName,
          studentName: task.studentName,
          status: task.status,
        })),
      );
    } catch {
      if (showError) {
        setErrorMessage("Não foi possível carregar as atividades atribuídas.");
      }
    }
  }, [isDirector]);

  useEffect(() => {
    void loadAssignedTasks();
    if (!isMonitor) return;

    const intervalId = window.setInterval(
      () => void loadAssignedTasks(false),
      5000,
    );
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadAssignedTasks(false);
      }
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [isMonitor, loadAssignedTasks]);

  const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus,
  ) => {
    try {
      await persistTaskStatus(taskId, newStatus);
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task,
        ),
      );
    } catch {
      setErrorMessage("Não foi possível atualizar o status da atividade.");
    }
  };

  if (isDirector) {
    return <DirectorDashboard />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="dashboard dashboard--analytics">
        <div className="dashboard-error">
          <strong>Dashboard indisponível</strong>
          <p>{errorMessage}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={17} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard dashboard--analytics">
      <section className="dashboard__heading">
        <div>
          <span className="dashboard__eyebrow">
            {isDirector ? "Visão inteligente" : isMonitor ? "Área do Monitor" : "Área do Aluno"}
          </span>
          <h1>Olá, {displayName} 👋</h1>
          <p>
            {isDirector
              ? "Acompanhe indicadores, tendências e atividades da plataforma."
              : isMonitor
              ? "Gerencie suas sessões de reforço e acompanhe as atividades dos alunos."
              : "Acompanhe suas sessões de reforço e suas atividades atribuídas."}
          </p>
        </div>

        <div className="dashboard-heading-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Atualizar dashboard"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={18} />
          </button>

          {isDirector && <ReportExport data={data} />}

          {/* Botão de encontrar monitores exclusivo para Alunos */}
          {!isDirector && !isMonitor && (
            <Link className="primary-button" to="/mapa">
              Encontrar monitores
            </Link>
          )}

          {/* Atalho rápido para monitores criarem atividades */}
          {isMonitor && (
            <Link className="primary-button" to="/atividades/nova">
              <PlusCircle size={16} style={{ marginRight: 6 }} />
              Nova Atividade
            </Link>
          )}
        </div>
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error">
          {errorMessage}
        </div>
      )}

      <section className={`stats-grid ${isDirector ? "stats-grid--five" : "stats-grid--three"}`}>
        {isDirector && (
          <>
            <StatCard
              title="Alunos cadastrados"
              value={data.stats.students}
              variation="Atual"
              description="Total na plataforma"
              icon={UsersRound}
              tone="blue"
            />

            <StatCard
              title="Monitores ativos"
              value={data.stats.monitors}
              variation="Atual"
              description="Total cadastrado"
              icon={GraduationCap}
              tone="purple"
            />
          </>
        )}

        <StatCard
          title="Sessões"
          value={data.stats.sessions}
          variation="Total"
          description={isDirector ? "Sessões registradas" : "Sessões realizadas"}
          icon={CalendarClock}
          tone="green"
        />

        {isDirector && (
          <StatCard
            title="Certificados"
            value={data.stats.certificates}
            variation="Total"
            description="Certificados emitidos"
            icon={Award}
            tone="orange"
          />
        )}

        <StatCard
          title="Avaliação média"
          value={data.stats.averageRating.toFixed(1)}
          variation="de 5"
          description="Média das avaliações"
          icon={Star}
          tone="orange"
        />
      </section>

      {isDirector && (
        <DashboardCharts
          sessionsByMonth={data.sessionsByMonth}
          subjectsRanking={data.subjectsRanking}
          ratingsDistribution={data.ratingsDistribution}
        />
      )}

      <section className="dashboard-activity-grid">
        {isDirector ? (
          <article className="panel dashboard-activity-panel">
            <div className="panel__header">
              <div>
                <span className="panel__eyebrow">Atualizações</span>
                <h2>Atividades recentes</h2>
              </div>
            </div>

            <div className="smart-activity-list">
              {data.activities.length === 0 && (
                <div className="smart-empty-state">
                  <CalendarClock size={30} />
                  <strong>Nenhuma atividade recente</strong>
                  <p>As novas movimentações aparecerão aqui.</p>
                </div>
              )}

              {data.activities.map((activity: DashboardActivity) => {
                const Icon = activityIcons[activity.type];

                return (
                  <div className="smart-activity-item" key={activity.id}>
                    <span
                      className={`smart-activity-icon smart-activity-icon--${activity.type}`}
                    >
                      <Icon size={18} />
                    </span>

                    <div>
                      <strong>{activity.title}</strong>
                      <p>{activity.description}</p>
                    </div>

                    <small>{formatActivityDate(activity.date)}</small>
                  </div>
                );
              })}
            </div>
          </article>
        ) : (
          /* Kanban compartilhado ou adaptado para Aluno/Monitor gerenciarem tarefas */
          <article className="panel dashboard-kanban-panel" style={{ width: "100%", gridColumn: "1 / -1" }}>
            <div className="panel__header">
              <div>
                <span className="panel__eyebrow">{isMonitor ? "Gestão" : "Tarefas"}</span>
                <h2>{isMonitor ? "Quadro de Atividades Atribuídas" : "Quadro de Atividades"}</h2>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginTop: "1rem" }}>
              
              {/* Coluna: Pendentes */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontWeight: "bold" }}>
                  <ListTodo size={18} color="#3b82f6" />
                  <span>Pendentes ({tasks.filter(t => t.status === "pending").length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: "120px" }}>
                  {tasks.filter(t => t.status === "pending").length === 0 ? (
                    <div style={{ color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", marginTop: "40px" }}>
                      Nenhuma tarefa pendente
                    </div>
                  ) : (
                    tasks.filter(t => t.status === "pending").map(task => (
                      <div key={task.id} style={{ background: "rgba(255, 255, 255, 0.05)", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #3b82f6" }}>
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>{task.title}</strong>
                        <small style={{ color: "#9ca3af", display: "block", marginBottom: "8px" }}>{task.subject} • {isMonitor ? task.studentName : task.monitorName}</small>
                        {!isMonitor && <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button 
                            type="button" 
                            onClick={() => void updateTaskStatus(task.id, "in_progress")}
                            style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
                          >
                            <span>Iniciar</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Coluna: Em Andamento */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontWeight: "bold" }}>
                  <Clock size={18} color="#eab308" />
                  <span>Em Andamento ({tasks.filter(t => t.status === "in_progress").length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: "120px" }}>
                  {tasks.filter(t => t.status === "in_progress").length === 0 ? (
                    <div style={{ color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", marginTop: "40px" }}>
                      Nenhuma tarefa em andamento
                    </div>
                  ) : (
                    tasks.filter(t => t.status === "in_progress").map(task => (
                      <div key={task.id} style={{ background: "rgba(255, 255, 255, 0.05)", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #eab308" }}>
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>{task.title}</strong>
                        <small style={{ color: "#9ca3af", display: "block", marginBottom: "8px" }}>{task.subject} • {isMonitor ? task.studentName : task.monitorName}</small>
                        {!isMonitor && <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <button 
                            type="button" 
                            onClick={() => void updateTaskStatus(task.id, "pending")}
                            style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
                          >
                            <ArrowLeft size={14} />
                            <span>Voltar</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => void updateTaskStatus(task.id, "completed")}
                            style={{ background: "transparent", border: "none", color: "#22c55e", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
                          >
                            <span>Concluir</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Coluna: Concluídas */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontWeight: "bold" }}>
                  <CheckCircle2 size={18} color="#22c55e" />
                  <span>Concluídas ({tasks.filter(t => t.status === "completed").length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: "120px" }}>
                  {tasks.filter(t => t.status === "completed").length === 0 ? (
                    <div style={{ color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", marginTop: "40px" }}>
                      Nenhuma tarefa concluída
                    </div>
                  ) : (
                    tasks.filter(t => t.status === "completed").map(task => (
                      <div key={task.id} style={{ background: "rgba(255, 255, 255, 0.05)", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #22c55e" }}>
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>{task.title}</strong>
                        <small style={{ color: "#9ca3af", display: "block", marginBottom: "8px" }}>{task.subject} • {isMonitor ? task.studentName : task.monitorName}</small>
                        {!isMonitor && <div style={{ display: "flex", justifyContent: "flex-start" }}>
                          <button 
                            type="button" 
                            onClick={() => void updateTaskStatus(task.id, "in_progress")}
                            style={{ background: "transparent", border: "none", color: "#eab308", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
                          >
                            <ArrowLeft size={14} />
                            <span>Reabrir</span>
                          </button>
                        </div>}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </article>
        )}

        {isDirector && (
          <article className="panel quick-links-panel">
            <div className="panel__header">
              <div>
                <span className="panel__eyebrow">Acesso rápido</span>
                <h2>Gerenciar plataforma</h2>
              </div>
            </div>

            <div className="quick-links-grid">
              <Link to="/alunos">
                <UsersRound size={21} />
                <span>
                  <strong>Alunos</strong>
                  <small>{data.stats.students} cadastrados</small>
                </span>
              </Link>

              <Link to="/monitores">
                <GraduationCap size={21} />
                <span>
                  <strong>Monitores</strong>
                  <small>{data.stats.monitors} cadastrados</small>
                </span>
              </Link>

              <Link to="/sessoes">
                <CalendarClock size={21} />
                <span>
                  <strong>Sessões</strong>
                  <small>{data.stats.sessions} registradas</small>
                </span>
              </Link>

              <Link to="/certificados">
                <Award size={21} />
                <span>
                  <strong>Certificados</strong>
                  <small>{data.stats.certificates} emitidos</small>
                </span>
              </Link>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
