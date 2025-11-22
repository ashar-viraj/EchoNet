import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q } = req.query;
    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchTerm = q.trim();

    try {
        // Search in title and description using PostgreSQL full-text search
        // Using ILIKE for case-insensitive pattern matching
        const searchQuery = `
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
                url,
                CASE 
                    WHEN LOWER(title) LIKE LOWER($1) THEN 100
                    WHEN LOWER(title) LIKE LOWER($2) THEN 50
                    WHEN LOWER(description) LIKE LOWER($2) THEN 25
                    ELSE 10
                END as relevance_score
            FROM archive_items
            WHERE 
                LOWER(title) LIKE LOWER($2) 
                OR LOWER(description) LIKE LOWER($2)
            ORDER BY relevance_score DESC, downloads DESC
            LIMIT 50
        `;

        const searchPattern = `%${searchTerm}%`;
        const exactPattern = `${searchTerm}%`;

        const result = await query(searchQuery, [exactPattern, searchPattern]);

        // Format results to match the original API response
        const results = result.rows.map(row => ({
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
            relevanceScore: parseInt(row.relevance_score)
        }));

        return res.status(200).json({ results });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
