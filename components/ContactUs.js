import { useState } from "react";

export default function ContactUs({ compact = false }) {
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [mailWarning, setMailWarning] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    setMailWarning(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send message");
      setStatus("success");
      if (data.mailOk === false) setMailWarning(true);
      setMessage("");
    } catch (err) {
      setError(err.message || "Unable to send message");
      setStatus("error");
    }
  };

  return (
    <section className={`my-10 ${compact ? "" : "container mx-auto px-6"} `}>
      <div className="bg-rustic-card border border-rustic rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-rustic-muted">Contact us</p>
            <h3 className="text-xl font-semibold text-rustic-dark text-gradient-rustic">Have a doubt or need help?</h3>
            <p className="text-sm text-rustic-muted">
              Share your questions here, and we will get back to you by email.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="w-full px-3 py-2 rounded-lg bg-white/90 border border-rustic text-sm text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
            placeholder="Your email or name (optional)"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
          />
          <div className="md:col-span-2">
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-white/90 border border-rustic text-sm text-rustic-dark placeholder:text-rustic-muted h-20 focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
              placeholder="Share your question or feedback"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={status === "sending"}
              className="px-4 py-2 bg-gradient-rustic text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition shadow"
            >
              {status === "sending" ? "Sending..." : "Send message"}
            </button>
          </div>
          {status === "success" && (
            <p className="md:col-span-3 text-sm text-emerald-700">Thanks! We received your message.</p>
          )}
          {mailWarning && (
            <p className="md:col-span-3 text-sm text-amber-700">
              Message saved. Email delivery may be delayed-no action needed.
            </p>
          )}
          {status === "error" && (
            <p className="md:col-span-3 text-sm text-red-600">{error}</p>
          )}
        </form>
      </div>
    </section>
  );
}
