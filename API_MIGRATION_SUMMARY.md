# API Migration Summary: File-based to Database

## Overview

All backend APIs have been migrated from reading NDJSON files to querying PostgreSQL database.

## Changes Made

### 1. Database Connection (`lib/db.js`)

- Created PostgreSQL connection pool using `pg` package
- Configured with environment variables (defaults to provided credentials)
- Includes connection pooling for better performance

### 2. Content Query Helper (`lib/content-query.js`)

- Centralized function for filtered content queries
- Supports all filter types: language, subject, year, downloads, size, search
- Handles pagination and filter options (languages, subjects, years)
- Uses PostgreSQL JSONB queries for subject filtering

### 3. Updated APIs

#### `/api/search.js`

- **Before**: Read all NDJSON files, parse line by line, filter in memory
- **After**: Single PostgreSQL query with ILIKE pattern matching
- **Features**: Relevance scoring, case-insensitive search, top 50 results

#### `/api/top-viewed.js`

- **Before**: Read all NDJSON files, sort by views/downloads in memory
- **After**: PostgreSQL query ordered by downloads DESC
- **Note**: Maps `downloads` to `views` field for backward compatibility

#### `/api/content/text.js`

- **Before**: Read `scrape_text_v1.ndjson`, filter in memory
- **After**: Uses `getFilteredContent('texts', ...)` helper

#### `/api/content/audio.js`

- **Before**: Read `scrape_audio_v1.ndjson`, filter in memory
- **After**: Uses `getFilteredContent('audio', ...)` helper

#### `/api/content/image.js`

- **Before**: Read `scrape_image_v1.ndjson`, filter in memory
- **After**: Uses `getFilteredContent('image', ...)` helper

#### `/api/content/movies.js`

- **Before**: Read `scrape_movies_v1.ndjson`, filter in memory
- **After**: Uses `getFilteredContent('movies', ...)` helper

#### `/api/content/software.js`

- **Before**: Read `scrape_software_v1.ndjson`, filter in memory
- **After**: Uses `getFilteredContent('software', ...)` helper

## Dependencies Added

- `pg@^8.11.3` - PostgreSQL client for Node.js

## Environment Variables

The database connection uses these environment variables (with defaults):

- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `13241324`)
- `DB_NAME` (default: `echonet`)

## Benefits

1. **Performance**: Database queries are much faster than reading and parsing large files
2. **Scalability**: Can handle millions of records efficiently
3. **Indexing**: PostgreSQL indexes speed up searches and filters
4. **Concurrent Access**: Multiple API requests can query simultaneously
5. **Data Integrity**: Database constraints ensure data consistency
6. **Advanced Queries**: Can use SQL features like full-text search, aggregations, etc.

## Next Steps

1. Install dependencies: `npm install`
2. Ensure PostgreSQL is running and database is populated
3. Test all API endpoints
4. Consider adding environment variable file (`.env`) for production

## API Response Format

All APIs maintain the same response format as before, ensuring backward compatibility with frontend code.
