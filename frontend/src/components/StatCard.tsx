import { IconType } from 'react-icons';

type Props = { title: string; value: number | string; caption: string; icon: IconType };
export function StatCard({ title, value, caption, icon: Icon }: Props) {
  return <article className="stat-card"><div className="stat-icon"><Icon /></div><div><span>{title}</span><strong>{value}</strong><small>{caption}</small></div></article>;
}
