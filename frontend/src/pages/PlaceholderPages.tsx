import { Award, BookOpen, CalendarCheck, GraduationCap, MapPinned, School, UsersRound } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export const MapPage = () => <PagePlaceholder title="Mapa" description="Visualização geográfica de alunos, monitores e instituições." icon={MapPinned} />;
export const MonitorsPage = () => <PagePlaceholder title="Monitores" description="Consulte e gerencie os perfis de monitores." icon={GraduationCap} />;
export const StudentsPage = () => <PagePlaceholder title="Alunos" description="Consulte os estudantes cadastrados na plataforma." icon={UsersRound} />;
export const InstitutionsPage = () => <PagePlaceholder title="Instituições" description="Visualize as instituições de ensino cadastradas." icon={School} />;
export const DisciplinesPage = () => <PagePlaceholder title="Disciplinas" description="Gerencie disciplinas e vínculos com usuários." icon={BookOpen} />;
export const SessionsPage = () => <PagePlaceholder title="Sessões" description="Acompanhe as solicitações e o status das aulas." icon={CalendarCheck} />;
export const CertificatesPage = () => <PagePlaceholder title="Certificados" description="Gere e faça download dos certificados em PDF." icon={Award} />;
