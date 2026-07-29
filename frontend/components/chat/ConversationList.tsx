import { MessageCircle, Search } from "lucide-react";
import { memo, useMemo, useState } from "react";

import type { Conversation } from "../../types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  loading?: boolean;
  onSelect: (conversation: Conversation) => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ConversationList({
  conversations,
  selectedId,
  loading,
  onSelect,
}: ConversationListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");

    if (!normalized) return conversations;

    return conversations.filter((conversation) =>
      `${conversation.participant.name} ${conversation.subject || ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [conversations, query]);

  return (
    <aside className="conversation-sidebar">
      <header className="conversation-sidebar__header">
        <div>
          <span className="dashboard__eyebrow">Comunicação</span>
          <h1>Tira-dúvidas</h1>
        </div>
      </header>

      <label className="conversation-search">
        <Search size={17} />
        <input
          value={query}
          placeholder="Buscar dúvida..."
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="conversation-list">
        {loading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div className="conversation-skeleton" key={index} />
          ))}

        {!loading && filtered.length === 0 && (
          <div className="conversation-empty">
            <MessageCircle size={30} />
            <strong>Nenhuma dúvida recebida</strong>
            <p>Os contatos relacionados às monitorias aparecerão aqui.</p>
          </div>
        )}

        {!loading &&
          filtered.map((conversation) => (
            <button
              className={`conversation-item ${
                selectedId === conversation.id
                  ? "conversation-item--active"
                  : ""
              }`}
              type="button"
              key={conversation.id}
              onClick={() => onSelect(conversation)}
            >
              <span className="conversation-avatar">
                {conversation.participant.avatar ? (
                  <img
                    src={conversation.participant.avatar}
                    alt=""
                  />
                ) : (
                  initials(conversation.participant.name)
                )}

                {conversation.participant.online && <i />}
              </span>

              <span className="conversation-item__content">
                <span className="conversation-item__top">
                  <strong>{conversation.participant.name}</strong>
                  <small>{formatTime(conversation.lastMessageAt)}</small>
                </span>

                <span className="conversation-item__bottom">
                  <small>
                    {conversation.lastMessage || "Inicie uma conversa"}
                  </small>

                  {conversation.unreadCount > 0 && (
                    <b>{conversation.unreadCount}</b>
                  )}
                </span>
              </span>
            </button>
          ))}
      </div>
    </aside>
  );
}

export default memo(ConversationList);
