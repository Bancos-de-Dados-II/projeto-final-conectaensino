import {
  BookOpen,
  Building2,
  CalendarClock,
  GraduationCap,
  Search,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { globalSearch } from "../../services/dashboard.service";
import type { GlobalSearchResult } from "../../types/dashboard";

function GlobalSearch() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = window.setTimeout(() => {
      void globalSearch(query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 350);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  function iconFor(type: GlobalSearchResult["type"]) {
    switch (type) {
      case "monitor":
        return GraduationCap;
      case "subject":
        return BookOpen;
      case "institution":
        return Building2;
      case "session":
        return CalendarClock;
      default:
        return UserRound;
    }
  }

  return (
    <>
      <button
        className="header__search global-search-trigger"
        type="button"
        onClick={() => {
          setOpen(true);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Search size={18} />
        <span>Pesquisar aluno, monitor ou disciplina...</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open && (
        <div className="global-search-backdrop">
          <section className="global-search-modal">
            <header>
              <Search size={20} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                placeholder="Digite pelo menos 2 caracteres..."
                onChange={(event) => setQuery(event.target.value)}
              />

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </header>

            <div className="global-search-results">
              {loading && (
                <div className="global-search-state">
                  <span className="route-loader__spinner" />
                  <p>Pesquisando...</p>
                </div>
              )}

              {!loading && query.trim().length < 2 && (
                <div className="global-search-state">
                  <Search size={30} />
                  <strong>Busca global</strong>
                  <p>
                    Encontre alunos, monitores, disciplinas, instituições e
                    sessões.
                  </p>
                </div>
              )}

              {!loading &&
                query.trim().length >= 2 &&
                results.length === 0 && (
                  <div className="global-search-state">
                    <Search size={30} />
                    <strong>Nenhum resultado</strong>
                    <p>Tente pesquisar utilizando outro termo.</p>
                  </div>
                )}

              {!loading &&
                results.map((result) => {
                  const Icon = iconFor(result.type);

                  return (
                    <button
                      className="global-search-result"
                      type="button"
                      key={result.id}
                      onClick={() => {
                        navigate(result.route);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span>
                        <Icon size={18} />
                      </span>

                      <div>
                        <strong>{result.title}</strong>
                        <small>
                          {result.subtitle || result.type}
                        </small>
                      </div>
                    </button>
                  );
                })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default GlobalSearch;
