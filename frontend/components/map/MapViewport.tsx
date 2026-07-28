import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapViewportProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

function MapViewport({
  latitude,
  longitude,
  zoom = 14,
}: MapViewportProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [latitude, longitude, map, zoom]);

  return null;
}

export default MapViewport;
