-- PostgreSQL schema for EchoNet scraped data
-- Run this script to create the database and table

-- Create database (run this separately if database doesn't exist)
-- CREATE DATABASE echonet;

-- Connect to echonet database before running the rest

-- Create table for archive items
CREATE TABLE IF NOT EXISTS archive_items (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(1000) UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    language VARCHAR(1000),
    item_size BIGINT,
    downloads INTEGER DEFAULT 0,
    btih VARCHAR(128),
    mediatype VARCHAR(50),
    subject JSONB,  -- Store as JSONB to handle arrays
    publicdate TIMESTAMP,
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_archive_items_identifier ON archive_items(identifier);
CREATE INDEX IF NOT EXISTS idx_archive_items_mediatype ON archive_items(mediatype);
CREATE INDEX IF NOT EXISTS idx_archive_items_language ON archive_items(language);
CREATE INDEX IF NOT EXISTS idx_archive_items_downloads ON archive_items(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_archive_items_publicdate ON archive_items(publicdate);
CREATE INDEX IF NOT EXISTS idx_archive_items_publicdate_downloads ON archive_items(publicdate DESC, downloads DESC);
-- Composite index to serve the common mediatype + downloads/publicdate sort with a tiebreaker
CREATE INDEX IF NOT EXISTS idx_archive_items_media_downloads_date_id 
    ON archive_items(mediatype, downloads DESC, publicdate DESC, identifier);

-- Full-text search support on title/description
ALTER TABLE archive_items 
    ADD COLUMN IF NOT EXISTS search_tsv tsvector;

CREATE OR REPLACE FUNCTION archive_items_tsv_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('simple', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archive_items_tsv
    BEFORE INSERT OR UPDATE ON archive_items
    FOR EACH ROW
    EXECUTE FUNCTION archive_items_tsv_trigger();

-- Backfill search_tsv for existing rows (run once after adding the column)
-- UPDATE archive_items SET search_tsv = to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''));

CREATE INDEX IF NOT EXISTS idx_archive_items_search_tsv ON archive_items USING GIN (search_tsv);

-- Create GIN index for JSONB subject field for better search
CREATE INDEX IF NOT EXISTS idx_archive_items_subject ON archive_items USING GIN(subject);
-- Faster contains lookups when using @>
CREATE INDEX IF NOT EXISTS idx_archive_items_subject_path ON archive_items USING GIN(subject jsonb_path_ops);

-- Track item click counts (open/download interactions)
CREATE TABLE IF NOT EXISTS item_clicks (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(1000) UNIQUE NOT NULL,
    click_count BIGINT DEFAULT 0,
    last_clicked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_clicks_count ON item_clicks(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_item_clicks_last_clicked ON item_clicks(last_clicked DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_archive_items_updated_at 
    BEFORE UPDATE ON archive_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT count(*) from archive_items;

SELECT identifier, title, description, language, item_size, downloads, btih, mediatype, subject, publicdate, url 
FROM archive_items WHERE mediatype = 'movies' ORDER BY downloads DESC, publicdate DESC LIMIT 20 OFFSET 30000

TRUNCATE TABLE archive_items;
