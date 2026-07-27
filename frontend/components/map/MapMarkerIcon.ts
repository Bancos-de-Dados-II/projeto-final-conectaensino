import L from "leaflet";

import type { MapEntityType } from "../../types/map";

export function createEntityMarkerIcon(type: MapEntityType) {
  const label = type === "monitor" ? "M" : "A";

  return L.divIcon({
    className: "entity-marker-wrapper",
    html: `<span class="entity-marker entity-marker--${type}">${label}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

export const userMarkerIcon = L.divIcon({
  className: "user-marker-wrapper",
  html: '<span class="real-user-marker"><i></i></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -24],
});
