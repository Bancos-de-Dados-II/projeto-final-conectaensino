import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  variation?: string;
  icon: LucideIcon;
  tone?: "blue" | "purple" | "green" | "orange";
}

function StatCard({
  title,
  value,
  description,
  variation,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}>
        <Icon size={23} />
      </div>

      <div className="stat-card__content">
        <span className="stat-card__title">{title}</span>

        <div className="stat-card__value-row">
          <strong>{value}</strong>

          {variation && (
            <span className="stat-card__variation">{variation}</span>
          )}
        </div>

        <p>{description}</p>
      </div>
    </article>
  );
}

export default StatCard;
