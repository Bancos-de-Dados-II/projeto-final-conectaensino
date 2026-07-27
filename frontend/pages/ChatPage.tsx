import {
  ArrowLeft,
  MessageCircle,
  MoreVertical,
  Phone,
  Video,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ChatComposer from "../components/chat/ChatComposer";
import ConversationList from "../components/chat/ConversationList";
import MessageBubble from "../components/chat/MessageBubble";
import { useChatSocket } from "../hooks/useChatSocket";
import {
  getConversations,
  getMessages,
  markConversationAsRead,
  sendMessage,
} from "../services/chat.service";
import type {
  ChatMessage,
  Conversation,
} from "../types/chat";

function ChatPage() {
  const endRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);

  useEffect(() => {
    void getConversations()
      .then((items) => {
        setConversations(items);

        if (items.length && window.innerWidth > 760) {
          setSelected(items[0]);
        }
      })
      .finally(() => setLoadingConversations(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    void Promise.all([
      getMessages(selected.id),
      markConversationAsRead(selected.id),
    ])
      .then(([items]) => {
        setMessages(items);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selected.id
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );
      })
      .finally(() => setLoadingMessages(false));
  }, [selected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRealtimeMessage = useCallback(
    (message: ChatMessage) => {
      if (message.conversationId === selected?.id) {
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount:
                  message.conversationId === selected?.id
                    ? 0
                    : conversation.unreadCount + 1,
              }
            : conversation,
        ),
      );
    },
    [selected?.id],
  );

  useChatSocket({
    enabled: true,
    onMessage: handleRealtimeMessage,
  });

  async function handleSend(content: string) {
    if (!selected) return;

    const optimistic: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      conversationId: selected.id,
      senderId: "me",
      senderName: "Você",
      content,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((current) => [...current, optimistic]);
    setSending(true);

    try {
      const saved = await sendMessage({
        conversationId: selected.id,
        content,
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === optimistic.id ? saved : message,
        ),
      );

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selected.id
            ? {
                ...conversation,
                lastMessage: saved.content,
                lastMessageAt: saved.createdAt,
              }
            : conversation,
        ),
      );
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === optimistic.id
            ? { ...message, status: "failed" }
            : message,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-page">
      <ConversationList
        conversations={conversations}
        selectedId={selected?.id}
        loading={loadingConversations}
        onSelect={(conversation) => {
          setSelected(conversation);
          setMobileConversationOpen(true);
        }}
      />

      <main
        className={`chat-panel ${
          mobileConversationOpen ? "chat-panel--mobile-open" : ""
        }`}
      >
        {!selected ? (
          <div className="chat-welcome">
            <span>
              <MessageCircle size={35} />
            </span>
            <h2>Suas conversas em um só lugar</h2>
            <p>
              Selecione uma conversa para falar com um aluno ou monitor.
            </p>
          </div>
        ) : (
          <>
            <header className="chat-panel__header">
              <button
                className="chat-back-button"
                type="button"
                aria-label="Voltar para conversas"
                onClick={() => setMobileConversationOpen(false)}
              >
                <ArrowLeft size={20} />
              </button>

              <span className="conversation-avatar conversation-avatar--small">
                {selected.participant.avatar ? (
                  <img src={selected.participant.avatar} alt="" />
                ) : (
                  selected.participant.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")
                )}
                {selected.participant.online && <i />}
              </span>

              <div className="chat-panel__identity">
                <strong>{selected.participant.name}</strong>
                <small>
                  {selected.participant.online
                    ? "Online agora"
                    : selected.subject || "Conversa da monitoria"}
                </small>
              </div>

              <div className="chat-panel__actions">
                <button type="button" disabled title="Chamada em breve">
                  <Phone size={18} />
                </button>
                <button type="button" disabled title="Videochamada em breve">
                  <Video size={19} />
                </button>
                <button type="button" title="Mais opções">
                  <MoreVertical size={19} />
                </button>
              </div>
            </header>

            <section className="message-list">
              {loadingMessages &&
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    className={`message-skeleton ${
                      index % 2 ? "message-skeleton--own" : ""
                    }`}
                    key={index}
                  />
                ))}

              {!loadingMessages && messages.length === 0 && (
                <div className="chat-day-empty">
                  <MessageCircle size={29} />
                  <strong>Comece a conversa</strong>
                  <p>Envie uma mensagem sobre sua monitoria.</p>
                </div>
              )}

              {!loadingMessages &&
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    own={message.senderId === "me"}
                  />
                ))}

              <div ref={endRef} />
            </section>

            <ChatComposer
              sending={sending}
              onSend={handleSend}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default ChatPage;
