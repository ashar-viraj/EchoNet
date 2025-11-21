// pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [topViewed, setTopViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowData, setLowData] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const categories = [
    { name: "Text", path: "/text" },
    { name: "Image", path: "/image" },
    { name: "Movies", path: "/movies" },
    { name: "Audio", path: "/audio" },
    { name: "Software", path: "/software" },
  ];

  useEffect(() => {
    // top viewed
    fetch("/api/top-viewed")
      .then((r) => r.json())
      .then((data) => setTopViewed(data.items || []))
      .catch(() => setTopViewed([]))
      .finally(() => setLoading(false));

    // lowData flag
    try {
      const ld = localStorage.getItem("lowData") === "true";
      setLowData(ld);
    } catch {}

    // favorites count
    try {
      const favs = JSON.parse(localStorage.getItem("echonet_favorites") || "[]");
      setFavoriteCount(favs.length);
    } catch {}
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowSearchResults(true);
    } catch {
      setSearchResults([]);
      setShowSearchResults(true);
    }
  };

  const fmt = (n) => {
    if (!n && n !== 0) return 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n;
  };

  // toggle low-data from homepage UI
  const onToggleLowData = (checked) => {
    try {
      localStorage.setItem("lowData", checked ? "true" : "false");
    } catch {}
    setLowData(checked);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold">EchoNet</Link>
          <nav className="space-x-4 text-gray-300">
            <Link href="/text" className="hover:text-white">Text</Link>
            <Link href="/image" className="hover:text-white">Image</Link>
            <Link href="/movies" className="hover:text-white">Movies</Link>
            <Link href="/audio" className="hover:text-white">Audio</Link>
            <Link href="/software" className="hover:text-white">Software</Link>
            <Link href="/favorites" className="hover:text-white">Favorites ({favoriteCount})</Link>
          </nav>
        </div>
      </header>

      {/* Mission banner + Low Data toggle */}
      <section className="container mx-auto px-6 py-6">
        <div className="bg-gray-800 border border-gray-700 rounded p-5 flex flex-col md:flex-row items-start gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">EchoNet — Knowledge for All</h2>
            <p className="text-sm text-gray-300 mt-2">
              EchoNet aggregates and organizes freely available educational and cultural resources,
              offering a lightweight, low-bandwidth friendly interface to help underserved learners
              find and download materials for offline study.
            </p>
            <div className="mt-3 flex gap-2">
              <Link href="/favorites" className="px-3 py-2 bg-cyan-600 text-black rounded text-sm">Saved resources</Link>
              <Link href="/how-it-helps" className="px-3 py-2 border border-gray-600 rounded text-sm text-gray-300">How this helps</Link>
            </div>
          </div>

          <div className="w-full md:w-80">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-300">Low Data Mode</div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowData}
                  onChange={(e) => onToggleLowData(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-cyan-500 bg-gray-700 rounded"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">Toggle for compact results (less description) — useful for slow or limited connections.</p>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Categories grid (centered and larger) */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-center">Browse Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 place-items-center">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={c.path}
                className="w-72 h-44 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-2xl font-medium hover:border-gray-500 transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Top 50 Monthly Viewed</h2>

            {loading ? (
              <div className="p-6 bg-gray-800 border border-gray-700 rounded">Loading…</div>
            ) : topViewed.length === 0 ? (
              <div className="p-6 bg-gray-800 border border-gray-700 rounded">No content yet.</div>
            ) : (
              <div className="grid gap-4">
                {topViewed.map((it, i) => (
                  <div key={`${it.identifier}-${i}`} className="p-4 bg-gray-800 border border-gray-700 rounded">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{it.title || "Untitled"}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate">{!lowData ? (it.description || "") : `${it.language || "N/A"}`}</div>
                        <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-4">
                          <span>Language: {it.language || "N/A"}</span>
                          <span>Downloads: {fmt(it.downloads)}</span>
                          <span>Size: {it.item_size ? Math.round(it.item_size / 1024) + " KB" : "N/A"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {it.url && <a href={it.url} target="_blank" rel="noreferrer" className="text-cyan-300">Download</a>}
                        <Link href={`/view/${encodeURIComponent(it.identifier)}`} className="text-sm text-gray-300">Details</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search & quick actions */}
          <aside className="bg-gray-800 border border-gray-700 rounded p-4">
            <div className="mb-4 p-3 bg-gray-700 border border-gray-600 rounded">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Favorites: {favoriteCount}</span>
                <Link href="/favorites" className="text-cyan-400 hover:text-cyan-300">View →</Link>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3">Search</h3>
            <form onSubmit={handleSearch} className="space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title / description"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
              <div className="flex gap-2">
                <button className="w-2/3 px-3 py-2 bg-cyan-600 text-black rounded text-sm">Search</button>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setShowSearchResults(false); setSearchResults([]); }}
                  className="w-1/3 px-3 py-2 bg-gray-600 rounded text-gray-200"
                >
                  Clear
                </button>
              </div>
            </form>

            {showSearchResults && (
              <div className="mt-4 max-h-64 overflow-auto">
                {searchResults.length === 0 ? (
                  <div className="text-sm text-gray-400">No results found.</div>
                ) : (
                  searchResults.map((r, i) => (
                    <div key={`${r.identifier}-${i}`} className="py-2 border-t border-gray-700">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-gray-400 truncate">{r.description}</div>
                      {r.url && <a className="text-xs text-cyan-300" href={r.url} target="_blank" rel="noreferrer">Open</a>}
                    </div>
                  ))
                )}
              </div>
            )}
          </aside>
        </section>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 py-6">
        <div className="container mx-auto px-6 text-sm text-gray-400 text-center">
          © EchoNet {new Date().getFullYear()} — Preserving knowledge for underserved learners.
        </div>
      </footer>
    </div>
  );
}
