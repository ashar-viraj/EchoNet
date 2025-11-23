-- PostgreSQL schema for filter tables (languages, subjects, years)
-- Run this script to create the filter tables

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create years table
CREATE TABLE IF NOT EXISTS years (
    id SERIAL PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_languages_name ON languages(name);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_years_year ON years(year DESC);

-- Add comments for documentation
COMMENT ON TABLE languages IS 'Stores all unique languages found in archive items';
COMMENT ON TABLE subjects IS 'Stores all unique subjects found in archive items';
COMMENT ON TABLE years IS 'Stores all unique years found in archive items publicdate field';

-- Refresh helper to repopulate filter tables from archive_items
CREATE OR REPLACE FUNCTION refresh_filter_tables()
RETURNS void AS $$
BEGIN
    TRUNCATE languages, subjects, years;

    INSERT INTO languages(name)
    SELECT DISTINCT LOWER(language)
    FROM archive_items
    WHERE language IS NOT NULL AND language <> ''
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO subjects(name)
    SELECT DISTINCT subject_text
    FROM (
        SELECT jsonb_array_elements_text(subject) AS subject_text
        FROM archive_items
        WHERE subject IS NOT NULL AND jsonb_typeof(subject) = 'array'
        UNION
        SELECT subject::text AS subject_text
        FROM archive_items
        WHERE subject IS NOT NULL AND jsonb_typeof(subject) = 'string'
    ) sub
    WHERE subject_text IS NOT NULL AND subject_text <> ''
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO years(year)
    SELECT DISTINCT EXTRACT(YEAR FROM publicdate)::int
    FROM archive_items
    WHERE publicdate IS NOT NULL
    ON CONFLICT (year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_filter_tables() IS 'Rebuilds languages/subjects/years lookup tables from archive_items. Run during off-peak hours.';
