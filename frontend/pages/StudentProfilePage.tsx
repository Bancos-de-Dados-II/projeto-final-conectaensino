import {
  Accessibility,
  Building2,
  Mail,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getLinkedStudentProfile,
  type LinkedStudentProfile,
} from "../services/student-profile.service";

export default function StudentProfilePage() {
  const { id = "" } = useParams();
  const [student, setStudent] = useState<LinkedStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void getLinkedStudentProfile(id)
      .then(setStudent)
      .catch(() =>
        setError(
          "Não foi possível localizar este aluno ou confirmar o vínculo.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="experience-loading experience-loading--page">
        <span className="route-loader__spinner" />
        Carregando perfil...
      </div>
    );
  }

  if (!student) {
    return (
      <section className="experience-page">
        <div className="experience-empty panel">
          <UserRound size={36} />
          <strong>Aluno não encontrado</strong>
          <p>{error}</p>
          <Link className="primary-button" to="/dashboard">
            Voltar ao dashboard
          </Link>
        </div>
      </section>
    );
  }

  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <section className="experience-page">
      <article className="monitor-hero panel">
        <div className="monitor-avatar">
          {student.avatar ? (
            <img src={student.avatar} alt={`Foto de ${student.name}`} />
          ) : (
            initials
          )}
        </div>

        <div className="monitor-hero__content">
          <span className="page-kicker">Perfil do aluno</span>
          <h1>{student.name}</h1>
          <p>
            Aluno vinculado às suas monitorias no Conecta Ensino.
          </p>
          <div className="monitor-meta">
            <span>
              <Building2 size={15} />
              {student.institutionName}
            </span>
            {student.email && (
              <span>
                <Mail size={15} />
                {student.email}
              </span>
            )}
          </div>
        </div>

      </article>

      <section className="monitor-stat-grid">
        <div className="panel">
          <Star size={20} />
          <strong>{student.specialty}</strong>
          <small>Especialidade</small>
        </div>
        <div className="panel">
          <Accessibility size={20} />
          <strong>{student.accessibilityNeeds}</strong>
          <small>Necessidades de acessibilidade</small>
        </div>
        <div className="panel">
          <Building2 size={20} />
          <strong>{student.institutionName}</strong>
          <small>Instituição</small>
        </div>
      </section>
    </section>
  );
}
