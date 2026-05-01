import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { ArrowLeft, Calendar, ImagePlus, MessageSquare, Plus, Search, X, Users, GraduationCap, Filter, Eye, MapPin, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBackendAssetUrl, getCurrentAcademicYear, formatDate, isVideoUrl } from '../lib/utils';
import type { MemorySubmission } from '../lib/types';
import { Button, Card, EmptyState, Input, PageHeader, Select, Spinner, Textarea, Modal } from '../components/ui';

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime';

export const Memories: React.FC = () => {
  const { profile } = useAuthStore();
  const [memories, setMemories] = useState<MemorySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'alumni' | 'faculty'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isViewingForm, setIsViewingForm] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemorySubmission | null>(null);
  const [memoryFile, setMemoryFile] = useState<File | null>(null);
  const [memoryPreview, setMemoryPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memoryForm, setMemoryForm] = useState({
    title: '',
    story: '',
    event_name: '',
    location: '',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isViewingForm) {
      fetchMemories();
    }
  }, [selectedYear, debouncedSearch, isViewingForm]);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        academic_year: selectedYear,
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const data = await api.fetch(`/yearbook/memories?${query.toString()}`);
      setMemories(data || []);
    } catch {
      toast.error('Failed to load shared memories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemoryMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setMemoryFile(file);
    setMemoryPreview(URL.createObjectURL(file));
  };

  const submitMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    try {
      let mediaUrl = '';
      if (memoryFile) {
        const uploadData = new FormData();
        uploadData.append('file', memoryFile);
        const uploaded = await api.fetch('/yearbook/memories/media', {
          method: 'POST',
          body: uploadData,
          headers: {},
        });
        mediaUrl = uploaded.url;
      }

      await api.fetch('/yearbook/memories', {
        method: 'POST',
        body: JSON.stringify({
          academic_year: selectedYear,
          ...memoryForm,
          media_url: mediaUrl,
        }),
      });

      toast.success('Memory submitted for review');
      setIsViewingForm(false);
      setMemoryFile(null);
      setMemoryPreview('');
      setMemoryForm({ title: '', story: '', event_name: '', location: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMemories = memories.filter((memory) => {
    if (roleFilter === 'all') return true;
    if (roleFilter === 'faculty') return memory.author_role === 'faculty' || memory.author_role === 'admin';
    return memory.author_role === roleFilter;
  });

  const facultyMemories = filteredMemories.filter(m => m.author_role === 'faculty' || m.author_role === 'admin');
  const alumniMemories = filteredMemories.filter(m => m.author_role === 'alumni');
  const studentMemories = filteredMemories.filter(m => m.author_role === 'student');

  const MemoryCard = ({ memory }: { memory: MemorySubmission }) => (
    <Card 
      className="group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col cursor-pointer"
      onClick={() => setSelectedMemory(memory)}
    >
      {memory.media_url ? (
        <div className="relative aspect-video overflow-hidden bg-black flex items-center justify-center">
          {isVideoUrl(memory.media_url) ? (
            <video src={getBackendAssetUrl(memory.media_url)} className="h-full w-full object-contain opacity-90 transition-opacity group-hover:opacity-100" />
          ) : (
            <img src={getBackendAssetUrl(memory.media_url)} alt={memory.title} className="h-full w-full object-contain opacity-90 transition-all group-hover:opacity-100 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-md text-white border border-white/30">
              <Eye className="h-6 w-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-8 text-center">
           <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{memory.title}</h3>
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 shrink-0">{formatDate(memory.created_at)}</span>
          </div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
            By {memory.author_name || 'Contributor'} • <span className="capitalize">{memory.author_role}</span>
          </p>
        </div>
        
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-4 flex-1">
          {memory.story}
        </p>

        {(memory.event_name || memory.location) && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="line-clamp-1">{memory.event_name || 'Event'}</span>
            {memory.location && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 shrink-0" />
                <span className="line-clamp-1">{memory.location}</span>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  if (isViewingForm) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsViewingForm(false)} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Memories
          </Button>
        </div>
        
        <PageHeader 
          title="Share a Memory" 
          description="Contribute to the department history by sharing your experiences." 
        />

        <Card as="form" onSubmit={submitMemory} className="p-8 border-2 border-blue-100 dark:border-blue-900/30 shadow-xl shadow-blue-500/5">
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Memory Title</label>
                <Input
                  value={memoryForm.title}
                  onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
                  placeholder="e.g. Graduation Day 2024"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Event Name (Optional)</label>
                <Input
                  value={memoryForm.event_name}
                  onChange={(e) => setMemoryForm({ ...memoryForm, event_name: e.target.value })}
                  placeholder="e.g. Annual Symposium"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Location (Optional)</label>
              <Input
                value={memoryForm.location}
                onChange={(e) => setMemoryForm({ ...memoryForm, location: e.target.value })}
                placeholder="e.g. Main Auditorium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Your Story</label>
              <Textarea
                value={memoryForm.story}
                onChange={(e) => setMemoryForm({ ...memoryForm, story: e.target.value })}
                placeholder="Tell us about this moment..."
                rows={6}
                maxLength={2000}
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Attach Media (Optional)</label>
              {memoryPreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-inner">
                  {memoryFile?.type.startsWith('video/') ? (
                    <video src={memoryPreview} className="max-h-96 w-full object-contain" controls />
                  ) : (
                    <img src={memoryPreview} alt="Memory preview" className="max-h-96 w-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setMemoryFile(null); setMemoryPreview(''); }}
                    className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition hover:bg-black/75"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Upload Photo or Video</p>
                    <p className="text-xs text-gray-500">Share the visual moment</p>
                  </div>
                  <input type="file" accept={ACCEPTED_MEDIA_TYPES} onChange={handleMemoryMediaChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1 py-4 text-lg">
                {isSubmitting ? 'Submitting...' : 'Share Memory'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsViewingForm(false)} className="flex-1 py-4 text-lg">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PageHeader 
          title="Shared Memories" 
          description="A living gallery of our community's journey through the years." 
        />
        <Button
          onClick={() => setIsViewingForm(true)}
          className="shadow-lg shadow-blue-500/10 py-3 px-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Share a New Memory
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-6 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-auto font-semibold"
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

          <div className="flex items-center gap-3 border-l pl-4 dark:border-gray-700">
            <Filter className="h-5 w-5 text-gray-400" />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-auto font-semibold"
            >
              <option value="all">All Stories</option>
              <option value="student">Student Life</option>
              <option value="alumni">Alumni Legacy</option>
              <option value="faculty">Faculty & Staff</option>
            </Select>
          </div>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles or stories..."
            className="pl-12 py-3 rounded-2xl"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <EmptyState 
          icon={MessageSquare} 
          description={debouncedSearch ? "No memories match your search." : `No memories found for the selected filters.`}
        />
      ) : (
        <div className="space-y-16">
          {/* Faculty Section */}
          {facultyMemories.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Faculty & Staff Stories</h2>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {facultyMemories.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                ))}
              </div>
            </section>
          )}

          {/* Alumni Section */}
          {alumniMemories.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alumni Legacy</h2>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {alumniMemories.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                ))}
              </div>
            </section>
          )}

          {/* Student Section */}
          {studentMemories.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Life</h2>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {studentMemories.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <Modal
          isOpen={!!selectedMemory}
          onClose={() => setSelectedMemory(null)}
          title="Shared Memory"
          size="lg"
        >
          <div className="space-y-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
              {selectedMemory.media_url ? (
                isVideoUrl(selectedMemory.media_url) ? (
                  <video 
                    src={getBackendAssetUrl(selectedMemory.media_url)} 
                    className="w-full h-full object-contain" 
                    controls
                    autoPlay
                  />
                ) : (
                  <img 
                    src={getBackendAssetUrl(selectedMemory.media_url)} 
                    className="w-full h-full object-contain" 
                    alt={selectedMemory.title}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <MessageSquare className="h-20 w-20 text-gray-300" />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{selectedMemory.title}</h2>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  By {selectedMemory.author_name} • <span className="capitalize">{selectedMemory.author_role}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Year</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedMemory.academic_year}</p>
                  </div>
                </div>
                {selectedMemory.location && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400">Location</p>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedMemory.location}</p>
                    </div>
                  </div>
                )}
                {selectedMemory.event_name && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <Tag className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400">Event</p>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedMemory.event_name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-gray-400 ml-1">The Story</p>
                <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-inner">
                  <p className="text-xl text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                    {selectedMemory.story}
                  </p>
                </div>
              </div>

              <div className="pt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Posted on {formatDate(selectedMemory.created_at)}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
