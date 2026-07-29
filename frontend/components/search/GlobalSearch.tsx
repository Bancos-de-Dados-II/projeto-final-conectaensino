import { MapPin, Search, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  searchCities,
  type CitySearchResult,
} from "../../services/geocoding.service";

function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

    setErrorMessage("");

    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = window.setTimeout(() => {
      void searchCities(query)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 400);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [query]);

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
    setOpen(false);
    setQuery("");
    setSuggestions([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (query.trim().length < 2) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const city = suggestions[0] ?? (await searchCities(query))[0];

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
        <MapPin size={18} />
        <span>Pesquisar cidade...</span>
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
                  placeholder="Digite uma cidade e pressione Enter..."
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
            </form>

            <div className="global-search-results">
              {loading && (
                <div className="global-search-state">
                  <span className="route-loader__spinner" />
                  <p>Localizando cidade...</p>
                </div>
              )}

              {!loading && errorMessage && (
                <div className="global-search-state">
                  <MapPin size={30} />
                  <strong>Cidade não localizada</strong>
                  <p>{errorMessage}</p>
                </div>
              )}

              {!loading && !errorMessage && query.trim().length < 2 && (
                <div className="global-search-state">
                  <MapPin size={30} />
                  <strong>Buscar cidade</strong>
                  <p>
                    Informe uma cidade brasileira para centralizar o mapa e
                    buscar escolas e monitores próximos.
                  </p>
                </div>
              )}

              {!loading &&
                !errorMessage &&
                suggestions.map((city) => (
                  <button
                    className="global-search-result"
                    type="button"
                    key={city.id}
                    onClick={() => goToCity(city)}
                  >
                    <span>
                      <MapPin size={18} />
                    </span>

                    <div>
                      <strong>{city.name}</strong>
                      <small>Centralizar mapa nesta cidade</small>
                    </div>
                  </button>
                ))}
            </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

export default GlobalSearch;
