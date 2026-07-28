import { useEffect, useState } from "react";
import { Award, BookOpen, CalendarPlus, GraduationCap, MapPin, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import FavoriteButton from "../components/favorites/FavoriteButton";
import { getMonitor } from "../services/experience.service";
import type { PublicMonitor } from "../types/experience";

export default function MonitorProfilePage(){const {id=''}=useParams();const [monitor,setMonitor]=useState<PublicMonitor|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
useEffect(()=>{void getMonitor(id).then(setMonitor).catch(()=>setError('Não foi possível localizar este monitor.')).finally(()=>setLoading(false));},[id]);
if(loading)return <div className="experience-loading experience-loading--page"><span className="route-loader__spinner"/>Carregando perfil...</div>;
if(!monitor)return <section className="experience-page"><div className="experience-empty panel"><GraduationCap size={36}/><strong>Monitor não encontrado</strong><p>{error}</p><Link className="primary-button" to="/monitores">Voltar aos monitores</Link></div></section>;
const initials=monitor.name.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase();
return <section className="experience-page"><article className="monitor-hero panel"><div className="monitor-avatar">{monitor.avatar?<img src={monitor.avatar} alt={monitor.name}/>:initials}</div><div className="monitor-hero__content"><span className="page-kicker">Perfil público</span><h1>{monitor.name}</h1><p>{monitor.bio}</p><div className="monitor-meta">{monitor.institution&&<span><GraduationCap size={15}/>{monitor.institution}</span>}{monitor.city&&<span><MapPin size={15}/>{monitor.city}</span>}<span><Star size={15}/>{monitor.rating.toFixed(1)} de avaliação</span></div></div><div className="monitor-hero__actions"><FavoriteButton monitorId={monitor.id}/><Link className="primary-button" to={`/sessoes?monitor=${monitor.id}`}><CalendarPlus size={17}/>Solicitar monitoria</Link></div></article>
<section className="monitor-stat-grid"><div className="panel"><Star size={20}/><strong>{monitor.rating.toFixed(1)}</strong><small>Avaliação média</small></div><div className="panel"><CalendarPlus size={20}/><strong>{monitor.sessions}</strong><small>Monitorias realizadas</small></div><div className="panel"><Award size={20}/><strong>{monitor.certificates}</strong><small>Certificados</small></div></section>
<article className="panel monitor-subjects"><div className="panel__header"><div><span className="panel__eyebrow">Especialidades</span><h2>Disciplinas atendidas</h2></div></div><div>{monitor.subjects.length?monitor.subjects.map(subject=><span key={subject}><BookOpen size={15}/>{subject}</span>):<p>Nenhuma disciplina informada.</p>}</div></article></section>}
