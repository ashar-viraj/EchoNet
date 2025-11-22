import { query } from './db';

/**
 * Build and execute a filtered content query for a specific mediatype
 * @param {string} mediatype - The mediatype to filter by (texts, audio, image, movies, software)
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Query result with items, total, pagination, and filter options
 */
export async function getFilteredContent(mediatype, filters) {
    const {
        language,
        subject,
        year,
        downloadsMin,
        downloadsMax,
        sizeMin,
        sizeMax,
        search,
        page = 1,
        limit = 20
    } = filters;

    // Build WHERE conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Mediatype filter
    conditions.push(`mediatype = $${paramIndex++}`);
    params.push(mediatype);

    // Language filter
    if (language) {
        conditions.push(`LOWER(language) = LOWER($${paramIndex++})`);
        params.push(language);
    }

    // Subject filter (JSONB array contains)
    if (subject) {
        const subjects = Array.isArray(subject) ? subject : [subject];
        // Use OR condition for multiple subjects
        if (subjects.length === 1) {
            conditions.push(`subject @> $${paramIndex++}::jsonb`);
            params.push(JSON.stringify([subjects[0]]));
        } else {
            const subjectOrConditions = subjects.map((s) => {
                const idx = paramIndex++;
                params.push(JSON.stringify([s]));
                return `subject @> $${idx}::jsonb`;
            });
            conditions.push(`(${subjectOrConditions.join(' OR ')})`);
        }
    }

    // Year filter
    if (year) {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum)) {
            conditions.push(`EXTRACT(YEAR FROM publicdate) = $${paramIndex++}`);
            params.push(yearNum);
        }
    }

    // Downloads range filter
    if (downloadsMin || downloadsMax) {
        if (downloadsMin) {
            conditions.push(`downloads >= $${paramIndex++}`);
            params.push(parseInt(downloadsMin));
        }
        if (downloadsMax) {
            conditions.push(`downloads <= $${paramIndex++}`);
            params.push(parseInt(downloadsMax));
        }
    }

    // Size range filter
    if (sizeMin || sizeMax) {
        if (sizeMin) {
            conditions.push(`item_size >= $${paramIndex++}`);
            params.push(parseInt(sizeMin));
        }
        if (sizeMax) {
            conditions.push(`item_size <= $${paramIndex++}`);
            params.push(parseInt(sizeMax));
        }
    }

    // Search filter
    if (search) {
        conditions.push(`(
      LOWER(title) LIKE LOWER($${paramIndex}) 
      OR LOWER(description) LIKE LOWER($${paramIndex})
      OR subject::text LIKE LOWER($${paramIndex})
    )`);
        params.push(`%${search}%`);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countQuery = `SELECT COUNT(*) as total FROM archive_items ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const dataQuery = `
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
    ${whereClause}
    ORDER BY downloads DESC, publicdate DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

    const dataParams = [...params, limitNum, offset];
    const dataResult = await query(dataQuery, dataParams);

    // Get filter options (languages, subjects, years) for this mediatype
    const filterOptionsQuery = `
    SELECT 
      DISTINCT language
    FROM archive_items
    WHERE mediatype = $1 AND language IS NOT NULL
    ORDER BY language
  `;

    const languagesResult = await query(filterOptionsQuery, [mediatype]);
    const languages = languagesResult.rows.map(r => r.language).filter(Boolean);

    // Get unique subjects
    // Handle both array and scalar JSONB values using UNION
    const subjectsQuery = `
    SELECT DISTINCT subject::text as subject
    FROM (
      SELECT jsonb_array_elements_text(subject) as subject
      FROM archive_items
      WHERE mediatype = $1 AND subject IS NOT NULL AND jsonb_typeof(subject) = 'array'
      UNION
      SELECT subject::text as subject
      FROM archive_items
      WHERE mediatype = $1 AND subject IS NOT NULL AND jsonb_typeof(subject) = 'string'
    ) sub
    WHERE subject IS NOT NULL AND subject != ''
    ORDER BY subject
  `;

    const subjectsResult = await query(subjectsQuery, [mediatype]);
    const subjects = subjectsResult.rows.map(r => r.subject).filter(Boolean);

    // Get unique years
    const yearsQuery = `
    SELECT DISTINCT EXTRACT(YEAR FROM publicdate) as year
    FROM archive_items
    WHERE mediatype = $1 AND publicdate IS NOT NULL
    ORDER BY year DESC
  `;

    const yearsResult = await query(yearsQuery, [mediatype]);
    const years = yearsResult.rows
        .map(r => r.year ? parseInt(r.year) : null)
        .filter(y => y && !isNaN(y));

    // Format items
    const items = dataResult.rows.map(row => ({
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
        url: row.url
    }));

    return {
        items,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        filters: {
            languages,
            subjects,
            years
        }
    };
}

