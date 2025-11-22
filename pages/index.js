import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [topViewed, setTopViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowData, setLowData] = useState(false);

  const categories = [
    { name: "Text", path: "/text" },
    { name: "Image", path: "/image" },
    { name: "Movies", path: "/movies" },
    { name: "Audio", path: "/audio" },
    { name: "Software", path: "/software" },
  ];

  useEffect(() => {
    fetch("/api/top-viewed")
      .then((r) => r.json())
      .then((data) => setTopViewed(data.items || []))
      .catch(() => setTopViewed([]))
      .finally(() => setLoading(false));

    try {
      const ld = localStorage.getItem("lowData") === "true";
      setLowData(ld);
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
    if (!n) return 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold">EchoNet</Link>
          <nav className="space-x-4 text-gray-300">
            <Link href="/text">Text</Link>
            <Link href="/image">Image</Link>
            <Link href="/movies">Movies</Link>
            <Link href="/audio">Audio</Link>
            <Link href="/software">Software</Link>
          </nav>
        </div>
      </header>

      {/* Mission Banner */}
      <section className="container mx-auto px-6 py-6">
        <div className="bg-gray-800 border border-gray-700 rounded p-5">
          <h2 className="text-lg font-semibold">EchoNet — Knowledge for All</h2>
          <p className="text-sm text-gray-300 mt-2">
            A simple, user-friendly digital archive that helps underserved learners
            access and download free educational resources for offline use.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm text-gray-300">Low Data Mode</label>
            <input
              type="checkbox"
              checked={lowData}
              onChange={(e) => {
                setLowData(e.target.checked);
                localStorage.setItem("lowData", e.target.checked ? "true" : "false");
              }}
            />
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-center">Browse Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 place-items-center">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={c.path}
                className="w-72 h-44 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-2xl font-medium"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Top viewed */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Top 50 Monthly Viewed</h2>

          {loading ? (
            <div className="p-6 bg-gray-800 border border-gray-700 rounded">Loading…</div>
          ) : (
            <div className="grid gap-4">
              {topViewed.map((it, i) => (
                <div key={i} className="p-4 bg-gray-800 border border-gray-700 rounded">
                  <div className="font-medium truncate">{it.title}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {lowData ? it.language : it.description}
                  </div>

                  <div className="mt-2 text-xs text-gray-400 flex gap-4">
                    <span>Lang: {it.language}</span>
                    <span>Downloads: {fmt(it.downloads)}</span>
                    <span>Size: {it.item_size ? Math.round(it.item_size / 1024) + " KB" : "N/A"}</span>
                  </div>

                  {it.url && (
                    <a href={it.url} target="_blank" className="text-cyan-300 text-sm mt-2 inline-block">
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 py-6 text-center text-gray-400">
        © EchoNet {new Date().getFullYear()}
      </footer>
    </div>
  );
}
