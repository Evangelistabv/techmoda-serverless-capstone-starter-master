import { FormEvent, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { api } from '../lib/api';
import type { ChatMessage } from '../lib/types';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const message = input.trim();
    if (!message || loading) return;

    const history = messages;
    setMessages((current) => [
      ...current,
      { role: 'user', text: message },
    ]);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const reply = await api.askAssistant(message, history);
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: reply },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo consultar al asistente'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section
          aria-label="Asistente de compras"
          className="mb-3 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div>
              <h2 className="font-semibold">Asistente TechModa</h2>
              <p className="text-xs text-blue-100">
                Pregúntame qué producto te conviene
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            className="flex-1 space-y-3 overflow-y-auto p-4"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <p className="text-sm text-gray-500">
                Por ejemplo: “Busco algo para una boda de día”.
              </p>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'ml-auto bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.text}
              </div>
            ))}

            {loading && (
              <p className="text-sm text-gray-500">
                Pensando…
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t p-3"
          >
            <label htmlFor="chat-message" className="sr-only">
              Mensaje
            </label>

            <input
              id="chat-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta…"
              className="min-w-0 flex-1 rounded-lg border px-3 py-2"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Enviar mensaje"
              className="rounded-lg bg-blue-600 p-2 text-white disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}