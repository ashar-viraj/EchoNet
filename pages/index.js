import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [topViewed, setTopViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { name: 'Text', path: '/text', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700' },
    { name: 'Image', path: '/image', color: 'bg-green-600', hoverColor: 'hover:bg-green-700' },
    { name: 'Movies', path: '/movies', color: 'bg-red-600', hoverColor: 'hover:bg-red-700' },
    { name: 'Audio', path: '/audio', color: 'bg-purple-600', hoverColor: 'hover:bg-purple-700' },
    { name: 'Software', path: '/software', color: 'bg-orange-600', hoverColor: 'hover:bg-orange-700' },
  ];

  useEffect(() => {
    // Fetch top viewed content
    fetch('/api/top-viewed')
      .then(res => res.json())
      .then(data => {
        setTopViewed(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching top viewed:', err);
        setLoading(false);
      });
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
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setShowSearchResults(true);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'text': return '📚';
      case 'image': return '🖼️';
      case 'movies': return '🎬';
      case 'audio': return '🎵';
      case 'software': return '💾';
      default: return '📄';
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            EchoNet
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Category Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.path}
                  className={`${category.color} ${category.hoverColor} rounded-lg p-8 text-white text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
                >
                  <div className="text-4xl mb-3">{getTypeIcon(category.name.toLowerCase())}</div>
                  <h2 className="text-xl font-bold">{category.name}</h2>
                </Link>
              ))}
            </div>

            {/* Top 50 Monthly Viewed Content */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
                Top 50 Monthly Viewed Content
              </h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              ) : topViewed.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No content available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topViewed.map((item, index) => (
                    <div
                      key={`${item.identifier}-${index}`}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getTypeIcon(item.type)}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 dark:text-white truncate mb-1">
                            {item.title || 'Untitled'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {item.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>👁️ {formatViews(item.views)} views</span>
                            <span>⬇️ {formatViews(item.downloads)} downloads</span>
                          </div>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-2 inline-block"
                            >
                              View on Archive.org →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Search Sidebar */}
          <aside className="w-full lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Search Content
              </h3>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition-colors"
                  >
                    🔍
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {showSearchResults && (
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm py-4 text-center">
                      No results found
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((item, index) => (
                        <div
                          key={`search-${item.identifier}-${index}`}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{getTypeIcon(item.type)}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                                {item.title || 'Untitled'}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                {item.description || 'No description'}
                              </p>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 text-xs hover:underline mt-1 inline-block"
                                >
                                  View →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400">©</span>
            <span className="font-semibold">EchoNet</span>
            <span className="text-gray-400">{new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
