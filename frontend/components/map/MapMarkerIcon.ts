import L from "leaflet";

export function createInstitutionMarkerIcon(hasMonitors: boolean) {
  const monitorClass = hasMonitors
    ? " entity-marker--has-monitors"
    : " entity-marker--no-monitors";

  return L.divIcon({
    className: "entity-marker-wrapper",
    html: `<span class="entity-marker entity-marker--institution${monitorClass}">E</span>`,
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

export function createAdminEntityMarkerIcon(type: 'student' | 'monitor' | 'director') {
  const labels = { student: 'A', monitor: 'M', director: 'D' };
  return L.divIcon({
    className: 'entity-marker-wrapper',
    html: `<span class="entity-marker entity-marker--${type}">${labels[type]}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}
