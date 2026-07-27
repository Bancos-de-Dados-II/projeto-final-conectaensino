export type MessageStatus = "sending" | "sent" | "read" | "failed";

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  online?: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  status: MessageStatus;
  attachment?: {
    name: string;
    url: string;
    type?: string;
  };
}

export interface Conversation {
  id: string;
  participant: ChatParticipant;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  sessionId?: string;
  subject?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
}
