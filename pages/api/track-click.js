import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { identifier } = req.body || {};
  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({ error: 'Identifier is required' });
  }

  try {
    const upsert = `
      INSERT INTO item_clicks (identifier, click_count, last_clicked)
      VALUES ($1, 1, NOW())
      ON CONFLICT (identifier)
      DO UPDATE SET click_count = item_clicks.click_count + 1, last_clicked = NOW()
      RETURNING click_count;
    `;
    const result = await query(upsert, [identifier]);
    const clickCount = result.rows?.[0]?.click_count || 0;
    return res.status(200).json({ identifier, clickCount });
  } catch (err) {
    console.error('track-click error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
