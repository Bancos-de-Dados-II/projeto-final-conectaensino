import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { getFavoriteIds, toggleFavorite } from "../../services/favorites.service";

interface Props { monitorId: string; compact?: boolean; onChange?: (favorite: boolean) => void; }
export default function FavoriteButton({ monitorId, compact = false, onChange }: Props) {
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void getFavoriteIds().then((ids) => setFavorite(ids.includes(monitorId))); }, [monitorId]);
  async function handleClick() {
    const next = !favorite; setFavorite(next); setBusy(true);
    await toggleFavorite(monitorId, next); setBusy(false); onChange?.(next);
  }
  return <button className={`favorite-button ${favorite ? "favorite-button--active" : ""}`} type="button" disabled={busy} onClick={handleClick} aria-pressed={favorite}>
    <Heart size={17} fill={favorite ? "currentColor" : "none"}/>{!compact && (favorite ? "Favoritado" : "Favoritar")}
  </button>;
}
