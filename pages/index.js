import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./_app";
import ContactUs from "@/components/ContactUs";

export default function Home() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [topViewed, setTopViewed] = useState([]);
  const [topClicked, setTopClicked] = useState([]);
  const [openViewed, setOpenViewed] = useState(null);
  const [openClicked, setOpenClicked] = useState(null);
  const [topViewedPage, setTopViewedPage] = useState(1);
  const [topClickedPage, setTopClickedPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [lowData, setLowData] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const categories = [
    { name: "Movies", path: "/movies" },
    { name: "Image", path: "/image" },
    { name: "Books", path: "/text" },
    { name: "Audio", path: "/audio" },
    { name: "Software", path: "/software" },
  ];

  useEffect(() => {
    const loadTopViewed = fetch("/api/top-viewed")
      .then((r) => r.json())
      .then((data) => setTopViewed(data.items || []))
      .catch(() => setTopViewed([]));

    const loadTopClicked = fetch("/api/top-clicked")
      .then((r) => r.json())
      .then((data) => setTopClicked(data.items || []))
      .catch(() => setTopClicked([]));

    Promise.allSettled([loadTopViewed, loadTopClicked]).finally(() => setLoading(false));

    try {
      const ld = localStorage.getItem("lowData") === "true";
      setLowData(ld);
    } catch { }
  }, []);

  useEffect(() => {
    setTopViewedPage(1);
    setTopClickedPage(1);
  }, [topViewed.length, topClicked.length]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowSearchResults(true);
    } catch (err) {
      setSearchResults([]);
      setShowSearchResults(true);
      console.warn("Search failed", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const fmt = (n) => {
    if (!n) return 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n;
  };

  const recordClick = async (item) => {
    const { identifier, title, description, language, url } = item || {};
    if (!identifier) return;
    if (!identifier) return;
    try {
      await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, title, description, language, url })
      });
    } catch (err) {
      console.warn('Click track failed', err);
    }
  };

  const openLink = async (url, item) => {
    if (!url) return;
    await recordClick(item);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const slicePage = (items, page) => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  };

  return (
    <div className="relative min-h-screen theme-rustic text-rustic-dark overflow-hidden flex flex-col">
      <header className="bg-rustic-translucent border-b border-rustic sticky top-0 z-20 shadow">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/echonet-logo.svg"
              alt="EchoNet"
              className="w-48 min-w-[12rem] h-auto animate-pop drop-shadow"
            />
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-rustic-muted">EchoNet</p>
              <h1 className="text-3xl font-bold text-gradient-rustic leading-none">Library for Everyone</h1>
            </div>
          </div>
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

      {/* Mission Banner + Search */}
      <section className="container mx-auto px-6 py-8 relative z-10">
        <div className="bg-rustic-card border border-rustic rounded-2xl p-6 shadow-xl animate-rise">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-rustic-muted">Open library</p>
              <h2 className="text-3xl font-semibold text-gradient-rustic">Open knowledge for everyone</h2>
              <p className="text-sm text-rustic-dark/80 mt-2">
                Download, share, and enjoy—free, offline-ready resources for all.
              </p>
              <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books, movies, audio, software..."
                    className="w-full px-4 py-3 rounded-xl bg-white/80 border border-rustic text-rustic-dark placeholder-rustic-muted focus:outline-none focus:border-rustic focus:ring-1 focus:ring-rustic-muted shadow-inner"
                  />
                  {searchLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rustic-muted">Searching...</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-gradient-rustic text-white font-semibold hover:opacity-90 transition shadow-lg"
                >
                  Search
                </button>
              </form>
              {showSearchResults && (
                <div className="mt-3 bg-rustic-card border border-rustic rounded-xl p-3 space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.length === 0 && (
                    <div className="text-sm text-rustic-muted">No results found.</div>
                  )}
                  {searchResults.map((r, idx) => (
                    <div
                      key={`${r.identifier || idx}`}
                      className="p-3 rounded-lg bg-white/85 border border-rustic hover:border-rustic transition"
                    >
                      <div className="text-sm font-semibold text-rustic-dark">{r.title || "Untitled"}</div>
                      <div className="text-xs text-rustic-muted line-clamp-2">{r.description || r.language || "No description"}</div>
                      {r.url && (
                        <button
                          onClick={() => openLink(r.url, r)}
                          className="mt-2 text-xs text-rustic-dark hover:text-rustic-muted"
                        >
                          Open
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      
      <main className="flex-1 container mx-auto px-6 pb-12 relative z-10">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-center text-rustic-dark">Browse Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 place-items-center">
            {categories.map((c, idx) => (
              <Link
                key={c.name}
                href={c.path}
                className="w-72 h-44 bg-rustic-card border border-rustic rounded-xl flex items-center justify-center text-2xl font-medium text-rustic-dark shadow-lg hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:rotate-1 animate-pop"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top viewed */}
          <section>
            <h2 className="text-xl font-semibold mb-4 mx-5 text-rustic-dark">Top 50 Monthly Viewed</h2>

            {loading ? (
              <div className="p-6 bg-rustic-card border border-rustic rounded-2xl text-rustic-muted">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {slicePage(topViewed, topViewedPage).map((it, i) => {
                  const id = it.identifier || i;
                  const isOpen = openViewed === id;
                  return (
                    <div
                      key={i + (topViewedPage - 1) * pageSize}
                      className="p-4 mx-5 bg-rustic-card border border-rustic rounded-2xl hover:border-rustic shadow-lg transition-all duration-500 hover:-translate-y-1.5"
                    >
                      <div className="font-medium card-line-clamp text-rustic-dark" title={it.title || 'Untitled'}>{it.title || 'Untitled'}</div>
                      <div className="text-xs text-rustic-muted card-line-clamp" title={lowData ? it.language : it.description}>
                        {lowData ? it.language : it.description}
                      </div>

                      <div className="mt-2 text-xs text-rustic-muted flex gap-4 flex-wrap">
                        {it.language && (<span>Lang: {it.language}</span>)}
                        <span>Downloads: {fmt(it.downloads)}</span>
                        <span>Size: {it.item_size ? Math.round(it.item_size / 1024) + " KB" : "N/A"}</span>
                      </div>

                      {it.url && (
                        <button
                          onClick={() => openLink(it.url, it)}
                          className="text-rustic-dark text-sm mt-2 inline-block hover:text-rustic-muted"
                        >
                          Download
                        </button>
                      )}

                      <button
                        onClick={() => setOpenViewed(prev => prev === id ? null : id)}
                        className="m-2 text-xs text-rustic-muted hover:text-rustic-dark"
                      >
                        {isOpen ? 'Hide details' : 'Show details'}
                      </button>

                      {isOpen && (
                        <div className="mt-3 text-xs text-rustic-muted space-y-1 bg-white/80 border border-rustic rounded-lg p-3">
                          {it.language && <div><span className="text-rustic-muted/80">Language:</span> {it.language}</div>}
                          {it.subject && <div><span className="text-rustic-muted/80">Subject:</span> {Array.isArray(it.subject) ? it.subject.join(', ') : it.subject}</div>}
                          {it.publicdate && <div><span className="text-rustic-muted/80">Published:</span> {new Date(it.publicdate).toLocaleDateString()}</div>}
                          {it.btih && (
                            <div className="flex items-center gap-2">
                              <span className="text-rustic-muted/80">Magnet:</span>
                              <a
                                href={`magnet:?xt=urn:btih:${it.btih}`}
                                className="text-rustic-dark hover:underline truncate"
                                title={it.btih}
                              >
                                magnet:?xt=urn:btih:{it.btih}
                              </a>
                            </div>
                          )}
                          {it.mediatype && <div><span className="text-rustic-muted/80">Type:</span> {it.mediatype}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {topViewed.length > pageSize && (
                  <div className="flex items-center justify-between text-sm text-rustic-muted mx-5">
                    <span>Page {topViewedPage} / {Math.max(1, Math.ceil(topViewed.length / pageSize))}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTopViewedPage((p) => Math.max(1, p - 1))}
                        disabled={topViewedPage === 1}
                        className="px-3 py-2 rounded-lg border border-rustic bg-white/70 hover:border-rustic disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setTopViewedPage((p) => Math.min(Math.ceil(topViewed.length / pageSize), p + 1))}
                        disabled={topViewedPage === Math.ceil(topViewed.length / pageSize)}
                        className="px-3 py-2 rounded-lg border border-rustic bg-white/70 hover:border-rustic disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Top clicked */}
          <section>
            <h2 className="text-xl font-semibold mb-4 mx-5 text-rustic-dark">Trending</h2>
            {loading ? (
              <div className="p-6 bg-rustic-card border border-rustic rounded-2xl text-rustic-muted">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {slicePage(topClicked, topClickedPage).map((it, i) => {
                  const id = it.identifier || i;
                  const isOpen = openClicked === id;
                  return (
                    <div
                      key={`clicked-${i + (topClickedPage - 1) * pageSize}`}
                      className="p-4 mx-5 bg-rustic-card border border-rustic rounded-2xl hover:border-rustic shadow-lg transition-all duration-500 hover:-translate-y-1.5"
                    >
                      <div className="font-medium card-line-clamp text-rustic-dark" title={it.title || 'Untitled'}>{it.title || 'Untitled'}</div>
                      <div className="text-xs text-rustic-muted card-line-clamp" title={it.description || it.language}>
                        {lowData ? it.language : (it.description || 'No description')}
                      </div>

                      <div className="mt-2 text-xs text-rustic-muted flex gap-4 flex-wrap">
                        <span>Clicks: {fmt(it.clicks)}</span>
                        {it.language && (<span>Lang: {it.language}</span>)}
                        <span>Downloads: {fmt(it.downloads)}</span>
                      </div>

                      {it.url && (
                        <button
                          onClick={() => openLink(it.url, it)}
                          className="text-rustic-dark text-sm mt-2 inline-block hover:text-rustic-muted"
                        >
                          Open
                        </button>
                      )}

                      <button
                        onClick={() => setOpenClicked(prev => prev === id ? null : id)}
                        className="m-2 text-xs text-rustic-muted hover:text-rustic-dark"
                      >
                        {isOpen ? 'Hide details' : 'Show details'}
                      </button>

                      {isOpen && (
                        <div className="mt-3 text-xs text-rustic-muted space-y-1 bg-white/80 border border-rustic rounded-lg p-3">
                          {it.language && <div><span className="text-rustic-muted/80">Language:</span> {it.language}</div>}
                          {it.subject && <div><span className="text-rustic-muted/80">Subject:</span> {Array.isArray(it.subject) ? it.subject.join(', ') : it.subject}</div>}
                          {it.publicdate && <div><span className="text-rustic-muted/80">Published:</span> {new Date(it.publicdate).toLocaleDateString()}</div>}
                          {it.btih && (
                            <div className="flex items-center gap-2">
                              <span className="text-rustic-muted/80">Magnet:</span>
                              <a
                                href={`magnet:?xt=urn:btih:${it.btih}`}
                                className="text-rustic-dark hover:underline truncate"
                                title={it.btih}
                              >
                                magnet:?xt=urn:btih:{it.btih}
                              </a>
                            </div>
                          )}
                          {it.mediatype && <div><span className="text-rustic-muted/80">Type:</span> {it.mediatype}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {topClicked.length > pageSize && (
                  <div className="flex items-center justify-between text-sm text-rustic-muted mx-5">
                    <span>Page {topClickedPage} / {Math.max(1, Math.ceil(topClicked.length / pageSize))}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTopClickedPage((p) => Math.max(1, p - 1))}
                        disabled={topClickedPage === 1}
                        className="px-3 py-2 rounded-lg border border-rustic bg-white/70 hover:border-rustic disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setTopClickedPage((p) => Math.min(Math.ceil(topClicked.length / pageSize), p + 1))}
                        disabled={topClickedPage === Math.ceil(topClicked.length / pageSize)}
                        className="px-3 py-2 rounded-lg border border-rustic bg-white/70 hover:border-rustic disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <ContactUs />

      <footer className="bg-rustic-translucent border-t border-rustic py-6 text-center text-rustic-muted relative z-10">
        Access for all | EchoNet {new Date().getFullYear()}
      </footer>

      <style jsx global>{``}</style>
    </div>
  );
}

