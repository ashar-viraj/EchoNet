# import_to_db.py
"""
Robust NDJSON -> Postgres importer.

Fixes:
 - Uses SAVEPOINT per row so a single bad row doesn't abort the whole transaction.
 - Sanitizes inputs and truncates fields to column limits.
 - Uses psycopg2.extras.Json for JSONB binding.
 - Improved publicdate parsing with several fallbacks.
 - Periodic commits and clear logging.
"""

import os
import sys
import json
import logging
from datetime import datetime
from tqdm import tqdm
import psycopg2
import psycopg2.extras

# ---------- CONFIG ----------
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': '13241324',
    'database': 'echonet'
}

# commit after this many successful rows
COMMIT_BATCH = 500

# Column size limits (match your SQL schema)
MAX_IDENTIFIER = 10000
MAX_LANGUAGE = 1000
MAX_BTIH = 128
MAX_MEDIATYPE = 50

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# ---------- Helpers ----------
def safe_truncate(val, max_len):
    if val is None:
        return None
    s = str(val)
    if len(s) > max_len:
        return s[:max_len]
    return s

def parse_publicdate(date_str):
    """Attempt to parse many common date formats; return datetime or None."""
    if not date_str or date_str == 'Unknown':
        return None
    # If already a datetime
    if isinstance(date_str, datetime):
        return date_str
    s = str(date_str).strip()
    if not s:
        return None
    # Try ISO first (handles "2021-12-06T02:06:08Z" and offsets)
    try:
        if 'T' in s:
            # fromisoformat doesn't accept 'Z', convert it
            s2 = s.replace('Z', '+00:00')
            return datetime.fromisoformat(s2)
        return datetime.fromisoformat(s)
    except Exception:
        pass
    # Try a few common formats
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d %b %Y",
        "%d %B %Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt)
        except Exception:
            continue
    # Last resort: try to parse only the year
    try:
        if len(s) == 4 and s.isdigit():
            return datetime(int(s), 1, 1)
    except Exception:
        pass
    logger.debug(f"parse_publicdate: could not parse '{date_str}'")
    return None

def normalize_subject(subject):
    """Return a Python object suitable for JSONB (list or None)."""
    if subject is None or subject == 'Unknown':
        return None
    # If already a list or dict - return directly
    if isinstance(subject, (list, dict)):
        return subject
    # If string that looks like JSON, try parse
    if isinstance(subject, str):
        s = subject.strip()
        # Try json decode
        try:
            decoded = json.loads(s)
            return decoded
        except Exception:
            # otherwise wrap string in single-element array
            return [s]
    # Other types: coerce to string inside an array
    return [str(subject)]

def extract_identifier(item):
    """Try to extract identifier; also handle archive.org URLs."""
    identifier = item.get('identifier')
    if identifier and identifier != 'Unknown':
        return str(identifier)
    url = item.get('url', '')
    if isinstance(url, str) and 'archive.org/details/' in url:
        candidate = url.split('archive.org/details/')[-1].split('/')[0]
        if candidate:
            return candidate
    return None

# ---------- DB functions ----------
def connect_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        # use server-side prepared cursor support for performance if needed
        return conn
    except psycopg2.Error as e:
        logger.error(f"Error connecting to database: {e}")
        sys.exit(1)

INSERT_SQL = """
INSERT INTO archive_items 
(identifier, title, description, language, item_size, downloads, btih, 
 mediatype, subject, publicdate, url)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (identifier) 
DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    language = EXCLUDED.language,
    item_size = EXCLUDED.item_size,
    downloads = EXCLUDED.downloads,
    btih = EXCLUDED.btih,
    mediatype = EXCLUDED.mediatype,
    subject = EXCLUDED.subject,
    publicdate = EXCLUDED.publicdate,
    url = EXCLUDED.url,
    updated_at = CURRENT_TIMESTAMP
"""

