import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { Calendar, Film, Image, ImagePlus, Linkedin, Plus, Search, X, Users, GraduationCap, Filter, Eye, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBackendAssetUrl, getCurrentAcademicYear, isVideoUrl } from '../lib/utils';
import type { YearbookEntry } from '../lib/types';
import { Avatar, Button, Card, EmptyState, Input, PageHeader, Select, Spinner, Textarea, Modal } from '../components/ui';

interface EntryWithProfile extends YearbookEntry {
  full_name?: string;
  avatar_url?: string;
  author_role?: string;
}

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime';

export const Yearbook: React.FC = () => {
  const { profile } = useAuthStore();
  const [entries, setEntries] = useState<EntryWithProfile[]>([]);
  const [userEntry, setUserEntry] = useState<YearbookEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'alumni' | 'faculty'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EntryWithProfile | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [isMediaRemoved, setIsMediaRemoved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    yearbook_quote: '',
    course: '',
    linkedin_url: '',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchEntries();
    fetchUserEntry();
  }, [selectedYear, debouncedSearch, profile]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        academic_year: selectedYear,
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const data = await api.fetch(`/yearbook/?${query.toString()}`);
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
          course: data.course || '',
          linkedin_url: data.linkedin_url || '',
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
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (roleFilter === 'all') return true;
    if (roleFilter === 'faculty') return entry.author_role === 'faculty' || entry.author_role === 'admin';
    return entry.author_role === roleFilter;
  });

  const studentEntries = filteredEntries.filter(e => e.author_role === 'student');
  const alumniEntries = filteredEntries.filter(e => e.author_role === 'alumni');
  const facultyEntries = filteredEntries.filter(e => e.author_role === 'faculty' || e.author_role === 'admin');

  const EntryCard = ({ entry }: { entry: EntryWithProfile }) => (
    <Card 
      className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col cursor-pointer group"
      onClick={() => setSelectedEntry(entry)}
    >
      <div className="relative aspect-[4/5] bg-gray-900 overflow-hidden">
        {entry.profile_image_url ? (
          isVideoUrl(entry.profile_image_url) ? (
            <video src={getBackendAssetUrl(entry.profile_image_url)} className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          ) : (
            <img src={getBackendAssetUrl(entry.profile_image_url)} alt="Entry" className="h-full w-full object-cover opacity-90 transition-all group-hover:opacity-100 group-hover:scale-105" />
          )
        ) : (
          <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Avatar name={entry.full_name} className="h-32 w-32 shadow-xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-6">
          <div className="w-full flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-bold">View Entry</span>
            </div>
            {entry.linkedin_url && (
              <span className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <Linkedin className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="mb-4">
          <h3 className="text-xl font-black text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
            {entry.full_name}
          </h3>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
            {entry.course || (entry.author_role === 'faculty' || entry.author_role === 'admin' ? 'Faculty Member' : 'Student')}
          </p>
        </div>
        {entry.yearbook_quote && (
          <div className="relative mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
            <span className="absolute -left-1 -top-1 text-3xl text-blue-100 dark:text-blue-900/50 font-serif">"</span>
            <p className="text-sm italic text-gray-600 dark:text-gray-400 pl-4 relative z-10 line-clamp-3 leading-relaxed">
              {entry.yearbook_quote}
            </p>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PageHeader title="Yearbook" description="Preserving memories across the department" />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="shadow-lg shadow-blue-500/10 py-3 px-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            {userEntry ? 'Edit My Entry' : 'Add My Entry'}
          </Button>
        </div>
      </div>

      {showSubmitForm && (
        <Card as="form" onSubmit={handleSubmit} className="p-8 border-2 border-blue-100 dark:border-blue-900/30 shadow-2xl shadow-blue-500/10">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {userEntry ? 'Update Your Story' : 'Create Your Yearbook Entry'}
            </h2>
            <p className="mt-1 text-gray-500 font-medium">
              Your contribution makes the yearbook complete.
            </p>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-blue-50 bg-blue-50/20 p-6 dark:border-blue-900/20 dark:bg-blue-900/5">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Media Spotlight</h3>
                <div className="flex gap-4 text-[10px] font-black uppercase text-gray-400">
                  <span className="flex items-center gap-1.5"><Image className="h-3 w-3" /> Image</span>
                  <span className="flex items-center gap-1.5 border-l pl-4 dark:border-gray-700"><Film className="h-3 w-3" /> Video</span>
                </div>
              </div>

              <div className="space-y-6">
                {mediaPreview && (
                  <div className="relative overflow-hidden rounded-2xl border-4 border-white bg-black shadow-2xl dark:border-gray-800">
                    {mediaFile?.type.startsWith('video/') || isVideoUrl(mediaPreview) ? (
                      <video
                        src={mediaFile ? mediaPreview : getBackendAssetUrl(mediaPreview)}
                        className="max-h-96 w-full object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={mediaFile ? mediaPreview : getBackendAssetUrl(mediaPreview)}
                        alt="Yearbook media preview"
                        className="max-h-96 w-full object-contain"
                      />
                    )}
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="absolute right-6 top-6 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-xl transition hover:bg-black/75 shadow-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-gray-200 bg-white px-4 py-10 text-center transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="rounded-full bg-blue-100 p-4 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-inner">
                    <ImagePlus className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-gray-900 dark:text-white">
                      {mediaPreview ? 'Change Media' : 'Upload Your Spotlight'}
                    </p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">JPG, PNG or MP4 (Max 50MB)</p>
                  </div>
                  <input
                    type="file"
                    accept={ACCEPTED_MEDIA_TYPES}
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Department / Course</label>
                <Input
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g. Computer Science"
                  required
                  className="py-4 text-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">LinkedIn Profile (Optional)</label>
                <Input
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="py-4 text-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Yearbook Quote</label>
              <Textarea
                value={formData.yearbook_quote}
                onChange={(e) => setFormData({ ...formData, yearbook_quote: e.target.value })}
                placeholder="Share a memory or an inspiring quote..."
                maxLength={200}
                rows={4}
                required
                className="py-4 text-lg italic"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1 py-5 text-xl shadow-xl shadow-blue-500/20">
                {isSubmitting ? 'Saving Story...' : userEntry ? 'Update My Entry' : 'Submit My Entry'}
              </Button>
              <Button type="button" onClick={() => setShowSubmitForm(false)} variant="secondary" className="flex-1 py-5 text-xl">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-8 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-auto font-black text-lg"
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
          
          <div className="flex items-center gap-3 border-l pl-6 dark:border-gray-700">
            <Filter className="h-5 w-5 text-gray-400" />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-auto font-bold"
            >
              <option value="all">Everyone</option>
              <option value="student">Current Students</option>
              <option value="alumni">Graduated Alumni</option>
              <option value="faculty">Faculty & Staff</option>
            </Select>
          </div>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by names or quotes..."
            className="pl-12 py-4 rounded-3xl text-lg shadow-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-16 w-16" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState description={debouncedSearch ? "No entries match your search." : `The yearbook for ${selectedYear} is still empty.`} />
      ) : (
        <div className="space-y-24 pb-20">
          {/* Faculty Section */}
          {facultyEntries.length > 0 && (
            <section className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-indigo-100 p-3 dark:bg-indigo-900/30">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Faculty & Staff</h2>
                  <p className="text-gray-500 font-medium">The mentors shaping our future</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {facultyEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}

          {/* Alumni Section */}
          {alumniEntries.length > 0 && (
            <section className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-orange-100 p-3 dark:bg-orange-900/30">
                  <GraduationCap className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Graduated Alumni</h2>
                  <p className="text-gray-500 font-medium">Our proud graduates across the globe</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {alumniEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}

          {/* Students Section */}
          {studentEntries.length > 0 && (
            <section className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Current Students</h2>
                  <p className="text-gray-500 font-medium">The bright minds of the Class of {selectedYear.split('-')[1]}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {studentEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title="Yearbook Spotlight"
          size="lg"
        >
          <div className="space-y-8">
            <div className="relative aspect-[4/5] md:aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
              {selectedEntry.profile_image_url ? (
                isVideoUrl(selectedEntry.profile_image_url) ? (
                  <video 
                    src={getBackendAssetUrl(selectedEntry.profile_image_url)} 
                    className="w-full h-full object-contain" 
                    controls
                    autoPlay
                  />
                ) : (
                  <img 
                    src={getBackendAssetUrl(selectedEntry.profile_image_url)} 
                    className="w-full h-full object-contain" 
                    alt={selectedEntry.full_name}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Avatar name={selectedEntry.full_name} className="h-40 w-40" />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white">{selectedEntry.full_name}</h2>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
                    {selectedEntry.course || 'Department Member'}
                  </p>
                </div>
                {selectedEntry.linkedin_url && (
                  <a
                    href={selectedEntry.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl bg-[#0077b5] px-6 py-3 font-bold text-white shadow-lg shadow-[#0077b5]/20 transition-all hover:scale-105"
                  >
                    <Linkedin className="h-5 w-5" />
                    Connect on LinkedIn
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="rounded-xl bg-white p-2 dark:bg-gray-800 shadow-sm">
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Academic Year</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedEntry.academic_year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="rounded-xl bg-white p-2 dark:bg-gray-800 shadow-sm">
                    <Tag className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Department</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedEntry.course || 'General'}</p>
                  </div>
                </div>
              </div>

              <div className="relative p-8 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20 shadow-inner">
                <span className="absolute -left-2 -top-2 text-6xl text-blue-200 dark:text-blue-800/30 font-serif">"</span>
                <p className="relative z-10 text-xl md:text-2xl italic text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {selectedEntry.yearbook_quote}
                </p>
                <span className="absolute -right-2 bottom-0 text-6xl text-blue-200 dark:text-blue-800/30 font-serif">"</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
