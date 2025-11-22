import { useState } from "react";

export default function ContactUs({ compact = false }) {
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
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
    <section className={`mt-10 ${compact ? "" : "container mx-auto px-6"} `}>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Contact us</p>
            <h3 className="text-xl font-semibold text-sky-100">Have a doubt or need help?</h3>
            <p className="text-sm text-slate-300">
              Share your questions here—we’ll get back to you by email.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
            placeholder="Your email or name (optional)"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
          />
          <div className="md:col-span-2">
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white h-20"
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
              className="px-4 py-2 bg-cyan-600 text-black rounded-lg font-medium hover:bg-cyan-500 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send message"}
            </button>
          </div>
          {status === "success" && (
            <p className="md:col-span-3 text-sm text-emerald-300">Thanks! We received your message.</p>
          )}
          {mailWarning && (
            <p className="md:col-span-3 text-sm text-amber-300">
              Message saved. Email delivery may be delayed—no action needed.
            </p>
          )}
          {status === "error" && (
            <p className="md:col-span-3 text-sm text-red-400">{error}</p>
          )}
        </form>
      </div>
    </section>
  );
}
