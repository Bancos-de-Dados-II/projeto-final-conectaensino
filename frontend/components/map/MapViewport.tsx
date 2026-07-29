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

  useEffect(() => {
    const container = map.getContainer();

    const refreshSize = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
    };

    refreshSize();

    const observer = new ResizeObserver(refreshSize);
    observer.observe(container);

    window.addEventListener("resize", refreshSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refreshSize);
    };
  }, [map]);

  return null;
}

export default MapViewport;
