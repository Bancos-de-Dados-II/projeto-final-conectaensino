import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Info,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getNotifications } from "../../services/dashboard.service";
import type { NotificationItem } from "../../types/dashboard";

interface NotificationCenterProps {
  compact?: boolean;
}

function NotificationCenter({ compact = false }: NotificationCenterProps) {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void getNotifications().then(setItems);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unread = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  function markAllRead() {
    setItems((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }

  return (
    <div className="notification-center" ref={wrapperRef}>
      <button
        className="icon-button notification-button"
        type="button"
        aria-label="Notificações"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="notification-badge">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <section className="notification-popover">
          <header>
            <div>
              <span className="dashboard__eyebrow">Central</span>
              <h2>Notificações</h2>
            </div>

            <button
              className="icon-button"
              type="button"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </header>

          <div className="notification-popover__actions">
            <span>{unread} não lidas</span>

            <button type="button" onClick={markAllRead}>
              <CheckCheck size={15} />
              Marcar como lidas
            </button>
          </div>

          <div className="notification-list">
            {items.length === 0 && (
              <div className="notification-empty">
                <Bell size={27} />
                <p>Nenhuma notificação disponível.</p>
              </div>
            )}

            {items.map((item) => {
              const Icon =
                item.type === "success"
                  ? CircleCheck
                  : item.type === "warning"
                    ? CircleAlert
                    : Info;

              return (
                <button
                  className={`notification-item ${
                    item.read ? "notification-item--read" : ""
                  }`}
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setItems((current) =>
                      current.map((currentItem) =>
                        currentItem.id === item.id
                          ? { ...currentItem, read: true }
                          : currentItem,
                      ),
                    );

                    setOpen(false);

                    if (item.route) {
                      navigate(item.route);
                    }
                  }}
                >
                  <span
                    className={`notification-item__icon notification-item__icon--${item.type}`}
                  >
                    <Icon size={17} />
                  </span>

                  <span className="notification-item__content">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  {!item.read && <i />}
                </button>
              );
            })}
          </div>

          {!compact && (
            <footer>
              <button type="button" onClick={() => setOpen(false)}>
                Fechar central
              </button>
            </footer>
          )}
        </section>
      )}
    </div>
  );
}

export default NotificationCenter;
