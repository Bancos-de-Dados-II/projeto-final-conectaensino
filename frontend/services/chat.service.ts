import { api, getApiBaseUrl } from "../api/axios";
import type {
  ChatMessage,
  ChatParticipant,
  Conversation,
  SendMessageInput,
} from "../types/chat";

type Dict = Record<string, unknown>;

const isObject = (value: unknown): value is Dict =>
  typeof value === "object" && value !== null;

function list(value: unknown): Dict[] {
  if (Array.isArray(value)) return value.filter(isObject);
  if (!isObject(value)) return [];

  for (const key of [
    "data",
    "items",
    "results",
    "conversations",
    "conversas",
    "messages",
    "mensagens",
  ]) {
    const found = list(value[key]);
    if (found.length) return found;
  }

  return [];
}

function get(source: Dict, paths: string[]): unknown {
  for (const path of paths) {
    let current: unknown = source;

    for (const part of path.split(".")) {
      if (!isObject(current) || !(part in current)) {
        current = undefined;
        break;
      }

      current = current[part];
    }

    if (current !== undefined && current !== null) return current;
  }
}

const text = (value: unknown, fallback = "") =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;

const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const boolean = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";

function normalizeParticipant(item: Dict): ChatParticipant {
  return {
    id: text(get(item, ["id", "_id", "uuid", "user_id"]), "participant"),
    name: text(
      get(item, ["name", "nome", "user.name", "usuario.nome"]),
      "Usuário",
    ),
    avatar: text(get(item, ["avatar", "photo", "foto", "image_url"])),
    role: text(get(item, ["role", "perfil", "tipo"])),
    online: boolean(get(item, ["online", "is_online"])),
    lastSeen: text(get(item, ["last_seen", "lastSeen", "ultimo_acesso"])),
  };
}

export function normalizeConversation(
  item: Dict,
  index = 0,
): Conversation {
  const rawParticipant = get(item, [
    "participant",
    "other_user",
    "user",
    "monitor",
    "aluno",
  ]);

  const participant = isObject(rawParticipant)
    ? normalizeParticipant(rawParticipant)
    : normalizeParticipant(item);

  return {
    id: text(get(item, ["id", "_id", "uuid"]), `conversation-${index}`),
    participant,
    lastMessage: text(
      get(item, [
        "last_message.content",
        "lastMessage.content",
        "last_message",
        "ultima_mensagem",
      ]),
    ),
    lastMessageAt: text(
      get(item, [
        "last_message.created_at",
        "lastMessage.createdAt",
        "updated_at",
        "ultima_mensagem_em",
      ]),
    ),
    unreadCount: number(
      get(item, ["unread_count", "unreadCount", "nao_lidas"]),
    ),
    sessionId: text(get(item, ["session_id", "sessao_id", "session.id"])),
    subject: text(
      get(item, ["subject", "disciplina.nome", "session.subject.name"]),
    ),
  };
}

export function normalizeMessage(item: Dict, index = 0): ChatMessage {
  return {
    id: text(get(item, ["id", "_id", "uuid"]), `message-${index}`),
    conversationId: text(
      get(item, ["conversation_id", "conversationId", "conversa_id"]),
    ),
    senderId: text(
      get(item, ["sender_id", "senderId", "remetente_id", "sender.id"]),
    ),
    senderName: text(
      get(item, ["sender.name", "remetente.nome", "sender_name"]),
    ),
    senderRole: text(
      get(item, ["senderRole", "sender_role", "remetente_tipo"]),
    ) as ChatMessage["senderRole"],
    content: text(get(item, ["content", "message", "mensagem", "texto"])),
    createdAt: text(
      get(item, ["created_at", "createdAt", "enviada_em"]),
      new Date().toISOString(),
    ),
    status: "sent",
    attachment: isObject(get(item, ["attachment", "anexo"]))
      ? {
          name: text(
            get(get(item, ["attachment", "anexo"]) as Dict, [
              "name",
              "nome",
              "filename",
            ]),
          ),
          url: text(
            get(get(item, ["attachment", "anexo"]) as Dict, ["url", "link"]),
          ),
          type: text(
            get(get(item, ["attachment", "anexo"]) as Dict, ["type", "tipo"]),
          ),
        }
      : undefined,
  };
}

const mockConversations: Conversation[] = [
  {
    id: "demo-1",
    participant: {
      id: "monitor-demo",
      name: "Monitor de Matemática",
      role: "Monitor",
      online: true,
    },
    lastMessage: "Olá! Em que posso ajudar na próxima monitoria?",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 1,
    subject: "Matemática",
  },
];

const mockMessages: Record<string, ChatMessage[]> = {
  "demo-1": [
    {
      id: "demo-message-1",
      conversationId: "demo-1",
      senderId: "monitor-demo",
      senderName: "Monitor de Matemática",
      content:
        "Olá! Este é o espaço de conversa da sua monitoria. Em que posso ajudar?",
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      status: "read",
    },
  ],
};

export async function getConversations(): Promise<Conversation[]> {
  const response = await api.get("/chat/conversations");
  return list(response.data).map(normalizeConversation);

  try {
    const { data } = await api.get("/chat/conversations");
    const normalized = list(data).map(normalizeConversation);

    if (normalized.length) return normalized;
  } catch {
  }

  return mockConversations;
}

export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const response = await api.get(
    `/chat/conversations/${conversationId}/messages`,
  );
  return list(response.data).map(normalizeMessage);

  try {
    const { data } = await api.get(
      `/chat/conversations/${conversationId}/messages`,
    );
    return list(data).map(normalizeMessage);
  } catch {
    return mockMessages[conversationId] || [];
  }
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<ChatMessage> {
  const response = await api.post("/chat/messages", {
    conversation_id: input.conversationId,
    content: input.content,
  });
  const responseSource =
    isObject(response.data) && isObject(response.data.data)
      ? response.data.data
      : response.data;
  if (!isObject(responseSource)) {
    throw new Error("Resposta inválida ao enviar mensagem.");
  }
  return normalizeMessage(responseSource);

  try {
    const { data } = await api.post("/chat/messages", {
      conversation_id: input.conversationId,
      content: input.content,
    });

    const source = isObject(data) && isObject(data.data) ? data.data : data;

    if (isObject(source)) return normalizeMessage(source);
  } catch {
  }

  const message: ChatMessage = {
    id: `local-${Date.now()}`,
    conversationId: input.conversationId,
    senderId: "me",
    senderName: "Você",
    content: input.content,
    createdAt: new Date().toISOString(),
    status: "sent",
  };

  mockMessages[input.conversationId] = [
    ...(mockMessages[input.conversationId] || []),
    message,
  ];

  return message;
}

export async function markConversationAsRead(
  conversationId: string,
): Promise<void> {
  await api.patch(`/chat/conversations/${conversationId}/read`);
  return;

  try {
    await api.patch(`/chat/conversations/${conversationId}/read`);
  } catch {
  }
}

export function createChatSocketUrl(): string {
  const apiUrl = new URL(getApiBaseUrl());
  const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  const configured = import.meta.env.VITE_CHAT_WS_URL?.trim();

  if (configured) return configured;

  return `${protocol}//${apiUrl.host}/ws/chat`;
}
