import type { LucideIcon } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <section className="placeholder-page">
      <div className="placeholder-icon"><Icon size={34} /></div>
      <h1>{title}</h1>
      <p>{description}</p>
      <span>Esta área será conectada às rotas do backend nas próximas sprints.</span>
    </section>
  );
}
