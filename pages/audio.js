// pages/audio.js
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AudioPage() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, search]);

  const fetchData = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(perPage), ...(search ? { search } : {}) });
    Object.keys(filters).forEach((k) => {
      const v = filters[k];
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) v.forEach((val) => p.append(k, val));
      else p.append(k, v);
    });

    try {
      const res = await fetch(`/api/content/audio?${p.toString()}`);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="bg-slate-950/70 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight text-sky-200">EchoNet</Link>
          <nav className="flex items-center gap-4 text-sm text-slate-400">
            <Link href="/text" className="hover:text-sky-200">Text</Link>
            <Link href="/image" className="hover:text-sky-200">Image</Link>
            <Link href="/movies" className="hover:text-sky-200">Movies</Link>
            <Link href="/audio" className="hover:text-sky-200">Audio</Link>
            <Link href="/software" className="hover:text-sky-200">Software</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-80 space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-[0.08em] text-slate-300">Filters</h3>
                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-400">Audio</span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wide text-slate-400">Title / Description</label>
                <input
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  placeholder="Search..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />

                <label className="block text-xs uppercase tracking-wide text-slate-400">Language</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-400"
                  value={filters.language || ''}
                  onChange={e => changeFilter('language', e.target.value || null)}
                >
                  <option value="">All</option>
                  {availableFilters.languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>

                <label className="block text-xs uppercase tracking-wide text-slate-400">Year</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-400"
                  value={filters.year || ''}
                  onChange={e => changeFilter('year', e.target.value || null)}
                >
                  <option value="">All</option>
                  {availableFilters.years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>

                <label className="block text-xs uppercase tracking-wide text-slate-400">Subjects</label>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-auto">
                  {availableFilters.subjects.map((s) => {
                    const sel = Array.isArray(filters.subject) ? filters.subject.includes(s) : filters.subject === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          const cur = Array.isArray(filters.subject) ? filters.subject.slice() : (filters.subject ? [filters.subject] : []);
                          if (cur.includes(s)) cur.splice(cur.indexOf(s), 1); else cur.push(s);
                          changeFilter('subject', cur.length ? cur : null);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-full border transition ${
                          sel
                            ? 'bg-sky-500/20 border-sky-400 text-sky-100'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => { setFilters({}); setSearch(''); setPage(1); }}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-slate-500 transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => fetchData()}
                  className="flex-1 px-3 py-2 rounded-lg bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </aside>

          <section className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Library</p>
                <h1 className="text-3xl font-semibold text-slate-50">Audio</h1>
                <div className="text-sm text-slate-400 mt-1">Found {total} items</div>
              </div>
              <div>
                <select
                  value={filters.sort || ""}
                  onChange={(e) => changeFilter("sort", e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Sort By</option>
                  <option value="downloads_desc">Downloads (High to Low)</option>
                  <option value="downloads_asc">Downloads (Low to High)</option>
                  <option value="year_desc">Year (Newest First)</option>
                  <option value="year_asc">Year (Oldest First)</option>
                  <option value="size_desc">Size (Large to Small)</option>
                  <option value="size_asc">Size (Small to Large)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl animate-pulse">
                    <div className="h-4 w-1/3 bg-slate-800 rounded mb-2"></div>
                    <div className="h-3 w-2/3 bg-slate-800 rounded mb-4"></div>
                    <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl text-slate-300">
                No items. Try adjusting filters.
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {items.map((it, i) => (
                  <div key={`${it.identifier}-${i}`} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl hover:border-sky-500/60 transition">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div
                          className="font-semibold text-lg text-slate-50 truncate"
                          title={it.title || 'Untitled'}
                        >
                          {it.title || 'Untitled'}
                        </div>
                        <div
                          className="text-sm text-slate-400 line-clamp-2"
                          title={lowData ? (it.language || "N/A") : (it.description || "No description")}
                        >
                          {lowData ? (it.language || "N/A") : (it.description || "No description")}
                        </div>
                        <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-4">
                          <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">Lang: {it.language || 'N/A'}</span>
                          <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">Downloads: {it.downloads || 0}</span>
                          <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">Size: {fmtSize(it.item_size)}</span>
                        </div>
                      </div>

                      {it.url && (
                        <a
                          className="text-sky-300 text-sm font-medium hover:text-sky-200"
                          href={it.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      )}
                    </div>

                    <div className="mt-4">
                      {it.url && (
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-sky-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-sky-400 transition"
                        >
                          Download for Offline Learning
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between text-sm text-slate-400">
              <div>Page {page} / {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
