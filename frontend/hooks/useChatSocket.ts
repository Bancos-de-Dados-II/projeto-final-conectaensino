import { useEffect, useRef } from "react";

import { createChatSocketUrl } from "../services/chat.service";
import type { ChatMessage } from "../types/chat";

interface UseChatSocketOptions {
  enabled?: boolean;
  onMessage: (message: ChatMessage) => void;
}

export function useChatSocket({
  enabled = true,
  onMessage,
}: UseChatSocketOptions) {
  const callbackRef = useRef(onMessage);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let disposed = false;

    function connect() {
      try {
        socket = new WebSocket(createChatSocketUrl());

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data) as ChatMessage;
            callbackRef.current(parsed);
          } catch {
          }
        };

        socket.onclose = () => {
          if (!disposed) {
            reconnectTimer = window.setTimeout(connect, 5000);
          }
        };
      } catch {
      }
    }

    connect();

    return () => {
      disposed = true;

      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }

      socket?.close();
    };
  }, [enabled]);
}
