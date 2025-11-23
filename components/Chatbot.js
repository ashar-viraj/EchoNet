import { useEffect, useRef, useState } from "react";

const starterMessages = [
  { role: "assistant", content: "Hi! I can help you discover books, movies, and audio on EchoNet. What do you need?" },
];

const quickPrompts = [
  "Find me a sci-fi audiobook",
  "Show popular Hindi books",
  "How do I download items offline?",
  "Recommend a family movie night pick",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [size, setSize] = useState({ width: 380, height: 440 });
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError("");

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Chatbot is temporarily unavailable.");
      }

      const data = await res.json();
      const reply = data?.message || "I couldn't generate a response.";
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Sorry, I hit an error trying to respond. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const { width: startWidth, height: startHeight } = size;
    const minWidth = 300;
    const maxWidth = 720;
    const minHeight = 320;
    const maxHeight = Math.max(minHeight, Math.min(window.innerHeight - 80, 900));

    const onMove = (moveEvt) => {
      const dx = startX - moveEvt.clientX; // dragging left grows width
      const dy = moveEvt.clientY - startY; // dragging down grows height
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + dx));
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + dy));
      setSize({ width: nextWidth, height: nextHeight });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-10 right-9 z-40 rounded-full px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-slate-900/40 bg-gradient-to-r from-sky-300 to-sky-400 border border-sky-200 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
      >
        {isOpen ? "Hide assistant" : "Chat with EchoDost"}
      </button>

      {isOpen && (
        <div
          className="fixed right-9 bottom-26 z-30"
          style={{
            width: `${size.width}px`,
            maxWidth: "92vw",
            minWidth: "300px",
            height: `${size.height}px`,
            minHeight: "340px",
            maxHeight: "85vh",
          }}
        >
          <div className="relative bg-slate-900/85 border-4 border-sky-800 rounded-2xl shadow-2xl shadow-slate-950/50 flex flex-col h-full backdrop-blur">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Echo assistant</p>
                <p className="text-sm text-slate-200">Ask anything about the library</p>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_2px_rgba(74,222,128,0.45)]" aria-label="online" />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-slate-800/70 text-slate-100 border border-slate-700"
                        : "bg-sky-600 text-white border border-sky-500/70"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-slate-800/70 border border-slate-700 text-slate-200 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
                      Typing…
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/70 text-slate-200 hover:border-sky-500/60 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs text-red-300 mb-1">{error}</p>}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder="Ask Echo..."
                  className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800/70 text-slate-100 text-sm px-3 py-2 focus:outline-none focus:border-sky-500/60"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-400 transition"
                >
                  Send
                </button>
              </form>
            </div>

            <button
              onMouseDown={startResize}
              className="absolute left-3 bottom-3 w-5 h-5 bg-slate-800 border border-slate-700 rounded-sm cursor-sw-resize opacity-90 hover:bg-slate-700 active:scale-95"
              title="Resize"
              type="button"
              aria-label="Resize chat"
            />
          </div>
        </div>
      )}
    </>
  );
}
