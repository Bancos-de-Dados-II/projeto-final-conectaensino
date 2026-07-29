import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  GraduationCap,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useLocation } from "react-router-dom";

import MapViewport from "../components/map/MapViewport";
import {
  createInstitutionMarkerIcon,
  userMarkerIcon,
} from "../components/map/MapMarkerIcon";
import { getNearbyInstitutions } from "../services/map.service";
import type { MapCoordinates, MapEntity } from "../types/map";

const DEFAULT_LOCATION: MapCoordinates = {
  latitude: -6.8897,
  longitude: -38.5612,
};

const MAX_RADIUS_KM = 25;

interface MapRouteState {
  mapLocation?: {
    latitude: number;
    longitude: number;
    label: string;
  };
}

function getDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(toLatitude - fromLatitude);
  const deltaLongitude = toRadians(toLongitude - fromLongitude);
  const startLatitude = toRadians(fromLatitude);
  const endLatitude = toRadians(toLatitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function MapPage() {
  const routeLocation = useLocation();
  const requestedLocation = (routeLocation.state as MapRouteState | null)
    ?.mapLocation;
  const [location, setLocation] = useState<MapCoordinates>(() =>
    requestedLocation
      ? {
          latitude: requestedLocation.latitude,
          longitude: requestedLocation.longitude,
        }
      : DEFAULT_LOCATION,
  );
  const [schools, setSchools] = useState<MapEntity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLocating, setIsLocating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Tentando localizar você...",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const loadMapData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const institutions = await getNearbyInstitutions({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: MAX_RADIUS_KM,
      });

      setSchools(institutions);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.status === 404
            ? "Os endpoints do mapa não foram encontrados no backend."
            : "Não foi possível carregar as escolas.",
        );
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o mapa.",
        );
      }

      setSchools([]);
    } finally {
      setIsLoading(false);
    }
  }, [location.latitude, location.longitude]);

  const locateUser = useCallback(() => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      setLocationMessage(
        "Geolocalização indisponível. Usando a localização padrão.",
      );
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage("Sua localização atual");
        setIsLocating(false);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setLocationMessage(
          "Permissão não concedida. Usando Cajazeiras como referência.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  useEffect(() => {
    if (
      requestedLocation &&
      Number.isFinite(requestedLocation.latitude) &&
      Number.isFinite(requestedLocation.longitude)
    ) {
      setLocation({
        latitude: requestedLocation.latitude,
        longitude: requestedLocation.longitude,
      });
      setLocationMessage(`Centro de ${requestedLocation.label}`);
      setIsLocating(false);
      return;
    }

    locateUser();
  }, [
    locateUser,
    requestedLocation?.label,
    requestedLocation?.latitude,
    requestedLocation?.longitude,
  ]);

  useEffect(() => {
    void loadMapData();
  }, [loadMapData]);

  const filteredEntities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");

    const entitiesWithinRadius = schools.filter((entity) => {
      const distanceKm = getDistanceKm(
        location.latitude,
        location.longitude,
        entity.latitude,
        entity.longitude,
      );

      return distanceKm <= MAX_RADIUS_KM;
    });

    if (!normalizedSearch) {
      return entitiesWithinRadius;
    }

    return entitiesWithinRadius.filter((entity) =>
      [
        entity.name,
        entity.address,
        entity.city,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        ),
    );
  }, [
    location.latitude,
    location.longitude,
    schools,
    searchTerm,
  ]);

  const filteredSchools = filteredEntities;

  return (
    <div className="real-map-page">
      <section className="real-map-toolbar">
        <div>
          <span className="dashboard__eyebrow">Geolocalização</span>
          <h1>Mapa de escolas</h1>
          <p>Visualize escolas dentro de um raio de 25 km.</p>
        </div>

        <div className="real-map-toolbar__actions">
          <button
            className="secondary-button map-action-button"
            type="button"
            onClick={() => void loadMapData()}
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
                placeholder="Pesquisar escola..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="map-summary">
              <span>
                <GraduationCap size={16} />
                <strong>{filteredSchools.length}</strong> escolas em até 25 km
              </span>
            </div>
          </div>

          <div className="map-results-list">
            {isLoading && (
              <div className="map-list-state">
                <span className="route-loader__spinner" />
                <p>Carregando escolas...</p>
              </div>
            )}

            {!isLoading && filteredEntities.length === 0 && (
              <div className="map-list-state">
                <MapPin size={28} />
                <strong>Nenhum resultado encontrado</strong>
                <p>Não há escolas dentro de 25 km do seu ponto atual.</p>
              </div>
            )}

            {!isLoading &&
              filteredSchools.map((school) => {
                const distanceKm = getDistanceKm(
                  location.latitude,
                  location.longitude,
                  school.latitude,
                  school.longitude,
                );
                const monitorCount = school.monitorCount ?? 0;
                const hasMonitors = monitorCount > 0;

                return (
                  <article
                    className="map-person-card"
                    key={`institution-${school.id}`}
                  >
                    <div
                      className={`map-person-card__avatar ${
                        hasMonitors
                          ? "map-person-card__avatar--institution-with-monitors"
                          : "map-person-card__avatar--institution-without-monitors"
                      }`}
                    >
                      <GraduationCap size={19} />
                    </div>

                    <div className="map-person-card__content">
                      <div>
                        <strong>{school.name}</strong>
                        <span>Escola</span>
                      </div>

                      {school.address && <p>{school.address}</p>}
                      {school.city && <small>{school.city}</small>}
                      <small>
                        {monitorCount}{" "}
                        {monitorCount === 1
                          ? "monitor cadastrado"
                          : "monitores cadastrados"}
                      </small>
                      <small>{distanceKm.toFixed(1)} km de você</small>
                    </div>
                  </article>
                );
              })}

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

            {filteredSchools.map((school) => {
              const distanceKm = getDistanceKm(
                location.latitude,
                location.longitude,
                school.latitude,
                school.longitude,
              );
              const monitorCount = school.monitorCount ?? 0;

              return (
                <Marker
                  key={`institution-${school.id}`}
                  position={[school.latitude, school.longitude]}
                  icon={createInstitutionMarkerIcon(monitorCount > 0)}
                >
                  <Popup>
                    <div className="entity-popup">
                      <strong>{school.name}</strong>
                      <span>Escola</span>
                      {school.address && <p>{school.address}</p>}
                      {school.city && <small>{school.city}</small>}
                      <small>
                        {monitorCount}{" "}
                        {monitorCount === 1
                          ? "monitor cadastrado"
                          : "monitores cadastrados"}
                      </small>
                      <small>{distanceKm.toFixed(1)} km de você</small>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

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
