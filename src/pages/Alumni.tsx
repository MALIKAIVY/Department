import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Search, Briefcase, MapPin } from 'lucide-react';
import { getInitials } from '../lib/utils';
import type { Alumni as AlumniType } from '../lib/types';

interface AlumniWithProfile extends AlumniType {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
}

export const Alumni: React.FC = () => {
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState<AlumniWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    graduationYear: '',
    industry: '',
  });

  useEffect(() => {
    fetchAlumni();
  }, [filters]);

  const fetchAlumni = async () => {
    setIsLoading(true);
    try {
      let url = '/users/alumni?';
      if (filters.graduationYear) url += `graduation_year=${filters.graduationYear}&`;
      if (filters.industry) url += `industry=${encodeURIComponent(filters.industry)}&`;

      const data = await api.fetch(url);
      
      let filtered = data || [];
      if (searchTerm) {
        filtered = filtered.filter((a: any) =>
          a.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setAlumni(filtered);
    } catch (error) {
      console.error('Failed to fetch alumni:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Consulting',
    'Government',
    'Non-profit',
    'Other',
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Alumni Network
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Connect with graduates and explore career opportunities
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Name
            </label>
            <div className="mt-2 flex items-center rounded-lg border border-gray-300 px-4 dark:border-gray-600">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search alumni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent py-2 pl-3 text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Graduation Year
            </label>
            <select
              value={filters.graduationYear}
              onChange={(e) =>
                setFilters({ ...filters, graduationYear: e.target.value })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Years</option>
              {Array.from({ length: 15 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return year;
              }).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Industry
            </label>
            <select
              value={filters.industry}
              onChange={(e) =>
                setFilters({ ...filters, industry: e.target.value })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      ) : alumni.length === 0 ? (
        <div className="rounded-lg bg-gray-100 py-12 text-center dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">No alumni found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {alumni.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate(`/profile/${a.id}`)}
              className="cursor-pointer rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-lg font-bold text-white">
                  {a.avatar_url ? (
                    <img
                      src={a.avatar_url}
                      alt={a.full_name}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    getInitials(a.full_name || '')
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {a.full_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Graduated {a.graduation_year}
                  </p>
                </div>
              </div>

              {a.current_company && (
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="h-4 w-4" />
                  <span>
                    {a.current_position} at {a.current_company}
                  </span>
                </div>
              )}

              {a.industry && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{a.industry}</span>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${a.id}`);
                }}
                className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
