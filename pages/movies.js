import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./_app";
import ContactUs from "@/components/ContactUs";

export default function MoviesPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState({ languages: [], subjects: [], years: [] });
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [lowData, setLowData] = useState(false);
  const perPage = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(perPage), ...(search ? { search } : {}) });
    Object.keys(filters).forEach((k) => {
      const v = filters[k];
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) v.forEach((val) => p.append(k, val));
      else p.append(k, v);
    });

    try {
      const res = await fetch(`/api/content/movies?${p.toString()}`);
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
  }, [filters, page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    try { setLowData(localStorage.getItem("lowData") === "true"); } catch { }
  }, []);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

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

  const recordClick = async (identifier) => {
    if (!identifier) return;
    try {
      await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
    } catch (err) {
      console.warn('Click track failed', err);
    }
  };

  const openLink = async (url, identifier) => {
    if (!url) return;
    await recordClick(identifier);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const goToPage = () => {
    const nextPage = parseInt(pageInput, 10);
    if (Number.isNaN(nextPage)) return;
    const maxPage = Math.max(1, totalPages || 1);
    const clamped = Math.min(Math.max(1, nextPage), maxPage);
    setPage(clamped);
  };

  return (
    <div className="min-h-screen theme-rustic text-rustic-dark flex flex-col">
      <header className="bg-rustic-translucent border-b border-rustic shadow sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/echonet-logo.svg"
              alt="EchoNet"
              width={128}
              height={40}
              className="w-32 h-auto drop-shadow"
              priority
            />
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-rustic-muted">EchoNet</p>
              <p className="text-xl font-semibold text-gradient-rustic leading-none">Library for Everyone</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-rustic-muted">
            <Link href="/text" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Books</Link>
            <Link href="/image" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Image</Link>
            <Link href="/movies" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Movies</Link>
            <Link href="/audio" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Audio</Link>
            <Link href="/software" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Software</Link>
            {authLoading ? null : user ? (
              <>
                <span className="text-rustic-dark/80">Hi, {user.name || user.email}</span>
                <Link href="/profile" className="text-gradient-rustic hover:opacity-80 transition">Profile</Link>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    refresh();
                  }}
                  className="text-rustic-muted hover:text-rustic-dark underline underline-offset-4"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className="text-rustic-muted hover:text-rustic-dark underline underline-offset-4">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-80 space-y-4">
            <div className="bg-rustic-card border border-rustic rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-[0.08em] text-rustic-dark">Filters</h3>
                <span className="text-[11px] px-2 py-1 rounded-full bg-white/70 border border-rustic text-rustic-muted">Movies</span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wide text-rustic-muted">Title / Description</label>
                <input
                  className="w-full px-3 py-2 bg-white/85 border border-rustic rounded-lg text-sm text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:border-rustic focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                  placeholder="Search..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />

                <label className="block text-xs uppercase tracking-wide text-rustic-muted">Language</label>
                <select
                  className="w-full px-3 py-2 bg-white/85 border border-rustic rounded-lg text-sm text-rustic-dark focus:outline-none focus:border-rustic focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                  value={filters.language || ''}
                  onChange={e => changeFilter('language', e.target.value || null)}
                >
                  <option value="">All</option>
                  {availableFilters.languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>

                <label className="block text-xs uppercase tracking-wide text-rustic-muted">Year</label>
                <select
                  className="w-full px-3 py-2 bg-white/85 border border-rustic rounded-lg text-sm text-rustic-dark focus:outline-none focus:border-rustic focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                  value={filters.year || ''}
                  onChange={e => changeFilter('year', e.target.value || null)}
                >
                  <option value="">All</option>
                  {availableFilters.years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>

                <label className="block text-xs uppercase tracking-wide text-rustic-muted">Subjects</label>
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
                        className={`px-3 py-1.5 text-xs rounded-full border transition ${sel
                            ? 'bg-gradient-rustic text-white border border-rustic shadow-sm'
                            : 'bg-white/85 border border-rustic text-rustic-dark hover:bg-rustic-card'
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
                  className="flex-1 px-3 py-2 rounded-lg border border-rustic text-rustic-dark bg-white/80 hover:bg-rustic-card transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => fetchData()}
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-rustic text-white font-semibold hover:opacity-90 transition shadow"
                >
                  Apply
                </button>
              </div>
            </div>
          </aside>

          <section className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-rustic-muted">Library</p>
                <h1 className="text-3xl font-semibold text-rustic-dark text-gradient-rustic">Movies</h1>
                <div className="text-sm text-rustic-muted mt-1">Found {total} items</div>
              </div>
              <div>
                <select
                  value={filters.sort || ""}
                  onChange={(e) => changeFilter("sort", e.target.value)}
                  className="px-3 py-2 bg-white/85 border border-rustic rounded-lg text-sm text-rustic-dark focus:border-rustic focus:ring-1 focus:ring-[rgba(139,69,19,0.35)] focus:outline-none"
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
                  <div key={idx} className="p-5 bg-rustic-card border border-rustic rounded-2xl animate-pulse">
                    <div className="h-4 w-1/3 bg-white/60 rounded mb-2"></div>
                    <div className="h-3 w-2/3 bg-white/60 rounded mb-4"></div>
                    <div className="h-3 w-1/2 bg-white/60 rounded"></div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 bg-rustic-card border border-rustic rounded-2xl text-rustic-muted">
                No items. Try adjusting filters.
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {items.map((it, i) => (
                  <div key={`${it.identifier}-${i}`} className="p-5 bg-rustic-card border border-rustic rounded-2xl hover:shadow-lg transition">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div
                          className="font-semibold text-lg text-rustic-dark truncate"
                          title={it.title || 'Untitled'}
                        >
                          {it.title || 'Untitled'}
                        </div>
                        <div
                          className="text-sm text-rustic-dark/80 line-clamp-2"
                          title={lowData ? (it.language || "N/A") : (it.description || "No description")}
                        >
                          {lowData ? (it.language || "N/A") : (it.description || "No description")}
                        </div>
                        <div className="mt-2 text-xs text-rustic-muted flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-full bg-white/80 border border-rustic">Lang: {it.language || 'N/A'}</span>
                          <span className="px-2 py-1 rounded-full bg-white/80 border border-rustic">Downloads: {it.downloads || 0}</span>
                          <span className="px-2 py-1 rounded-full bg-white/80 border border-rustic">Size: {fmtSize(it.item_size)}</span>
                        </div>
                      </div>

                      {it.url && (
                        <button
                          className="text-gradient-rustic text-sm font-semibold hover:opacity-80"
                          onClick={() => openLink(it.url, it.identifier)}
                        >
                          Open
                        </button>
                      )}
                    </div>

                    <div className="mt-4">
                      {it.url && (
                        <button
                          onClick={() => openLink(it.url, it.identifier)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-rustic text-white rounded-lg text-sm font-semibold hover:opacity-90 transition shadow"
                        >
                          Download for Offline Access
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between text-sm text-rustic-muted gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span>Page {page} / {totalPages}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && goToPage()}
                    className="w-20 px-3 py-2 rounded-lg bg-white/85 border border-rustic focus:border-rustic focus:ring-1 focus:ring-[rgba(139,69,19,0.35)] focus:outline-none text-rustic-dark"
                    aria-label="Go to page"
                  />
                  <button
                    onClick={goToPage}
                    className="px-3 py-2 rounded-lg bg-gradient-rustic text-white font-semibold hover:opacity-90 transition shadow"
                  >
                    Go
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg border border-rustic bg-white/85 hover:bg-rustic-card disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg border border-rustic bg-white/85 hover:bg-rustic-card disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ContactUs />

      <footer className="bg-rustic-translucent border-t border-rustic py-6 text-center text-rustic-muted relative z-10">
        Access for all - EchoNet {new Date().getFullYear()}
      </footer>
    </div>
  );
}
