import { useCallback, useEffect, useState } from "react";
import {
  Award,
  CalendarClock,
  GraduationCap,
  RefreshCw,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardCharts from "../components/dashboard/DashboardCharts";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import ReportExport from "../components/reports/ReportExport";
import StatCard from "../components/StatCard";
import { useAuth } from "../hooks/useAuth";
import { getDashboardData } from "../services/dashboard.service";
import type {
  DashboardActivity,
  DashboardData,
} from "../types/dashboard";

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

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
          <span className="dashboard__eyebrow">Visão inteligente</span>
          <h1>Olá, {displayName} 👋</h1>
          <p>
            Acompanhe indicadores, tendências e atividades da plataforma.
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

          <ReportExport data={data} />

          <Link className="primary-button" to="/mapa">
            Encontrar monitores
          </Link>
        </div>
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error">
          {errorMessage}
        </div>
      )}

      <section className="stats-grid stats-grid--five">
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

        <StatCard
          title="Sessões"
          value={data.stats.sessions}
          variation="Total"
          description="Sessões registradas"
          icon={CalendarClock}
          tone="green"
        />

        <StatCard
          title="Certificados"
          value={data.stats.certificates}
          variation="Total"
          description="Certificados emitidos"
          icon={Award}
          tone="orange"
        />

        <StatCard
          title="Avaliação média"
          value={data.stats.averageRating.toFixed(1)}
          variation="de 5"
          description="Média das avaliações"
          icon={Star}
          tone="orange"
        />
      </section>

      <DashboardCharts
        sessionsByMonth={data.sessionsByMonth}
        subjectsRanking={data.subjectsRanking}
        ratingsDistribution={data.ratingsDistribution}
      />

      <section className="dashboard-activity-grid">
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
      </section>
    </div>
  );
}

export default Dashboard;
