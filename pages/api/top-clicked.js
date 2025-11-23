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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    await ensureTable();
    const result = await query(
      `SELECT identifier, title, description, language, url, clicks
       FROM click_stats
       ORDER BY clicks DESC, updated_at DESC
       LIMIT 10`
    );
    return res.status(200).json({ items: result.rows || [] });
  } catch (err) {
    console.error("top-clicked failed", err);
    return res.status(500).json({ error: "Unable to load trending items" });
  }
}
