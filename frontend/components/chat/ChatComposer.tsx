import { Paperclip, Send, Smile } from "lucide-react";
import { FormEvent, useState } from "react";

interface ChatComposerProps {
  disabled?: boolean;
  sending?: boolean;
  disabledPlaceholder?: string;
  onSend: (content: string) => Promise<void> | void;
}

function ChatComposer({
  disabled,
  sending,
  disabledPlaceholder,
  onSend,
}: ChatComposerProps) {
  const [content, setContent] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = content.trim();

    if (!value || disabled || sending) return;

    setContent("");
    await onSend(value);
  }

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <button
        type="button"
        aria-label="Adicionar anexo"
        title="Upload será ativado quando o endpoint estiver disponível"
        disabled
      >
        <Paperclip size={19} />
      </button>

      <div className="chat-composer__field">
        <textarea
          rows={1}
          value={content}
          disabled={disabled}
          placeholder={
            disabled
              ? disabledPlaceholder || "Selecione uma conversa"
              : "Digite sua mensagem..."
          }
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />

        <button
          type="button"
          aria-label="Emoji"
          title="Emojis"
          disabled
        >
          <Smile size={18} />
        </button>
      </div>

      <button
        className="chat-send-button"
        type="submit"
        aria-label="Enviar mensagem"
        disabled={disabled || sending || !content.trim()}
      >
        <Send size={18} />
      </button>
    </form>
  );
}

export default ChatComposer;
