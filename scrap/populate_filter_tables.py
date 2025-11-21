"""
Script to populate filter tables (languages, subjects, years) from JSON files.
"""

import json
import os
import sys
import psycopg2
from psycopg2.extras import execute_batch

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': '13241324',
    'database': 'echonet'
}

def connect_db():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def populate_languages(conn, json_file):
    """Populate languages table from JSON file"""
    if not os.path.exists(json_file):
        print(f"⚠️  Languages file not found: {json_file}")
        return 0
    
    print(f"📄 Processing languages from {os.path.basename(json_file)}...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        languages = json.load(f)
    
    if not isinstance(languages, list):
        print("❌ Invalid JSON format: expected array")
        return 0
    
    cursor = conn.cursor()
    inserted = 0
    skipped = 0
    
    # Use INSERT ... ON CONFLICT to handle duplicates
    insert_query = """
        INSERT INTO languages (name)
        VALUES (%s)
        ON CONFLICT (name) DO NOTHING
    """
    
    # Prepare data (filter out None and empty strings)
    language_values = [(lang,) for lang in languages if lang and str(lang).strip()]
    
    if language_values:
        execute_batch(cursor, insert_query, language_values, page_size=1000)
        inserted = cursor.rowcount
        conn.commit()
    
    cursor.close()
    print(f"   ✅ Inserted {inserted} languages, skipped {len(language_values) - inserted} duplicates")
    return inserted

def populate_subjects(conn, json_file):
    """Populate subjects table from JSON file"""
    if not os.path.exists(json_file):
        print(f"⚠️  Subjects file not found: {json_file}")
        return 0
    
    print(f"📄 Processing subjects from {os.path.basename(json_file)}...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        subjects = json.load(f)
    
    if not isinstance(subjects, list):
        print("❌ Invalid JSON format: expected array")
        return 0
    
    cursor = conn.cursor()
    inserted = 0
    skipped = 0
    
    # Use INSERT ... ON CONFLICT to handle duplicates
    insert_query = """
        INSERT INTO subjects (name)
        VALUES (%s)
        ON CONFLICT (name) DO NOTHING
    """
    
    # Prepare data (filter out None and empty strings, truncate to 500 chars)
    subject_values = []
    for subj in subjects:
        if subj and str(subj).strip():
            subj_str = str(subj).strip()[:500]  # Truncate to max length
            subject_values.append((subj_str,))
    
    if subject_values:
        # Process in batches for large files
        batch_size = 1000
        total_inserted = 0
        for i in range(0, len(subject_values), batch_size):
            batch = subject_values[i:i + batch_size]
            execute_batch(cursor, insert_query, batch, page_size=1000)
            total_inserted += cursor.rowcount
            if (i + batch_size) % 10000 == 0:
                print(f"   📊 Processed {i + batch_size} subjects...")
        
        conn.commit()
        inserted = total_inserted
    
    cursor.close()
    print(f"   ✅ Inserted {inserted} subjects, skipped {len(subject_values) - inserted} duplicates")
    return inserted

def populate_years(conn, json_file):
    """Populate years table from JSON file"""
    if not os.path.exists(json_file):
        print(f"⚠️  Years file not found: {json_file}")
        return 0
    
    print(f"📄 Processing years from {os.path.basename(json_file)}...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        years = json.load(f)
    
    if not isinstance(years, list):
        print("❌ Invalid JSON format: expected array")
        return 0
    
    cursor = conn.cursor()
    inserted = 0
    
    # Use INSERT ... ON CONFLICT to handle duplicates
    insert_query = """
        INSERT INTO years (year)
        VALUES (%s)
        ON CONFLICT (year) DO NOTHING
    """
    
    # Prepare data (filter out None and ensure integers)
    year_values = []
    for year in years:
        try:
            year_int = int(year)
            if 1000 <= year_int <= 9999:  # Valid year range
                year_values.append((year_int,))
        except (ValueError, TypeError):
            continue
    
    if year_values:
        execute_batch(cursor, insert_query, year_values, page_size=1000)
        inserted = cursor.rowcount
        conn.commit()
    
    cursor.close()
    print(f"   ✅ Inserted {inserted} years, skipped {len(year_values) - inserted} duplicates")
    return inserted

def main():
    """Main function to populate all filter tables"""
    print("=" * 60)
    print("Populating Filter Tables (languages, subjects, years)")
    print("=" * 60)
    print()
    
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # File paths
    languages_file = os.path.join(script_dir, 'languages.json')
    subjects_file = os.path.join(script_dir, 'subjects.json')
    years_file = os.path.join(script_dir, 'years.json')
    
    # Connect to database
    print("Connecting to database...")
    conn = connect_db()
    print("✅ Connected successfully!\n")
    
    try:
        # Populate each table
        languages_count = populate_languages(conn, languages_file)
        print()
        
        subjects_count = populate_subjects(conn, subjects_file)
        print()
        
        years_count = populate_years(conn, years_file)
        print()
        
        # Summary
        print("=" * 60)
        print("📊 Summary:")
        print(f"   Languages: {languages_count} inserted")
        print(f"   Subjects: {subjects_count} inserted")
        print(f"   Years: {years_count} inserted")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()
        print("\n✅ Database connection closed.")

if __name__ == '__main__':
    main()

