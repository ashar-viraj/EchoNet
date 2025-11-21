# Database Import Guide

This guide explains how to import scraped NDJSON data into PostgreSQL.

## Prerequisites

1. PostgreSQL installed and running
2. Database `echonet` created
3. Python packages installed

## Setup Steps

### 1. Create Database (if not exists)

```sql
CREATE DATABASE echonet;
```

### 2. Install Python Dependencies

```bash
pip install -r requirements_db.txt
```

### 3. Create Database Schema

Run the SQL schema file to create the table and indexes:

```bash
psql -U postgres -d echonet -f database_schema.sql
```

Or using psql interactively:
```bash
psql -U postgres -d echonet
\i database_schema.sql
```

### 4. Import Data

Run the import script to load all NDJSON files:

```bash
python import_to_db.py
```

The script will:
- Automatically find all `.ndjson` files in subdirectories
- Skip backup files (files with 'backup' in the name)
- Handle duplicates using `ON CONFLICT` (updates existing records)
- Show progress with a progress bar
- Commit every 100 items for better performance

## Database Schema

The `archive_items` table contains:
- `id`: Primary key (auto-increment)
- `identifier`: Unique identifier from archive.org
- `title`: Item title
- `description`: Item description
- `language`: Language code
- `item_size`: Size in bytes
- `downloads`: Number of downloads
- `btih`: BitTorrent info hash
- `mediatype`: Type (texts, audio, software, movies, image)
- `subject`: JSONB field for subjects (can be array)
- `publicdate`: Publication date (timestamp)
- `url`: Full URL to the item
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp (auto-updated)

## Query Examples

### Count items by mediatype
```sql
SELECT mediatype, COUNT(*) 
FROM archive_items 
GROUP BY mediatype;
```

### Find most downloaded items
```sql
SELECT title, downloads, url 
FROM archive_items 
ORDER BY downloads DESC 
LIMIT 10;
```

### Search by subject
```sql
SELECT title, subject 
FROM archive_items 
WHERE subject @> '["Science"]'::jsonb;
```

### Find items by language
```sql
SELECT title, language, downloads 
FROM archive_items 
WHERE language = 'English' 
ORDER BY downloads DESC;
```

## Notes

- The import script handles the bug in scrapers where `identifier` was sometimes stored as `title` by extracting it from the URL
- Duplicate identifiers are automatically updated (not inserted twice)
- The `subject` field is stored as JSONB to handle arrays efficiently
- Progress is shown with tqdm progress bars

