import { Link } from "react-router-dom";
import { Search, Edit3, Smartphone } from "lucide-react";
import Header from "../components/Header"; // Importe seu Header existente

// Importe seus pins da pasta assets (ajuste o caminho relativo se necessário, ex: '../assets/pin-red.png')
import pinRed from "../assets/pin-red.png";
import pinBlue from "../assets/pin-blue.png";

export function LandingPage() {
  return (
    <div className="landing-page">
      {/* 1. HEADER PÚBLICO */}
      <Header onMenuClick={() => {}} />

      {/* 2. HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-logo-container">
            <img src="" alt="Conecta Ensino" className="landing-logo" />
            <p className="landing-subtitle">Rede de Monitoria Inclusiva</p>
          </div>

          <Link to="/login" className="primary-button landing-hero__cta">
            Entre ou cadastre-se
          </Link>
        </div>
      </section>

      {/* 3. EXPLANATION SECTION (Seção Laranja com Post-its) */}
      <section className="landing-info-section">
        <div className="landing-info-container">
          
          {/* Linha 1: Apresentação Geral */}
          <div className="landing-grid-row">
            <article className="postit-card">
              <img src={pinRed} alt="Pin Vermelho" className="postit-pin" />
              <h2>O que somos?</h2>
              <p>
                O ConectaEnsino é uma plataforma de impacto social dedicada à inclusão
                educacional, projetada para aproximar alunos com deficiência (PCD) de
                estudantes monitores voluntários.
              </p>
            </article>

            <article className="postit-card">
              <img src={pinBlue} alt="Pin Azul" className="postit-pin" />
              <h2>Segurança</h2>
              <p>
                Os monitores não fazem autocadastro; eles são selecionados e registrados
                exclusivamente pelos diretores de suas escolas, assegurando que cada voluntário
                seja um estudante verificado e plenamente apto para o apoio pedagógico.
              </p>
            </article>
          </div>

          {/* Linha 2: Para o Aluno vs Para o Monitor */}
          <div className="landing-columns">
            {/* Coluna Aluno */}
            <div className="landing-column">
              <h2 className="landing-column__title">Para o aluno:</h2>

              <article className="postit-card">
                <img src={pinBlue} alt="Pin Azul" className="postit-pin" />
                <h3>Como Funciona:</h3>
                <ol className="postit-list">
                  <li><strong>1.</strong> Crie sua conta aqui</li>
                  <li>
                    <Search size={16} /> <strong>2.</strong> Encontre: Use o mapa para ver monitores na sua região.
                  </li>
                  <li>
                    <Edit3 size={16} /> <strong>3.</strong> Agende: Escolha o melhor local (casa, escola ou biblioteca).
                  </li>
                  <li>
                    <Smartphone size={16} /> <strong>4.</strong> Aprenda: Tenha sua sessão de reforço com segurança.
                  </li>
                </ol>
              </article>

              <article className="postit-card">
                <img src={pinRed} alt="Pin Vermelho" className="postit-pin" />
                <h3>Vantagens</h3>
                <ul className="postit-bullet-list">
                  <li><strong>Apoio Personalizado:</strong> Reforço gratuito focado nas necessidades do aluno.</li>
                  <li><strong>Mapa de Acessos:</strong> Localização rápida de monitores na própria região.</li>
                  <li><strong>Segurança Total:</strong> Voluntários verificados por diretores escolares.</li>
                  <li><strong>Local Flexível:</strong> Atendimento em casa, na escola ou locais acessíveis.</li>
                </ul>
              </article>
            </div>

            {/* Coluna Monitor */}
            <div className="landing-column">
              <h2 className="landing-column__title">Para o monitor:</h2>

              <article className="postit-card">
                <img src={pinRed} alt="Pin Vermelho" className="postit-pin" />
                <h3>Como funciona:</h3>
                <ol className="postit-list">
                  <li><strong>1.</strong> Cadastre-se junto à coordenação de sua escola/instituto.</li>
                  <li><strong>2.</strong> Seu perfil aparece no mapa para alunos PCD da região.</li>
                  <li><strong>3.</strong> Realize as sessões de reforço em locais seguros e acessíveis.</li>
                  <li><strong>4.</strong> Receba seu comprovante de horas complementares em PDF.</li>
                </ol>
              </article>

              <article className="postit-card">
                <img src={pinBlue} alt="Pin Azul" className="postit-pin" />
                <h3>Vantagens</h3>
                <ul className="postit-bullet-list">
                  <li>Emissão automática de certificados em PDF para o currículo.</li>
                  <li>Experiência prática com inclusão e desenvolvimento comunitário.</li>
                  <li>Validação direta do perfil pelo diretor da própria escola.</li>
                  <li>Possibilidade de atuar em locais próximos e horários acessíveis.</li>
                </ul>
              </article>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

export default LandingPage;