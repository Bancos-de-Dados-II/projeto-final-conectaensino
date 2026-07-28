import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Crosshair,
  GraduationCap,
  ListFilter,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import MapViewport from "../components/map/MapViewport";
import {
  createEntityMarkerIcon,
  userMarkerIcon,
} from "../components/map/MapMarkerIcon";
import {
  getNearbyMonitors,
  getNearbyStudents,
} from "../services/map.service";
import type {
  MapCoordinates,
  MapEntity,
  MapEntityType,
} from "../types/map";

const DEFAULT_LOCATION: MapCoordinates = {
  latitude: -6.8897,
  longitude: -38.5612,
};

function MapPage() {
  const [location, setLocation] = useState<MapCoordinates>(DEFAULT_LOCATION);
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [selectedType, setSelectedType] = useState<"all" | MapEntityType>(
    "all",
  );
  const [radiusKm, setRadiusKm] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLocating, setIsLocating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Tentando localizar você...",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const loadNearbyEntities = useCallback(
    async (coordinates: MapCoordinates) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const results = await Promise.allSettled([
          getNearbyMonitors({
            ...coordinates,
            radiusKm,
          }),
          getNearbyStudents({
            ...coordinates,
            radiusKm,
          }),
        ]);

        const monitors =
          results[0].status === "fulfilled" ? results[0].value : [];
        const students =
          results[1].status === "fulfilled" ? results[1].value : [];

        setEntities([...monitors, ...students]);

        if (results.every((result) => result.status === "rejected")) {
          throw new Error("Nenhum endpoint de localização respondeu.");
        }

        if (results.some((result) => result.status === "rejected")) {
          setErrorMessage(
            "Uma das listas não pôde ser carregada, mas o restante do mapa continua disponível.",
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.status === 404
              ? "O endpoint de proximidade não foi encontrado no backend."
              : "Não foi possível carregar os usuários próximos.",
          );
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o mapa.",
          );
        }

        setEntities([]);
      } finally {
        setIsLoading(false);
      }
    },
    [radiusKm],
  );

  const locateUser = useCallback(() => {
    setIsLocating(true);
    setErrorMessage("");

    if (!navigator.geolocation) {
      setLocationMessage(
        "Geolocalização indisponível. Usando a localização padrão.",
      );
      setIsLocating(false);
      void loadNearbyEntities(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(currentLocation);
        setLocationMessage("Sua localização atual");
        setIsLocating(false);
        void loadNearbyEntities(currentLocation);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setLocationMessage(
          "Permissão não concedida. Usando Cajazeiras como referência.",
        );
        setIsLocating(false);
        void loadNearbyEntities(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [loadNearbyEntities]);

  useEffect(() => {
    locateUser();
  }, [locateUser]);

  const filteredEntities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");

    return entities.filter((entity) => {
      const matchesType =
        selectedType === "all" || entity.type === selectedType;

      if (!matchesType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [entity.name, entity.subject, entity.institution, entity.email]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        );
    });
  }, [entities, searchTerm, selectedType]);

  const monitorCount = entities.filter(
    (entity) => entity.type === "monitor",
  ).length;
  const studentCount = entities.filter(
    (entity) => entity.type === "student",
  ).length;

  return (
    <div className="real-map-page">
      <section className="real-map-toolbar">
        <div>
          <span className="dashboard__eyebrow">Geolocalização</span>
          <h1>Mapa de usuários</h1>
          <p>
            Visualize alunos e monitores próximos da sua localização.
          </p>
        </div>

        <div className="real-map-toolbar__actions">
          <label className="map-radius-field">
            <span>Raio</span>
            <select
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </label>

          <button
            className="secondary-button map-action-button"
            type="button"
            onClick={() => void loadNearbyEntities(location)}
            disabled={isLoading}
          >
            <RefreshCw
              size={17}
              className={isLoading ? "icon-spinning" : ""}
            />
            Atualizar
          </button>

          <button
            className="primary-button map-action-button"
            type="button"
            onClick={locateUser}
            disabled={isLocating}
          >
            <LocateFixed size={17} />
            Minha localização
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className="map-alert" role="alert">
          {errorMessage}
        </div>
      )}

      <section className="real-map-layout">
        <aside className="map-results-panel">
          <div className="map-results-panel__header">
            <div className="map-search-field">
              <Search size={17} />
              <input
                type="search"
                placeholder="Pesquisar no mapa..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="map-filter-tabs" aria-label="Filtrar usuários">
              <button
                type="button"
                className={selectedType === "all" ? "active" : ""}
                onClick={() => setSelectedType("all")}
              >
                <ListFilter size={15} />
                Todos
              </button>

              <button
                type="button"
                className={selectedType === "monitor" ? "active" : ""}
                onClick={() => setSelectedType("monitor")}
              >
                <GraduationCap size={15} />
                Monitores
              </button>

              <button
                type="button"
                className={selectedType === "student" ? "active" : ""}
                onClick={() => setSelectedType("student")}
              >
                <UsersRound size={15} />
                Alunos
              </button>
            </div>

            <div className="map-summary">
              <span>
                <GraduationCap size={16} />
                <strong>{monitorCount}</strong> monitores
              </span>
              <span>
                <UsersRound size={16} />
                <strong>{studentCount}</strong> alunos
              </span>
            </div>
          </div>

          <div className="map-results-list">
            {isLoading && (
              <div className="map-list-state">
                <span className="route-loader__spinner" />
                <p>Buscando usuários próximos...</p>
              </div>
            )}

            {!isLoading && filteredEntities.length === 0 && (
              <div className="map-list-state">
                <MapPin size={28} />
                <strong>Nenhum usuário encontrado</strong>
                <p>
                  Tente aumentar o raio ou alterar os filtros da busca.
                </p>
              </div>
            )}

            {!isLoading &&
              filteredEntities.map((entity) => (
                <article className="map-person-card" key={`${entity.type}-${entity.id}`}>
                  <div
                    className={`map-person-card__avatar map-person-card__avatar--${entity.type}`}
                  >
                    {entity.type === "monitor" ? (
                      <GraduationCap size={19} />
                    ) : (
                      <UserRound size={19} />
                    )}
                  </div>

                  <div className="map-person-card__content">
                    <div>
                      <strong>{entity.name}</strong>
                      <span>
                        {entity.type === "monitor" ? "Monitor" : "Aluno"}
                      </span>
                    </div>

                    {entity.subject && <p>{entity.subject}</p>}
                    {entity.institution && <small>{entity.institution}</small>}

                    <footer>
                      {typeof entity.rating === "number" && (
                        <span>
                          <Star size={13} fill="currentColor" />
                          {entity.rating.toFixed(1)}
                        </span>
                      )}

                      {typeof entity.distanceKm === "number" && (
                        <span>
                          <Crosshair size={13} />
                          {entity.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </footer>
                  </div>
                </article>
              ))}
          </div>
        </aside>

        <div className="real-map-container">
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={14}
            scrollWheelZoom
            className="leaflet-map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewport
              latitude={location.latitude}
              longitude={location.longitude}
            />

            <Marker
              position={[location.latitude, location.longitude]}
              icon={userMarkerIcon}
            >
              <Popup>
                <strong>Você está aqui</strong>
                <br />
                {locationMessage}
              </Popup>
            </Marker>

            {filteredEntities.map((entity) => (
              <Marker
                key={`${entity.type}-${entity.id}`}
                position={[entity.latitude, entity.longitude]}
                icon={createEntityMarkerIcon(entity.type)}
              >
                <Popup>
                  <div className="entity-popup">
                    <strong>{entity.name}</strong>
                    <span>
                      {entity.type === "monitor" ? "Monitor" : "Aluno"}
                    </span>
                    {entity.subject && <p>{entity.subject}</p>}
                    {entity.institution && <small>{entity.institution}</small>}
                    {typeof entity.distanceKm === "number" && (
                      <small>{entity.distanceKm.toFixed(1)} km de distância</small>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="real-map-status">
            <MapPin size={15} />
            <span>{locationMessage}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MapPage;
