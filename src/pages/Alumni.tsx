import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Search, Briefcase, MapPin } from 'lucide-react';
import type { Alumni as AlumniType } from '../lib/types';
import { Avatar, Button, Card, EmptyState, Field, PageHeader, Select, Spinner } from '../components/ui';
import { INDUSTRIES } from '../lib/constants';

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
    } catch {
      console.error('Failed to fetch alumni');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Alumni Network" description="Connect with graduates and explore career opportunities" />

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Search Name">
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
          </Field>

          <Field label="Graduation Year">
            <Select
              value={filters.graduationYear}
              onChange={(e) =>
                setFilters({ ...filters, graduationYear: e.target.value })
              }
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
            </Select>
          </Field>

          <Field label="Industry">
            <Select
              value={filters.industry}
              onChange={(e) =>
                setFilters({ ...filters, industry: e.target.value })
              }
            >
              <option value="">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : alumni.length === 0 ? (
        <EmptyState description="No alumni found" />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {alumni.map((a) => (
            <Card
              key={a.id}
              onClick={() => navigate(`/profile/${a.id}`)}
              className="cursor-pointer p-6 transition hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-4">
                <Avatar name={a.full_name} src={a.avatar_url} className="h-12 w-12 text-lg" />
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

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${a.id}`);
                }}
                className="mt-4 w-full"
              >
                View Profile
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
