import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentAcademicYear, formatDate } from '../lib/utils';
import type { YearbookEntry } from '../lib/types';

interface EntryWithProfile extends YearbookEntry {
  full_name?: string;
  avatar_url?: string;
}

export const Yearbook: React.FC = () => {
  const { profile } = useAuthStore();
  const [entries, setEntries] = useState<EntryWithProfile[]>([]);
  const [userEntry, setUserEntry] = useState<YearbookEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    yearbook_quote: '',
    favorite_memory: '',
    future_plans: '',
  });

  useEffect(() => {
    fetchEntries();
    if (profile?.role === 'student') {
      fetchUserEntry();
    }
  }, [selectedYear, profile]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetch(`/yearbook?academicYear=${selectedYear}`);
      setEntries(data || []);
    } catch (error) {
      toast.error('Failed to load yearbook entries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserEntry = async () => {
    if (!profile) return;
    try {
      const data = await api.fetch('/yearbook/me');
      setUserEntry(data);
      if (data) {
        setFormData({
          yearbook_quote: data.yearbook_quote || '',
          favorite_memory: data.favorite_memory || '',
          future_plans: data.future_plans || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user entry:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await api.fetch('/yearbook', {
        method: 'POST',
        body: JSON.stringify({
          academic_year: selectedYear,
          ...formData
        })
      });
      
      toast.success(userEntry ? 'Entry updated!' : 'Entry submitted for approval!');
      setShowSubmitForm(false);
      fetchUserEntry();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit entry');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yearbook</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse and share yearbook entries from your class
          </p>
        </div>
        {profile?.role === 'student' && (
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            {userEntry ? 'Edit Entry' : 'Add Entry'}
          </button>
        )}
      </div>

      {profile?.role === 'student' && showSubmitForm && (
        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            {userEntry ? 'Edit Your Yearbook Entry' : 'Create Your Yearbook Entry'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Yearbook Quote
              </label>
              <textarea
                value={formData.yearbook_quote}
                onChange={(e) =>
                  setFormData({ ...formData, yearbook_quote: e.target.value })
                }
                placeholder="Share an inspiring quote..."
                maxLength={200}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                rows={2}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.yearbook_quote.length}/200
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Favorite Memory
              </label>
              <textarea
                value={formData.favorite_memory}
                onChange={(e) =>
                  setFormData({ ...formData, favorite_memory: e.target.value })
                }
                placeholder="Share your favorite memory from your time here..."
                maxLength={500}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.favorite_memory.length}/500
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Future Plans
              </label>
              <textarea
                value={formData.future_plans}
                onChange={(e) =>
                  setFormData({ ...formData, future_plans: e.target.value })
                }
                placeholder="What are your plans after graduation?..."
                maxLength={300}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.future_plans.length}/300
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {userEntry ? 'Update Entry' : 'Submit Entry'}
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="flex-1 rounded-lg bg-gray-200 py-2 font-semibold text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>

          {userEntry && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Status:{' '}
              <span className="font-semibold capitalize">
                {userEntry.status}
                {userEntry.status === 'rejected' && ` - ${userEntry.rejection_reason}`}
              </span>
            </p>
          )}
        </form>
      )}

      <div className="flex items-center gap-4">
        <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return `${year}-${year + 1}`;
          }).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg bg-gray-100 py-12 text-center dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            No entries found for {selectedYear}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg bg-white shadow-sm dark:bg-gray-800 overflow-hidden hover:shadow-md transition"
            >
              {entry.profile_image_url && (
                <img
                  src={entry.profile_image_url}
                  alt="Entry"
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {entry.full_name}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
                {entry.yearbook_quote && (
                  <p className="mb-3 text-sm italic text-gray-700 dark:text-gray-300">
                    "{entry.yearbook_quote}"
                  </p>
                )}
                {entry.favorite_memory && (
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {entry.favorite_memory.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) }
    </div>
  );
};
