// pages/favorites.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function FavoritesPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const key = "echonet_favorites";
    const favs = JSON.parse(localStorage.getItem(key) || "[]");
    setItems(favs);
  }, []);

  const removeFavorite = (id) => {
    const key = "echonet_favorites";
    const updated = items.filter((i) => i.identifier !== id);
    setItems(updated);
    localStorage.setItem(key, JSON.stringify(updated));
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
          <div className="text-sm text-gray-300">Favorites</div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Your Favorites</h1>

        {items.length === 0 ? (
          <div className="p-6 bg-gray-800 border border-gray-700 rounded">
            You haven't added anything to favorites yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((it, i) => (
              <div
                key={`${it.identifier}-${i}`}
                className="p-4 bg-gray-800 border border-gray-700 rounded"
              >
                <div className="flex justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.title}</div>
                    <div className="text-sm text-gray-400 truncate">
                      {it.description}
                    </div>
                    <div className="mt-2 text-xs text-gray-400 flex gap-4">
                      <span>Lang: {it.language || "N/A"}</span>
                      <span>Downloads: {it.downloads || 0}</span>
                      <span>Size: {fmtSize(it.item_size)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {it.url && (
                      <a
                        className="text-cyan-300 text-sm"
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    )}

                    <button
                      onClick={() => removeFavorite(it.identifier)}
                      className="px-3 py-1 bg-red-600 text-sm rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
