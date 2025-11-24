import { useEffect, useRef, useState } from "react";

const starterMessages = [
  { role: "assistant", content: "Hi! I can help you discover books, movies, and audio on EchoNet. What do you need?" },
];

const quickPrompts = [
  "Find me a sci-fi audiobook",
  "Show popular Hindi books",
  "Best books for DBMS",
  "Recommend a family movie night pick",
  "How to access ML lectures of MIT"
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
      const dx = startX - moveEvt.clientX;
      const dy = moveEvt.clientY - startY;
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
        className="fixed bottom-10 right-9 z-40 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/30 bg-gradient-rustic border border-rustic hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(139,69,19,0.3)] transition"
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
          <div className="relative bg-rustic-translucent border-2 border-rustic rounded-2xl shadow-2xl shadow-amber-900/25 flex flex-col h-full backdrop-blur-lg">
            <div className="px-4 py-3 border-b border-rustic flex items-center justify-between bg-white/60 rounded-t-2xl">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-rustic-muted">Echo assistant</p>
                <p className="text-sm text-rustic-dark">Ask anything about the library</p>
              </div>
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_2px_rgba(208,138,77,0.55)]" aria-label="online" />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white/55">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow ${
                      msg.role === "assistant"
                        ? "bg-white/90 text-rustic-dark border border-rustic"
                        : "bg-gradient-rustic text-white border border-rustic shadow-amber-900/20"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-white/90 border border-rustic text-rustic-dark text-sm shadow">
                    <div className="flex items-center gap-2 text-rustic-muted">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                      Typing...
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pb-4 bg-white/70 rounded-b-2xl border-t border-rustic">
              <div className="flex flex-wrap gap-2 mb-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-rustic bg-white/80 text-rustic-dark hover:bg-gradient-rustic hover:text-white transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder="Ask Echo..."
                  className="flex-1 resize-none rounded-xl border border-rustic bg-white/90 text-rustic-dark text-sm px-3 py-2 placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-rustic text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition shadow-md shadow-amber-900/15"
                >
                  Send
                </button>
              </form>
            </div>

            <button
              onMouseDown={startResize}
              className="absolute left-3 bottom-3 w-5 h-5 bg-white/70 border border-rustic rounded-sm cursor-sw-resize opacity-90 hover:bg-rustic-card active:scale-95"
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
