/**
 * stream_ndjson_regex_processor.js
 *
 * High-performance NDJSON processor:
 * - Uses regex to extract fields (no JSON.parse in the hot-path)
 * - Uses Map for counters (low GC pressure)
 * - Streaming + checkpointing by line number (resumable)
 * - Skips files with basename starting "scrape_audio_v1"
 * - Writes languages.json, subjects.json, years.json with entries having count >= MIN_COUNT
 *
 * Caveat: regex is intentionally simple/fast. It handles the common forms:
 *   "language":"English"
 *   "subject":["A","B"]  OR "subject":"Topic"
 *   "publicdate":"2021-03-10T00:00:00Z"
 *
 * For complex/invalid lines the script will try a fallback parse for just the subject extraction.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');
const process = require('process');

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_CHECKPOINT_FILE = path.join(__dirname, '.ndjson_regex_checkpoints.json');
const DEFAULT_CHECKPOINT_INTERVAL = 50000; // lines
const DEFAULT_LOG_INTERVAL_MS = 15000;
const DEFAULT_MIN_COUNT = 1000;

// === CLI args ===
const argv = process.argv.slice(2);
const args = {};
argv.forEach(a => {
    const [k, v] = a.split('=');
    if (k.startsWith('--')) args[k.replace(/^--/, '')] = v || true;
});

const concurrency = parseInt(args.concurrency || DEFAULT_CONCURRENCY, 10);
const CHECKPOINT_FILE = args.checkpointFile || DEFAULT_CHECKPOINT_FILE;
const checkpointInterval = parseInt(args.checkpointInterval || DEFAULT_CHECKPOINT_INTERVAL, 10);
const logIntervalMs = parseInt(args.logIntervalMs || DEFAULT_LOG_INTERVAL_MS, 10);
const MIN_COUNT = parseInt(args.min || DEFAULT_MIN_COUNT, 10);

// === Files to process (edit or pass via --files) ===
let inputFiles = [
    path.join(__dirname, 'scrape_audio_v1.ndjson'),
    path.join(__dirname, 'scrape_image_v1.ndjson'),
    path.join(__dirname, 'scrape_movies_v1.ndjson'),
    path.join(__dirname, 'scrape_software_v1.ndjson'),
    path.join(__dirname, 'scrape_text_v1.ndjson'),
];

if (args.files) {
    inputFiles = args.files.split(',').map(f => (path.isAbsolute(f) ? f : path.join(__dirname, f)));
}

// === outputs ===
const languagesFile = path.join(__dirname, 'languages.json');
const subjectsFile = path.join(__dirname, 'subjects.json');
const yearsFile = path.join(__dirname, 'years.json');

// === counters as Maps (low GC) ===
const languageCounts = new Map();
const subjectCounts = new Map();
const yearCounts = new Map();

// checkpoint structure: { files: { "<filePath>": { lastProcessedLine: N, processed: bool } }, global: { totalItems: N } }
let checkpoint = { files: {}, global: { totalItems: 0 } };

// === fast regexes (precompiled) ===
// language: "language":"English"  (captures English)
const reLanguage = /"language"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i;

// publicdate: "publicdate":"2021-03-10T02:06:08Z"
const rePublicdate = /"publicdate"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i;

// subject: either "subject":"Topic" OR "subject":[ ... ] (capture the array or the string)
const reSubject = /"subject"\s*:\s*(\[[^\]]*\]|"[^"\\]*(?:\\.[^"\\]*)*")/i;

// simple string unescape for common sequences (fast)
function unescapeSimpleQuoted(s) {
    // s arrives without surrounding quotes for our use, but if it has \" we replace
    // this function is intentionally minimal — handles \" \\ \/ \n \r \t \b \f and unicode \uXXXX
    try {
        // Use JSON.parse on a quoted string to safely unescape; this is fine for small substrings.
        return JSON.parse('"' + s.replace(/(^")|("$)/g, '') + '"');
    } catch (e) {
        // fallback minimal replacements
        return s.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }
}

// robust subject parser for the captured subject token (fast-path handles normal arrays/strings)
function parseSubjectToken(token) {
    if (!token) return null;
    token = token.trim();
    if (token[0] === '"') {
        // "Topic"
        const inner = token.slice(1, -1);
        const val = unescapeSimpleQuoted(inner);
        return [val];
    } else if (token[0] === '[') {
        // [ "A", "B" ]  or ["A","B"]
        // We will extract strings quickly using regex to avoid JSON.parse on common cases
        const items = [];
        // match "..." items inside array (doesn't support nested arrays/objects)
        const reItem = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        let m;
        while ((m = reItem.exec(token)) !== null) {
            const val = unescapeSimpleQuoted(m[1]);
            items.push(val);
        }
        // If no items found, attempt full JSON.parse fallback
        if (items.length === 0) {
            try {
                const parsed = JSON.parse(token);
                if (Array.isArray(parsed)) {
                    return parsed.map(x => (x == null ? '' : String(x)));
                }
            } catch (e) {
                return null;
            }
        }
        return items;
    } else {
        // Unknown token shape — try fallback JSON.parse
        try {
            const parsed = JSON.parse(token);
            if (Array.isArray(parsed)) return parsed.map(x => (x == null ? '' : String(x)));
            if (typeof parsed === 'string') return [parsed];
        } catch (e) {
            return null;
        }
    }
}

// === checkpoint helpers ===
function loadCheckpoint() {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        try {
            const raw = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
            checkpoint = JSON.parse(raw);
            console.log(`🔄 Loaded checkpoint: ${CHECKPOINT_FILE}`);
        } catch (e) {
            console.warn('⚠️ Failed to load checkpoint, starting fresh.');
        }
    }
}

function saveCheckpointAsync() {
    // coalesce writes by writing serialized string once
    try {
        const data = JSON.stringify(checkpoint, null, 2);
        fs.writeFile(CHECKPOINT_FILE, data, err => {
            if (err) console.error('❌ Failed to save checkpoint:', err);
        });
    } catch (e) {
        console.error('❌ Failed to serialize checkpoint:', e);
    }
}

function saveCheckpointSync() {
    try {
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), 'utf8');
    } catch (e) {
        console.error('❌ Failed to write checkpoint sync:', e);
    }
}

function mem() {
    const m = process.memoryUsage();
    return `RSS ${(m.rss/1024/1024).toFixed(1)}MB Heap ${(m.heapUsed/1024/1024).toFixed(1)}MB`;
}

// === file processing ===
function processFile(filePath) {
    return new Promise((resolve, reject) => {
        const base = path.basename(filePath);

        // skip any scrape_audio_v1*
        // if (base.startsWith('scrape_audio_v1')) {
        //     console.log(`⏭️ Skipping file (per rule): ${base}`);
        //     return resolve({ skipped: true });
        // }

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Missing: ${filePath}`);
            return resolve({ missing: true });
        }

        console.log(`📄 Starting: ${base}`);

        const stat = fs.statSync(filePath);
        const totalBytes = stat.size;

        const cpEntry = checkpoint.files[filePath] || { lastProcessedLine: 0, processed: false };
        const resumeLine = cpEntry.lastProcessedLine || 0;

        let currentLine = 0;
        let processedThisRun = 0;
        let lastLog = Date.now();

        const rs = fs.createReadStream(filePath, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

        rl.on('line', (line) => {
            currentLine++;
            if (currentLine <= resumeLine) return; // skip already processed lines quickly

            if (!line || !line.trim()) {
                // nothing
            } else {
                // hot-path: extract with regex (no JSON.parse)
                // Extract language
                const langMatch = reLanguage.exec(line);
                if (langMatch && langMatch[1]) {
                    const rawLang = langMatch[1];
                    // fast unescape using JSON (safe for short substrings)
                    let lang;
                    try {
                        lang = JSON.parse('"' + rawLang.replace(/"/g, '\\"') + '"');
                    } catch (e) {
                        lang = rawLang;
                    }
                    if (lang && lang !== 'Unknown') {
                        languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
                    }
                }

                // Extract subject token
                const subjMatch = reSubject.exec(line);
                if (subjMatch && subjMatch[1]) {
                    const token = subjMatch[1];
                    const arr = parseSubjectToken(token);
                    if (Array.isArray(arr)) {
                        for (const s of arr) {
                            if (!s) continue;
                            if (s === 'Unknown') continue;
                            subjectCounts.set(s, (subjectCounts.get(s) || 0) + 1);
                        }
                    }
                }

                // Extract publicdate -> year
                const pdMatch = rePublicdate.exec(line);
                if (pdMatch && pdMatch[1]) {
                    const rawDate = pdMatch[1].trim();
                    // Fast year-only extract for ISO-like strings: starts with YYYY
                    const yearMatch = /^(\d{4})/.exec(rawDate);
                    if (yearMatch) {
                        const y = parseInt(yearMatch[1], 10);
                        if (!Number.isNaN(y)) {
                            yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
                        }
                    } else {
                        // fallback: attempt Date parse but rarely happens
                        const dt = new Date(rawDate);
                        if (!isNaN(dt.getTime())) {
                            const y = dt.getFullYear();
                            yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
                        }
                    }
                }
            }

            processedThisRun++;
            checkpoint.global.totalItems = (checkpoint.global.totalItems || 0) + 1;
            checkpoint.files[filePath] = { lastProcessedLine: currentLine, processed: false };

            // periodic checkpoint flush by lines
            if (processedThisRun % checkpointInterval === 0) {
                saveCheckpointAsync();
            }

            const now = Date.now();
            if (now - lastLog > logIntervalMs) {
                lastLog = now;
                const pct = totalBytes > 0 ? ((rs.bytesRead / totalBytes) * 100).toFixed(2) : '0.00';
                console.log(`   ${base}: line ${currentLine} — ${pct}% — ${mem()}`);
            }
        });

        rl.on('close', () => {
            checkpoint.files[filePath] = { lastProcessedLine: currentLine, processed: true, processedAt: new Date().toISOString() };
            saveCheckpointSync();
            console.log(`   ✅ Finished: ${base} (${currentLine} lines)`);
            resolve({ file: filePath, lines: currentLine });
        });

        rl.on('error', (err) => {
            saveCheckpointSync();
            console.error('❌ Readline error:', err);
            reject(err);
        });

        rs.on('error', (err) => {
            saveCheckpointSync();
            console.error('❌ Readstream error:', err);
            reject(err);
        });
    });
}

// Simple promise pool
function promisePool(tasks, limit) {
    let i = 0;
    const results = [];
    const workers = new Array(Math.min(limit, tasks.length)).fill(0).map(async () => {
        while (i < tasks.length) {
            const idx = i++;
            try {
                results[idx] = await tasks[idx]();
            } catch (e) {
                results[idx] = { error: e };
            }
        }
    });
    return Promise.all(workers).then(() => results);
}

// Atomic write helper
function atomicWrite(file, data) {
    const tmp = `${file}.tmp-${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, file);
}

// === MAIN ===
(async () => {
    console.log('🟢 NDJSON regex processor starting');
    console.log(`   Concurrency: ${concurrency} | Checkpoint interval: ${checkpointInterval} lines | Min count: ${MIN_COUNT}`);
    console.log('');

    loadCheckpoint();

    // build tasks skipping missing files
    const tasks = [];
    for (const f of inputFiles) {
        tasks.push(() => processFile(f));
    }

    await promisePool(tasks, concurrency);

    // finalize: filter by MIN_COUNT and write outputs
    console.log('\n🧮 Finalizing — applying frequency filter');

    const languages = Array.from(languageCounts.entries())
        .filter(([, c]) => c >= MIN_COUNT)
        .map(([k]) => k)
        .sort();

    const subjects = Array.from(subjectCounts.entries())
        .filter(([, c]) => c >= MIN_COUNT)
        .map(([k]) => k)
        .sort();

    const years = Array.from(yearCounts.entries())
        .filter(([, c]) => c >= MIN_COUNT)
        .map(([k]) => Number(k))
        .sort((a,b) => b - a);

    atomicWrite(languagesFile, languages);
    atomicWrite(subjectsFile, subjects);
    atomicWrite(yearsFile, years);

    console.log(`\n📦 Output written:`);
    console.log(`   Languages (${languages.length}) -> ${languagesFile}`);
    console.log(`   Subjects  (${subjects.length}) -> ${subjectsFile}`);
    console.log(`   Years     (${years.length}) -> ${yearsFile}`);
    console.log(`\n📊 Total lines processed (approx): ${checkpoint.global.totalItems || 0}`);
    console.log(`💾 Final memory: ${mem()}`);
    console.log('🎉 Done.');
})();
