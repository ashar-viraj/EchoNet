import { query } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS click_stats (
      identifier TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      language TEXT,
      url TEXT,
      clicks INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { identifier, title, description, language, url } = req.body || {};
  if (!identifier) return res.status(400).json({ error: "identifier is required" });

  try {
    await ensureTable();
    await query(
      `
      INSERT INTO click_stats (identifier, title, description, language, url, clicks, updated_at)
      VALUES ($1, $2, $3, $4, $5, 1, NOW())
      ON CONFLICT (identifier)
      DO UPDATE SET
        clicks = click_stats.clicks + 1,
        updated_at = NOW(),
        title = COALESCE(EXCLUDED.title, click_stats.title),
        description = COALESCE(EXCLUDED.description, click_stats.description),
        language = COALESCE(EXCLUDED.language, click_stats.language),
        url = COALESCE(EXCLUDED.url, click_stats.url);
      `,
      [identifier, title || null, description || null, language || null, url || null]
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("track-click failed", err);
    return res.status(500).json({ error: "Unable to record click" });
  }
}
