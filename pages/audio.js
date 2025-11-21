import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AudioPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState({ languages: [], subjects: [], years: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, [currentPage, filters, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      ...(searchQuery && { search: searchQuery })
    });
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => params.append(key, val));
        } else {
          params.append(key, filters[key]);
        }
      }
    });
    
    try {
      const res = await fetch(`/api/content/audio?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      if (data.filters) {
        setAvailableFilters(data.filters);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      setCurrentPage(1);
      return newFilters;
    });
  };

  const handleSubjectToggle = (subject) => {
    const currentSubjects = Array.isArray(filters.subject) ? filters.subject : filters.subject ? [filters.subject] : [];
    const newSubjects = currentSubjects.includes(subject)
      ? currentSubjects.filter(s => s !== subject)
      : [...currentSubjects, subject];
    handleFilterChange('subject', newSubjects.length > 0 ? newSubjects : null);
  };

  const formatSize = (bytes) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-black/40 backdrop-blur-lg border-b border-purple-500/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-300 transition-all">
              EchoNet
            </Link>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg border border-purple-400/50 transition-all"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {showFilters && (
            <aside className="w-full lg:w-80 space-y-6">
              <div className="bg-black/40 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Filters
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-cyan-300">Search by Title</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search..."
                    className="w-full px-4 py-2 bg-black/50 border border-purple-500/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-cyan-300">Language</label>
                  <select
                    value={filters.language || ''}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-purple-500/50 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="">All Languages</option>
                    {availableFilters.languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-cyan-300">Subject</label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {availableFilters.subjects.slice(0, 50).map(subject => {
                      const isSelected = Array.isArray(filters.subject) 
                        ? filters.subject.includes(subject) 
                        : filters.subject === subject;
                      return (
                        <button
                          key={subject}
                          onClick={() => handleSubjectToggle(subject)}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white border-2 border-purple-400'
                              : 'bg-black/50 text-gray-300 border border-purple-500/30 hover:border-purple-400'
                          }`}
                        >
                          {subject}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-cyan-300">Year</label>
                  <select
                    value={filters.year || ''}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-purple-500/50 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="">All Years</option>
                    {availableFilters.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-cyan-300">Downloads</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.downloadsMin || ''}
                      onChange={(e) => handleFilterChange('downloadsMin', e.target.value || null)}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.downloadsMax || ''}
                      onChange={(e) => handleFilterChange('downloadsMax', e.target.value || null)}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-cyan-300">Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min (bytes)"
                      value={filters.sizeMin || ''}
                      onChange={(e) => handleFilterChange('sizeMin', e.target.value || null)}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Max (bytes)"
                      value={filters.sizeMax || ''}
                      onChange={(e) => handleFilterChange('sizeMax', e.target.value || null)}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-red-600/50 hover:bg-red-600 rounded-lg border border-red-400/50 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            </aside>
          )}

          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Audio Content
              </h1>
              <p className="text-gray-400">Found {total} items</p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                <p className="mt-4 text-gray-400">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-black/40 backdrop-blur-lg rounded-xl p-12 text-center border border-purple-500/30">
                <p className="text-gray-400 text-lg">No items found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {items.map((item, index) => (
                    <div
                      key={`${item.identifier}-${index}`}
                      className="bg-black/40 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 hover:border-purple-400 hover:shadow-2xl transition-all group"
                    >
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-2 text-cyan-300 group-hover:text-cyan-200 transition-colors line-clamp-2">
                          {item.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                          {item.description || 'No description available'}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Language:</span>
                          <span className="text-cyan-300">{item.language || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Downloads:</span>
                          <span className="text-purple-300">{formatNumber(item.downloads)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Size:</span>
                          <span className="text-green-300">{formatSize(item.item_size || 0)}</span>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg text-center transition-all"
                          >
                            View on Archive.org →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg border border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg border border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-black/40 backdrop-blur-lg border-t border-purple-500/30 mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <span>©</span>
            <span className="font-semibold text-white">EchoNet</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
