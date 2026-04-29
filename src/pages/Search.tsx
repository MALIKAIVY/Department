import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Search as SearchIcon } from 'lucide-react';
import { Avatar, Button, Card, EmptyState, PageHeader, Spinner } from '../components/ui';

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

  const handleSearch = async (query = searchTerm) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await api.fetch(`/users/search?q=${encodeURIComponent(query)}`);

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
      <PageHeader title="Search" description="Find students, faculty, and alumni" />

      <Card className="p-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex items-center rounded-lg border border-gray-300 px-4 dark:border-gray-600">
              <SearchIcon className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => {
                  const nextTerm = e.target.value;
                  setSearchTerm(nextTerm);
                  if (nextTerm.length >= 2) {
                    handleSearch(nextTerm);
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
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-3"
          >
            Search
          </Button>
        </div>
      </Card>

      {isSearching && (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Results ({results.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {results.map((profile) => (
              <Card
                key={profile.id}
                onClick={() => navigate(`/profile/${profile.id}`)}
                className="flex cursor-pointer items-center gap-4 p-4 transition hover:shadow-md"
              >
                <Avatar name={profile.full_name} src={profile.avatar_url} className="h-12 w-12 border-2 border-white text-lg dark:border-gray-800" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {profile.full_name}
                  </h3>
                  <p className="text-sm capitalize text-gray-600 dark:text-gray-400">
                    {profile.role}
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${profile.id}`);
                  }}
                >
                  View
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isSearching && searchTerm.length >= 2 && results.length === 0 && (
        <EmptyState description={`No results found for "${searchTerm}"`} />
      )}

      {searchTerm.length === 0 && (
        <EmptyState icon={SearchIcon} description="Start typing to search for members" />
      )}
    </div>
  );
};
