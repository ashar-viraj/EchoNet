import { query } from './db';

const filterCache = new Map();
const FILTER_CACHE_TTL_MS = 10 * 60 * 1000;

const countCache = new Map();
const COUNT_CACHE_TTL_MS = 5 * 60 * 1000;
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

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    conditions.push(`mediatype = $${paramIndex++}`);
    params.push(mediatype);

    if (language) {
        conditions.push(`LOWER(language) = LOWER($${paramIndex++})`);
        params.push(language);
    }

    if (subject) {
        const subjects = Array.isArray(subject) ? subject : [subject];
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

    if (year) {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum)) {
            conditions.push(`EXTRACT(YEAR FROM publicdate) = $${paramIndex++}`);
            params.push(yearNum);
        }
    }

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

    if (search) {
        const tsParam = `$${paramIndex++}`;
        params.push(search);

        const likeParamTitle = `$${paramIndex++}`;
        const likeParamDesc = `$${paramIndex++}`;
        const likeTerm = `%${search}%`;
        params.push(likeTerm, likeTerm);

        conditions.push(`(
            search_tsv @@ websearch_to_tsquery('simple', ${tsParam})
            OR LOWER(title) LIKE LOWER(${likeParamTitle})
            OR LOWER(description) LIKE LOWER(${likeParamDesc})
        )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
    ORDER BY downloads DESC, publicdate DESC, identifier
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

    const dataParams = [...params, limitNum, offset];
    const dataPromise = query(dataQuery, dataParams);

    const countKey = JSON.stringify({
        mediatype,
        language,
        subject,
        year,
        downloadsMin,
        downloadsMax,
        sizeMin,
        sizeMax,
        search
    });

    const countPromise = (async () => {
        const cachedCount = countCache.get(countKey);
        if (cachedCount && cachedCount.expires > Date.now()) {
            return cachedCount.value;
        }

        const countQuery = `SELECT COUNT(*) as total FROM archive_items ${whereClause}`;
        const countResult = await query(countQuery, [...params]);
        const totalVal = parseInt(countResult.rows[0].total);

        countCache.set(countKey, {
            value: totalVal,
            expires: Date.now() + COUNT_CACHE_TTL_MS
        });

        return totalVal;
    })();

    const filterOptionsPromise = fetchFilterOptions(mediatype);

    const [total, dataResult, filterOptions] = await Promise.all([
        countPromise,
        dataPromise,
        filterOptionsPromise
    ]);

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

    const totalPages = total === 0 ? 0 : total ? Math.ceil(total / limitNum) : null;

    return {
        items,
        total,
        page: pageNum,
        totalPages,
        filters: {
            languages: filterOptions.languages,
            subjects: filterOptions.subjects,
            years: filterOptions.years
        }
    };
}

/**
 * Get filter options (languages, subjects, years) using lightweight lookup tables when available.
 * Falls back to live queries filtered by mediatype.
 */
async function fetchFilterOptions(mediatype) {
    const cached = filterCache.get(mediatype);
    if (cached && cached.expires > Date.now()) {
        return cached.value;
    }

    try {
        const [languagesResult, subjectsResult, yearsResult] = await Promise.all([
            query('SELECT name FROM languages ORDER BY name'),
            query('SELECT name FROM subjects ORDER BY name'),
            query('SELECT year FROM years ORDER BY year DESC')
        ]);

        const languages = languagesResult.rows.map(r => r.name).filter(Boolean);
        const subjects = subjectsResult.rows.map(r => r.name).filter(Boolean);
        const years = yearsResult.rows.map(r => r.year ? parseInt(r.year) : null).filter(y => y && !isNaN(y));

        if (languages.length || subjects.length || years.length) {
            const value = { languages, subjects, years };
            filterCache.set(mediatype, { value, expires: Date.now() + FILTER_CACHE_TTL_MS });
            return value;
        }
    } catch (err) {
        console.warn('Lookup table fetch failed, falling back to live filters:', err.message);
    }

    const languagesFallback = await query(
        `SELECT DISTINCT language FROM archive_items WHERE mediatype = $1 AND language IS NOT NULL ORDER BY language`,
        [mediatype]
    );

    const subjectsFallback = await query(
        `
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
      `,
        [mediatype]
    );

    const yearsFallback = await query(
        `
        SELECT DISTINCT EXTRACT(YEAR FROM publicdate) as year
        FROM archive_items
        WHERE mediatype = $1 AND publicdate IS NOT NULL
        ORDER BY year DESC
      `,
        [mediatype]
    );

    const value = {
        languages: languagesFallback.rows.map(r => r.language).filter(Boolean),
        subjects: subjectsFallback.rows.map(r => r.subject).filter(Boolean),
        years: yearsFallback.rows
            .map(r => (r.year ? parseInt(r.year) : null))
            .filter(y => y && !isNaN(y))
    };

    filterCache.set(mediatype, {
        value,
        expires: Date.now() + FILTER_CACHE_TTL_MS
    });

    return value;
}
