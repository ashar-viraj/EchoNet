export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured." });
  }

  const { messages = [] } = req.body || {};
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": "EchoNet Chatbot",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => ({}));
      const errorMessage = payload?.error?.message || upstream.statusText || "OpenRouter request failed";
      return res.status(upstream.status).json({ error: errorMessage });
    }

    const data = await upstream.json();
    const message = data?.choices?.[0]?.message?.content || "I couldn't generate a response.";
    return res.status(200).json({ message });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unexpected error while contacting OpenRouter." });
  }
}
