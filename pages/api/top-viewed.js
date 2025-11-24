import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const topQuery = `
            SELECT 
                identifier,
                title,
                description,
                language,
                item_size,
                downloads,
                btih,
                mediatype,
                subject,
                publicdate,
                url
            FROM archive_items
            ORDER BY downloads DESC
            LIMIT 50
        `;

        const result = await query(topQuery);

        const items = result.rows.map(row => ({
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
            type: row.mediatype || 'unknown',
            views: row.downloads
        }));

        return res.status(200).json({ items });
    } catch (error) {
        console.error('Top viewed error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
