ALTER TABLE archive_items RENAME TO backup_archive_items;

SELECT count(*) from backup_archive_items

DROP TABLE archive_items

CREATE TABLE archive_items AS
WITH type_counts AS (
    SELECT COUNT(DISTINCT mediatype) AS type_count
    FROM backup_archive_items
),
samples AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY mediatype ORDER BY random()) AS rn,
           (1000000 / (SELECT type_count FROM type_counts))::int AS take_per_type
    FROM backup_archive_items
)
SELECT *
FROM samples
WHERE rn <= take_per_type
LIMIT 1000000;