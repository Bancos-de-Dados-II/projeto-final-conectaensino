import { Compass, Home } from "lucide-react";
import { Link } from "react-router-dom";
export default function NotFoundPage(){return <main className="not-found-page"><div><Compass size={55}/><span>Erro 404</span><h1>Página não encontrada</h1><p>O endereço informado não existe ou foi removido.</p><Link className="primary-button" to="/dashboard"><Home size={17}/>Voltar ao dashboard</Link></div></main>}
