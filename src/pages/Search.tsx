import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Search as SearchIcon } from 'lucide-react';
import { getInitials } from '../lib/utils';

interface SearchResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await api.fetch(`/users/search?q=${encodeURIComponent(searchTerm)}`);

      const formattedResults: SearchResult[] = (data || []).map((d: any) => ({
        id: d.id,
        full_name: d.full_name,
        avatar_url: d.avatar_url,
        role: d.role,
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Search
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Find students, faculty, and alumni
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex items-center rounded-lg border border-gray-300 px-4 dark:border-gray-600">
              <SearchIcon className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.length >= 2) {
                    handleSearch();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="w-full bg-transparent py-3 pl-3 text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {isSearching && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Results ({results.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {results.map((profile) => (
              <div
                key={profile.id}
                onClick={() => navigate(`/profile/${profile.id}`)}
                className="flex cursor-pointer items-center gap-4 rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-gray-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-lg font-bold text-white overflow-hidden border-2 border-white dark:border-gray-800">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(profile.full_name)
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {profile.full_name}
                  </h3>
                  <p className="text-sm capitalize text-gray-600 dark:text-gray-400">
                    {profile.role}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${profile.id}`);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isSearching && searchTerm.length >= 2 && results.length === 0 && (
        <div className="rounded-lg bg-gray-100 py-12 text-center dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            No results found for "{searchTerm}"
          </p>
        </div>
      )}

      {searchTerm.length === 0 && (
        <div className="rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-900/20">
          <SearchIcon className="mx-auto mb-3 h-12 w-12 text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">
            Start typing to search for members
          </p>
        </div>
      )}
    </div>
  );
};
