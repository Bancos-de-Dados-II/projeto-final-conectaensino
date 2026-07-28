import { IconType } from 'react-icons';
type Props = { title: string; description: string; icon: IconType };
export function Placeholder({ title, description, icon: Icon }: Props) { return <div className="placeholder-page"><Icon/><span className="eyebrow">SPRINT 01</span><h2>{title}</h2><p>{description}</p></div>; }
