import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { Calendar, Film, Image, ImagePlus, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBackendAssetUrl, getCurrentAcademicYear, formatDate, isVideoUrl } from '../lib/utils';
import type { YearbookEntry } from '../lib/types';
import { Avatar, Button, Card, EmptyState, Field, PageHeader, Select, Spinner, Textarea } from '../components/ui';

interface EntryWithProfile extends YearbookEntry {
  full_name?: string;
  avatar_url?: string;
}

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime';

export const Yearbook: React.FC = () => {
  const { profile } = useAuthStore();
  const [entries, setEntries] = useState<EntryWithProfile[]>([]);
  const [userEntry, setUserEntry] = useState<YearbookEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [isMediaRemoved, setIsMediaRemoved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const data = await api.fetch(`/yearbook?academic_year=${selectedYear}`);
      setEntries(data || []);
    } catch {
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
        setMediaPreview(data.profile_image_url || '');
        setIsMediaRemoved(false);
      }
    } catch {
      console.error('Failed to fetch user entry');
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please choose an image or video file');
      return;
    }

    if (file.size > MAX_MEDIA_SIZE) {
      toast.error('Media must be 50MB or smaller');
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setIsMediaRemoved(false);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setIsMediaRemoved(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    try {
      let mediaUrl = isMediaRemoved ? '' : userEntry?.profile_image_url || '';

      if (mediaFile) {
        const uploadData = new FormData();
        uploadData.append('file', mediaFile);
        const uploaded = await api.fetch('/yearbook/media', {
          method: 'POST',
          body: uploadData,
          headers: {},
        });
        mediaUrl = uploaded.url;
      }

      const payload = {
        academic_year: selectedYear,
        ...formData,
        profile_image_url: mediaUrl,
      };

      await api.fetch(userEntry ? `/yearbook/${userEntry.id}` : '/yearbook', {
        method: userEntry ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      
      toast.success(userEntry ? 'Entry updated!' : 'Entry submitted for approval!');
      setShowSubmitForm(false);
      setMediaFile(null);
      setIsMediaRemoved(false);
      fetchUserEntry();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PageHeader title="Yearbook" description="Browse and share yearbook entries from your class" />
        {profile?.role === 'student' && (
          <Button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
          >
            <Plus className="h-5 w-5" />
            {userEntry ? 'Edit Entry' : 'Add Entry'}
          </Button>
        )}
      </div>

      {profile?.role === 'student' && showSubmitForm && (
        <Card as="form" onSubmit={handleSubmit} className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            {userEntry ? 'Edit Your Yearbook Entry' : 'Create Your Yearbook Entry'}
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Photo or Video</h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Add the memory you want classmates to see first.
                  </p>
                </div>
                <div className="flex shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <span className="flex items-center gap-1 px-3 py-2 text-xs">
                    <Image className="h-4 w-4" />
                    Photo
                  </span>
                  <span className="flex items-center gap-1 border-l border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
                    <Film className="h-4 w-4" />
                    Video
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {mediaPreview && (
                  <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                    {mediaFile?.type.startsWith('video/') || isVideoUrl(mediaPreview) ? (
                      <video
                        src={mediaFile ? mediaPreview : getBackendAssetUrl(mediaPreview)}
                        className="max-h-72 w-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={mediaFile ? mediaPreview : getBackendAssetUrl(mediaPreview)}
                        alt="Yearbook media preview"
                        className="max-h-72 w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/75"
                      aria-label="Remove selected media"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm font-medium text-gray-700 transition hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:bg-blue-900/20">
                  <ImagePlus className="h-5 w-5" />
                  <span>{mediaPreview ? 'Change photo or video' : 'Upload a photo or video'}</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                    Click to choose a file from your device
                  </span>
                  <input
                    type="file"
                    accept={ACCEPTED_MEDIA_TYPES}
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, WebP, MP4, WebM, or MOV up to 50MB.
                </p>
              </div>
            </div>

            <Field label="Yearbook Quote">
              <Textarea
                value={formData.yearbook_quote}
                onChange={(e) =>
                  setFormData({ ...formData, yearbook_quote: e.target.value })
                }
                placeholder="Share an inspiring quote..."
                maxLength={200}
                rows={2}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.yearbook_quote.length}/200
              </p>
            </Field>

            <Field label="Favorite Memory">
              <Textarea
                value={formData.favorite_memory}
                onChange={(e) =>
                  setFormData({ ...formData, favorite_memory: e.target.value })
                }
                placeholder="Share your favorite memory from your time here..."
                maxLength={500}
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.favorite_memory.length}/500
              </p>
            </Field>

            <Field label="Future Plans">
              <Textarea
                value={formData.future_plans}
                onChange={(e) =>
                  setFormData({ ...formData, future_plans: e.target.value })
                }
                placeholder="What are your plans after graduation?..."
                maxLength={300}
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.future_plans.length}/300
              </p>
            </Field>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : userEntry ? 'Update Entry' : 'Submit Entry'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
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
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <Select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-auto"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return `${year}-${year + 1}`;
          }).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState description={`No entries found for ${selectedYear}`} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="overflow-hidden transition hover:shadow-md"
            >
              {entry.profile_image_url && (
                isVideoUrl(entry.profile_image_url) ? (
                  <video
                    src={getBackendAssetUrl(entry.profile_image_url)}
                    className="h-48 w-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={getBackendAssetUrl(entry.profile_image_url)}
                    alt="Entry"
                    className="h-48 w-full object-cover"
                  />
                )
              )}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={entry.full_name} src={entry.avatar_url} className="h-10 w-10 text-sm" />
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
            </Card>
          ))}
        </div>
      ) }
    </div>
  );
};