def insert_item(conn, cursor, item):
    """
    Insert a single item using a SAVEPOINT so that a failure here won't abort the
    whole transaction. Returns True if inserted/updated, False if skipped due to
    missing identifier, or raises for unexpected errors.
    """
    # create a local savepoint for this row
    cursor.execute("SAVEPOINT before_row;")
    try:
        identifier = extract_identifier(item)
        if not identifier:
            # Nothing to do
            cursor.execute("ROLLBACK TO SAVEPOINT before_row;")
            cursor.execute("RELEASE SAVEPOINT before_row;")
            return False

        # sanitize/truncate fields
        identifier = safe_truncate(identifier, MAX_IDENTIFIER)
        title = item.get('title')
        title = None if title in (None, 'Unknown') else str(title)
        description = item.get('description')
        description = None if description in (None, 'Unknown') else str(description)
        language = item.get('language')
        language = None if language in (None, 'Unknown') else safe_truncate(language, MAX_LANGUAGE)
        # item_size: coerce to int (or 0)
        try:
            item_size = item.get('item_size', 0) or 0
            item_size = int(item_size)
        except Exception:
            item_size = 0
        # downloads
        try:
            downloads = item.get('downloads', 0) or 0
            downloads = int(downloads)
        except Exception:
            downloads = 0
        btih = item.get('btih')
        btih = None if btih in (None, 'Unknown') else safe_truncate(btih, MAX_BTIH)
        mediatype = item.get('mediatype')
        mediatype = None if mediatype in (None, 'Unknown') else safe_truncate(mediatype, MAX_MEDIATYPE)
        subject_obj = normalize_subject(item.get('subject'))
        publicdate = parse_publicdate(item.get('publicdate'))
        url = item.get('url')
        url = None if url in (None, 'Unknown') else str(url)

        # Use psycopg2.extras.Json for JSONB column
        subject_param = psycopg2.extras.Json(subject_obj) if subject_obj is not None else None

        cursor.execute(INSERT_SQL, (
            identifier, title, description, language, item_size, downloads,
            btih, mediatype, subject_param, publicdate, url
        ))
        # release savepoint on success
        cursor.execute("RELEASE SAVEPOINT before_row;")
        return True

    except psycopg2.Error as e:
        # Roll back only to this savepoint, not whole transaction
        try:
            cursor.execute("ROLLBACK TO SAVEPOINT before_row;")
            cursor.execute("RELEASE SAVEPOINT before_row;")
        except Exception:
            # If release fails, attempt full rollback to keep connection usable
            conn.rollback()
        # Log detailed diagnostics
        logger.warning("DB error inserting identifier=%s: %s", item.get('identifier', '<missing>'), e.pgerror or str(e))
        # Optionally, log the row data for offline inspection (avoid huge logs)
        logger.debug("Failed row (truncated): %s", json.dumps(item)[:1000])
        return False

# ---------- File import logic ----------
def import_ndjson_file(file_path, conn):
    if not os.path.exists(file_path):
        logger.error("File not found: %s", file_path)
        return 0

    logger.info("Importing %s", file_path)
    inserted = 0
    skipped = 0
    errors = 0
    cursor = conn.cursor()

    # Count lines for progress bar
    with open(file_path, 'r', encoding='utf-8') as f:
        total_lines = sum(1 for _ in f)

    # Re-open and process
    with open(file_path, 'r', encoding='utf-8') as f:
        with tqdm(total=total_lines, desc="Processing", unit="items") as pbar:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    pbar.update(1)
                    continue
                try:
                    item = json.loads(line)
                except json.JSONDecodeError as e:
                    logger.warning("JSON decode error in %s line %d: %s", file_path, line_num, e)
                    errors += 1
                    pbar.update(1)
                    continue

                try:
                    ok = insert_item(conn, cursor, item)
                    if ok:
                        inserted += 1
                    else:
                        skipped += 1
                except Exception as e:
                    # Shouldn't normally reach here since insert_item handles db errors,
                    # but catch anything unexpected:
                    logger.exception("Unexpected error processing %s line %d: %s", file_path, line_num, e)
                    errors += 1
                    # ensure DB connection is usable
                    try:
                        conn.rollback()
                        cursor = conn.cursor()
                    except Exception:
                        logger.error("Connection unusable after error; aborting file import.")
                        break

                # Commit periodically
                if (inserted + skipped) % COMMIT_BATCH == 0:
                    try:
                        conn.commit()
                        logger.info("Committed %d rows (inserted + skipped)", inserted + skipped)
                    except Exception as e:
                        logger.error("Commit failed: %s", e)
                        conn.rollback()

                pbar.update(1)

    # Final commit
    try:
        conn.commit()
    except Exception as e:
        logger.error("Final commit failed: %s", e)
        conn.rollback()

    cursor.close()
    logger.info("Completed: %d inserted/updated, %d skipped, %d errors", inserted, skipped, errors)
    return inserted

# ---------- Main ----------
def main():
    logger.info("Connecting to database...")
    conn = connect_db()
    logger.info("Connected successfully.")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    ndjson_files = []
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.ndjson') and 'backup' not in file:
                ndjson_files.append(os.path.join(root, file))

    if not ndjson_files:
        logger.info("No NDJSON files found.")
        conn.close()
        return

    logger.info("Found %d NDJSON file(s):", len(ndjson_files))
    for f in ndjson_files:
        logger.info("  - %s", f)

    total_imported = 0
    try:
        for file_path in ndjson_files:
            imported = import_ndjson_file(file_path, conn)
            total_imported += imported
    finally:
        try:
            conn.close()
        except Exception:
            pass

    logger.info("=" * 50)
    logger.info("Import completed! Total items imported: %d", total_imported)
    logger.info("=" * 50)


if __name__ == '__main__':
    main()
