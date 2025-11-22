import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = `
      SELECT 
        ai.identifier,
        ai.title,
        ai.description,
        ai.language,
        ai.item_size,
        ai.downloads,
        ai.btih,
        ai.mediatype,
        ai.subject,
        ai.publicdate,
        ai.url,
        ic.click_count
      FROM item_clicks ic
      JOIN archive_items ai ON ai.identifier = ic.identifier
      ORDER BY ic.click_count DESC, ic.last_clicked DESC
      LIMIT 50;
    `;
    const result = await query(sql);
    const items = result.rows.map((row) => ({
      identifier: row.identifier,
      title: row.title,
      description: row.description,
      language: row.language,
      item_size: row.item_size,
      downloads: row.downloads,
      btih: row.btih,
      mediatype: row.mediatype,
      subject: row.subject,
      publicdate: row.publicdate,
      url: row.url,
      clicks: row.click_count,
      type: row.mediatype || 'unknown'
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error('Top clicked error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
