import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [topViewed, setTopViewed] = useState([]);
  const [topClicked, setTopClicked] = useState([]);
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

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
      {/* Surreal educational sky */}
      <div className="pointer-events-none absolute inset-0 bg-loop mix-blend-screen opacity-80" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="absolute w-12 h-12 rounded-full bg-white/8 border border-white/10 floaty"
            style={{
              left: `${(i + 1) * 9}%`,
              top: `${(i % 5) * 18 + 6}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${12 + i * 0.6}s`
            }}
          />
        ))}
      </div>

      <header className="bg-slate-950/70 backdrop-blur border-b border-slate-800 sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-sky-500/25 border border-sky-400/40 flex items-center justify-center animate-pop">
              <span className="text-sky-50 font-bold">Ed</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">EchoNet</p>
              <h1 className="text-3xl font-bold text-sky-100 leading-none">Education for Everyone</h1>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/text" className="hover:text-sky-200 transition-transform duration-300 hover:-translate-y-0.5">Text</Link>
            <Link href="/image" className="hover:text-sky-200 transition-transform duration-300 hover:-translate-y-0.5">Image</Link>
            <Link href="/movies" className="hover:text-sky-200 transition-transform duration-300 hover:-translate-y-0.5">Movies</Link>
            <Link href="/audio" className="hover:text-sky-200 transition-transform duration-300 hover:-translate-y-0.5">Audio</Link>
            <Link href="/software" className="hover:text-sky-200 transition-transform duration-300 hover:-translate-y-0.5">Software</Link>
            <Link href="/profile" className="text-sky-300 hover:text-sky-100 transition">Profile</Link>
            <Link href="/login" className="text-slate-400 hover:text-sky-200 underline underline-offset-4">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Mission Banner */}
      <section className="container mx-auto px-6 py-8 relative z-10">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-950/60 animate-rise">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Social cause</p>
              <h2 className="text-3xl font-semibold text-sky-100">Open education for every learner</h2>
              <p className="text-sm text-slate-300 mt-2">
                Download, share, and uplift—help close education gaps with free, offline-ready resources.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                <input
                  type="checkbox"
                  checked={lowData}
                  onChange={(e) => {
                    setLowData(e.target.checked);
                    localStorage.setItem("lowData", e.target.checked ? "true" : "false");
                  }}
                  className="accent-sky-400"
                />
                Low Data Mode
              </label>
              <span className="px-3 py-2 rounded-lg bg-sky-500/15 border border-sky-400/30">Free access</span>
              <span className="px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-400/30">Community</span>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-6 pb-12 relative z-10">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-center">Browse Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 place-items-center">
            {categories.map((c, idx) => (
              <Link
                key={c.name}
                href={c.path}
                className="w-72 h-44 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center text-2xl font-medium shadow-lg hover:shadow-sky-500/30 transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:rotate-1 animate-pop"
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
            <h2 className="text-xl font-semibold mb-4 mx-5">Top 50 Monthly Viewed</h2>

            {loading ? (
              <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {topViewed.map((it, i) => (
                  <div
                    key={i}
                    className="p-4 mx-5 bg-slate-900/70 border border-slate-800 rounded-2xl hover:border-sky-500/50 shadow-lg hover:shadow-sky-600/25 transition-all duration-500 hover:-translate-y-1.5"
                  >
                    <div className="font-medium card-line-clamp" title={it.title || 'Untitled'}>{it.title || 'Untitled'}</div>
                    <div className="text-xs text-slate-300 card-line-clamp" title={lowData ? it.language : it.description}>
                      {lowData ? it.language : it.description}
                    </div>

                    <div className="mt-2 text-xs text-slate-400 flex gap-4 flex-wrap">
                      {it.language && (<span>Lang: {it.language}</span>)}
                      <span>Downloads: {fmt(it.downloads)}</span>
                      <span>Size: {it.item_size ? Math.round(it.item_size / 1024) + " KB" : "N/A"}</span>
                    </div>

                    {it.url && (
                      <button
                        onClick={() => openLink(it.url, it.identifier)}
                        className="text-sky-300 text-sm mt-2 inline-block hover:underline"
                      >
                        Download
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top clicked */}
          <section>
            <h2 className="text-xl font-semibold mb-4 mx-5">Trending</h2>
            {loading ? (
              <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {topClicked.map((it, i) => (
                  <div
                    key={`clicked-${i}`}
                    className="p-4 mx-5 bg-slate-900/70 border border-slate-800 rounded-2xl hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1.5"
                  >
                    <div className="font-medium card-line-clamp" title={it.title || 'Untitled'}>{it.title || 'Untitled'}</div>
                    <div className="text-xs text-slate-300 card-line-clamp" title={it.description || it.language}>
                      {lowData ? it.language : (it.description || 'No description')}
                    </div>

                    <div className="mt-2 text-xs text-slate-400 flex gap-4 flex-wrap">
                      <span>Clicks: {fmt(it.clicks)}</span>
                      {it.language && (<span>Lang: {it.language}</span>)}
                      <span>Downloads: {fmt(it.downloads)}</span>
                    </div>

                    {it.url && (
                      <button
                        onClick={() => openLink(it.url, it.identifier)}
                        className="text-emerald-300 text-sm mt-2 inline-block hover:underline"
                      >
                        Open
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-slate-950/80 border-t border-slate-800 py-6 text-center text-slate-400 relative z-10">
        Education for all · EchoNet {new Date().getFullYear()}
      </footer>

      <style jsx global>{`
        .bg-loop {
          background: radial-gradient(circle at 20% 20%, rgba(125, 211, 252, 0.14), transparent 35%),
            radial-gradient(circle at 80% 10%, rgba(167, 139, 250, 0.14), transparent 35%),
            radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.12), transparent 35%),
            linear-gradient(120deg, #0b1224, #0f172a, #0b1224);
          background-size: 200% 200%;
          animation: loop 22s ease-in-out infinite;
        }
        @keyframes loop {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .floaty {
          animation: float 16s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-18px) translateX(12px) rotate(3deg); }
          100% { transform: translateY(0) translateX(0); }
        }
        .animate-pop {
          animation: pop 0.8s ease forwards;
        }
        @keyframes pop {
          0% { transform: translateY(12px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-rise {
          animation: rise 1s ease forwards;
        }
        @keyframes rise {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .card-line-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
