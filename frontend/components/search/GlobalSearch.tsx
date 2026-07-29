import { GraduationCap, MapPin, Search, UserRound, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { getMonitors } from "../../services/experience.service";
import {
  searchCities,
  type CitySearchResult,
} from "../../services/geocoding.service";
import { getEligibleStudents } from "../../services/task.service";
import { getApplicationRole } from "../../utils/auth-role";

type DirectoryResult = {
  id: string;
  name: string;
  subtitle: string;
  type: "monitor" | "student";
};

function GlobalSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = getApplicationRole(user);
  const mode =
    role === "director"
      ? "monitor"
      : role === "monitor"
        ? "student"
        : "city";
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CitySearchResult[]>([]);
  const [directoryResults, setDirectoryResults] = useState<DirectoryResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const searchLabel =
    mode === "monitor"
      ? "Pesquisar monitor..."
      : mode === "student"
        ? "Pesquisar aluno..."
        : "Pesquisar cidade...";
  const entityLabel = mode === "monitor" ? "monitor" : "aluno";

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setErrorMessage("");

    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (normalizedQuery.length < 2) {
      setCities([]);
      setDirectoryResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = window.setTimeout(() => {
      if (mode === "city") {
        void searchCities(query)
          .then(setCities)
          .catch(() => {
            setCities([]);
            setErrorMessage("Não foi possível localizar a cidade agora.");
          })
          .finally(() => setLoading(false));
        return;
      }

      if (mode === "monitor") {
        void getMonitors()
          .then((items) => {
            const normalized: DirectoryResult[] = items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  subtitle:
                    [item.institution, item.email].filter(Boolean).join(" • ")
                    || "Monitor cadastrado",
                  type: "monitor" as const,
                }));
            setDirectoryResults(
              normalized.filter((item) =>
                `${item.name} ${item.subtitle}`
                  .toLocaleLowerCase("pt-BR")
                  .includes(normalizedQuery),
              ),
            );
          })
          .catch(() => {
            setDirectoryResults([]);
            setErrorMessage("Não foi possível pesquisar monitores agora.");
          })
          .finally(() => setLoading(false));
        return;
      }

      void getEligibleStudents()
        .then((items) => {
          const normalized: DirectoryResult[] = items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  subtitle: item.email || "Aluno vinculado às suas sessões",
                  type: "student" as const,
                }));
          setDirectoryResults(
            normalized.filter((item) =>
              `${item.name} ${item.subtitle}`
                .toLocaleLowerCase("pt-BR")
                .includes(normalizedQuery),
            ),
          );
        })
        .catch(() => {
          setDirectoryResults([]);
          setErrorMessage("Não foi possível pesquisar alunos agora.");
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [entityLabel, mode, query]);

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setCities([]);
    setDirectoryResults([]);
    setErrorMessage("");
  }

  function goToCity(city: CitySearchResult) {
    navigate("/mapa", {
      state: {
        mapLocation: {
          latitude: city.latitude,
          longitude: city.longitude,
          label: city.name,
        },
      },
    });
    closeSearch();
  }

  function selectDirectoryResult(result: DirectoryResult) {
    if (result.type === "monitor") {
      navigate(`/monitores/${result.id}`);
    }
    closeSearch();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) return;

    if (mode !== "city") {
      const firstResult = directoryResults[0];
      if (firstResult) selectDirectoryResult(firstResult);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const city = cities[0] ?? (await searchCities(query))[0];
      if (!city) {
        setErrorMessage("Cidade não encontrada. Tente incluir o estado.");
        return;
      }
      goToCity(city);
    } catch {
      setErrorMessage("Não foi possível localizar a cidade agora.");
    } finally {
      setLoading(false);
    }
  }

  const EmptyIcon =
    mode === "monitor"
      ? GraduationCap
      : mode === "student"
        ? UserRound
        : MapPin;

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
        {mode === "city" ? <MapPin size={18} /> : <Search size={18} />}
        <span>{searchLabel}</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open &&
        createPortal(
          <div className="global-search-backdrop">
            <section className="global-search-modal">
              <form onSubmit={handleSubmit}>
                <header>
                  <Search size={20} />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    placeholder={`Digite ${mode === "city" ? "uma cidade" : `o nome do ${entityLabel}`}...`}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Fechar"
                    onClick={closeSearch}
                  >
                    <X size={20} />
                  </button>
                </header>
              </form>

              <div className="global-search-results">
                {loading && (
                  <div className="global-search-state">
                    <span className="route-loader__spinner" />
                    <p>Pesquisando {mode === "city" ? "cidade" : `${entityLabel}s`}...</p>
                  </div>
                )}

                {!loading && errorMessage && (
                  <div className="global-search-state">
                    <EmptyIcon size={30} />
                    <strong>Pesquisa indisponível</strong>
                    <p>{errorMessage}</p>
                  </div>
                )}

                {!loading && !errorMessage && query.trim().length < 2 && (
                  <div className="global-search-state">
                    <EmptyIcon size={30} />
                    <strong>{searchLabel.replace("...", "")}</strong>
                    <p>
                      {mode === "monitor"
                        ? "Digite o nome do monitor."
                        : mode === "student"
                          ? "São pesquisados apenas alunos vinculados às suas sessões."
                          : "Informe uma cidade brasileira para centralizar o mapa."}
                    </p>
                  </div>
                )}

                {!loading
                  && !errorMessage
                  && mode === "city"
                  && cities.map((city) => (
                    <button
                      className="global-search-result"
                      type="button"
                      key={city.id}
                      onClick={() => goToCity(city)}
                    >
                      <span><MapPin size={18} /></span>
                      <div>
                        <strong>{city.name}</strong>
                        <small>Centralizar mapa nesta cidade</small>
                      </div>
                    </button>
                  ))}

                {!loading
                  && !errorMessage
                  && mode !== "city"
                  && query.trim().length >= 2
                  && directoryResults.length === 0 && (
                    <div className="global-search-state">
                      <EmptyIcon size={30} />
                      <strong>Nenhum {entityLabel} encontrado</strong>
                      <p>Verifique o nome informado e tente novamente.</p>
                    </div>
                  )}

                {!loading
                  && !errorMessage
                  && directoryResults.map((result) => {
                    const Icon =
                      result.type === "monitor" ? GraduationCap : UserRound;
                    return (
                      <button
                        className="global-search-result"
                        type="button"
                        key={result.id}
                        onClick={() => selectDirectoryResult(result)}
                      >
                        <span><Icon size={18} /></span>
                        <div>
                          <strong>{result.name}</strong>
                          <small>{result.subtitle}</small>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

export default GlobalSearch;
