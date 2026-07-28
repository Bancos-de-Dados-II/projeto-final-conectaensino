import { Check, CheckCheck, CircleAlert } from "lucide-react";
import { memo } from "react";

import type { ChatMessage } from "../../types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  own: boolean;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MessageBubble({ message, own }: MessageBubbleProps) {
  const StatusIcon =
    message.status === "failed"
      ? CircleAlert
      : message.status === "read"
        ? CheckCheck
        : Check;

  return (
    <article
      className={`message-row ${own ? "message-row--own" : ""}`}
    >
      <div className="message-bubble">
        {!own && message.senderName && (
          <strong className="message-bubble__sender">
            {message.senderName}
          </strong>
        )}

        <p>{message.content}</p>

        {message.attachment && (
          <a
            className="message-attachment"
            href={message.attachment.url}
            target="_blank"
            rel="noreferrer"
          >
            {message.attachment.name}
          </a>
        )}

        <footer>
          <time>{formatTime(message.createdAt)}</time>
          {own && <StatusIcon size={13} />}
        </footer>
      </div>
    </article>
  );
}

export default memo(MessageBubble);
