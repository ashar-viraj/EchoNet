// pages/image.js
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ImagesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState({ languages: [], subjects: [], years: [] });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [lowData, setLowData] = useState(false);
  const perPage = 20;

  useEffect(() => {
    try { setLowData(localStorage.getItem("lowData") === "true"); } catch {}
    fetchData();
  }, [page, filters, search]);

  const fetchData = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: page.toString(), limit: perPage.toString(), ...(search && { search }) });
    Object.keys(filters).forEach((k) => {
      const v = filters[k];
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) v.forEach((val) => p.append(k, val));
      else p.append(k, v);
    });

    try {
      const res = await fetch(`/api/content/image?${p.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      if (data.filters) setAvailableFilters(data.filters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (identifier) => {
    window.location.href = `/view/${encodeURIComponent(identifier)}`;
  };

  const changeFilter = (k, v) => {
    setFilters((prev) => {
      const n = { ...prev };
      if (v === "" || v === null || (Array.isArray(v) && v.length === 0)) delete n[k];
      else n[k] = v;
      setPage(1);
      return n;
    });
  };

  const fmtSize = (b) => {
    if (!b) return "N/A";
    if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(2)} GB`;
    if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(2)} MB`;
    if (b >= 1024) return `${Math.round(b / 1024)} KB`;
    return `${b} B`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">EchoNet</Link>
          <nav className="space-x-4 text-gray-300">
            <Link href="/text">Text</Link>
            <Link href="/image">Image</Link>
            <Link href="/movies">Movies</Link>
            <Link href="/audio">Audio</Link>
            <Link href="/software">Software</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-80 bg-gray-800 border border-gray-700 rounded p-4">
            <h3 className="font-semibold mb-3">Filters</h3>

            <label className="text-sm text-gray-300">Title search</label>
            <input className="w-full px-3 py-2 mt-1 mb-3 bg-gray-700 border border-gray-600 rounded text-white"
                   value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />

            <label className="text-sm text-gray-300">Language</label>
            <select className="w-full px-3 py-2 mt-1 mb-3 bg-gray-700 border border-gray-600 rounded"
                    value={filters.language || ''} onChange={e => changeFilter('language', e.target.value || null)}>
              <option value="">All</option>
              {availableFilters.languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <label className="text-sm text-gray-300">Year</label>
            <select className="w-full px-3 py-2 mt-1 mb-3 bg-gray-700 border border-gray-600 rounded"
                    value={filters.year || ''} onChange={e => changeFilter('year', e.target.value || null)}>
              <option value="">All</option>
              {availableFilters.years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <label className="text-sm text-gray-300">Subjects</label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-auto">
              {availableFilters.subjects.slice(0, 60).map(s => {
                const sel = Array.isArray(filters.subject) ? filters.subject.includes(s) : filters.subject === s;
                return (
                  <button key={s} onClick={() => {
                    const cur = Array.isArray(filters.subject) ? filters.subject.slice() : (filters.subject ? [filters.subject] : []);
                    if (cur.includes(s)) cur.splice(cur.indexOf(s), 1); else cur.push(s);
                    changeFilter('subject', cur.length ? cur : null);
                  }}
                          className={`px-2 py-1 text-xs rounded ${sel ? 'bg-cyan-600 text-black' : 'bg-gray-700 text-gray-200'}`}>
                    {s}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => { setFilters({}); setSearch(''); setPage(1); }} className="px-3 py-2 bg-gray-700 rounded text-gray-200">Clear</button>
              <button onClick={() => fetchData()} className="px-3 py-2 bg-cyan-600 rounded text-black">Apply</button>
            </div>
          </aside>

          <section className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Images</h1>
              <div className="text-sm text-gray-400">Found {total}</div>
            </div>

            {/* sort */}
            <div className="mb-4 flex justify-end">
              <select
                value={filters.sort || ""}
                onChange={(e) => changeFilter("sort", e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              >
                <option value="">Sort By</option>
                <option value="downloads_desc">Downloads (High → Low)</option>
                <option value="downloads_asc">Downloads (Low → High)</option>
                <option value="year_desc">Year (Newest → Oldest)</option>
                <option value="year_asc">Year (Oldest → Newest)</option>
                <option value="size_desc">Size (Large → Small)</option>
                <option value="size_asc">Size (Small → Large)</option>
              </select>
            </div>

            {loading ? (
              <div className="p-6 bg-gray-800 border border-gray-700 rounded">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-6 bg-gray-800 border border-gray-700 rounded">No items. Try adjusting filters.</div>
            ) : (
              <div className="grid gap-4">
                {items.map((it, i) => (
                  <div key={`${it.identifier}-${i}`} className="p-4 bg-gray-800 border border-gray-700 rounded">
                    <div className="flex justify-between">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{it.title}</div>
                        {!lowData ? (
                          <div className="text-sm text-gray-400 truncate">{it.description}</div>
                        ) : (
                          <div className="text-sm text-gray-400 truncate line-clamp-1">{it.language || "N/A"}</div>
                        )}
                        <div className="mt-2 text-xs text-gray-400 flex gap-4">
                          <span>Lang: {it.language || 'N/A'}</span>
                          <span>Downloads: {it.downloads || 0}</span>
                          <span>Size: {fmtSize(it.item_size)}</span>
                        </div>
                      </div>
                      {it.url && <a className="ml-4 text-cyan-300" href={it.url} target="_blank" rel="noreferrer">Open</a>}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {it.url && (
                        <a href={it.url} target="_blank" rel="noopener noreferrer"
                           className="px-3 py-2 bg-green-600 text-black rounded text-sm font-medium">
                          Download for Offline Learning
                        </a>
                      )}

                      <button onClick={() => openDetail(it.identifier)} className="px-3 py-2 border border-gray-600 rounded text-sm text-gray-200">View details</button>

                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">Page {page} / {totalPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-700 rounded">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-gray-700 rounded">Next</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
