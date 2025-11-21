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

