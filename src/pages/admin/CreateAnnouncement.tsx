import React, { useState } from 'react';
import { api } from '../../lib/api';
import { ImagePlus, X, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input, PageHeader, Textarea } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { USER_ROLES } from '../../lib/constants';

export const CreateAnnouncement: React.FC = () => {
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    target_roles: [] as string[],
    media_url: '',
  });

  const [announcementMedia, setAnnouncementMedia] = useState<File | null>(null);
  const [announcementMediaPreview, setAnnouncementMediaPreview] = useState('');

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.title || !announcement.content || announcement.target_roles.length === 0) {
      toast.error('Please fill all fields and select at least one role');
      return;
    }

    setIsPublishing(true);
    try {
      let media_url = '';
      if (announcementMedia) {
        const uploadData = new FormData();
        uploadData.append('file', announcementMedia);
        const uploaded = await api.fetch('/announcements/media', {
          method: 'POST',
          body: uploadData,
          headers: {},
        });
        media_url = uploaded.url;
      }

      await api.fetch('/announcements', {
        method: 'POST',
        body: JSON.stringify({ ...announcement, media_url })
      });

      toast.success('Announcement published successfully');
      setAnnouncement({ title: '', content: '', target_roles: [], media_url: '' });
      setAnnouncementMedia(null);
      setAnnouncementMediaPreview('');
    } catch {
      toast.error('Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAnnouncementMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please choose an image or video file');
      return;
    }

    setAnnouncementMedia(file);
    setAnnouncementMediaPreview(URL.createObjectURL(file));
  };

  const handleRoleToggle = (role: string) => {
    setAnnouncement((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter((r) => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  return (
    <div className="space-y-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/announcements')}
        className="-ml-2 flex items-center gap-2 text-gray-600"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Announcements
      </Button>

      <PageHeader 
        title="Create Announcement" 
        description="Send a message to specific user roles" 
      />

      <Card className="max-w-3xl p-8">
        <form onSubmit={handlePublishAnnouncement} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Title</label>
              <Input
                type="text"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="e.g. Campus Holiday Notice"
                className="text-lg font-semibold"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Message Content</label>
              <Textarea
                value={announcement.content}
                onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                placeholder="Write your announcement message here..."
                rows={8}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-500 uppercase block">Media Attachment (Optional)</label>
              {announcementMediaPreview && (
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  {announcementMedia?.type.startsWith('video/') ? (
                    <video src={announcementMediaPreview} className="max-h-64 w-full object-cover" controls />
                  ) : (
                    <img src={announcementMediaPreview} alt="Preview" className="max-h-64 w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setAnnouncementMedia(null); setAnnouncementMediaPreview(''); }}
                    className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/30 py-8 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                <ImagePlus className="h-8 w-8 text-blue-500" />
                <span>{announcementMediaPreview ? 'Change Photo or Video' : 'Click to upload media'}</span>
                <input type="file" accept="image/*,video/*" onChange={handleAnnouncementMedia} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-500 uppercase block">Target Audience</label>
              <div className="flex flex-wrap gap-6 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              {USER_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcement.target_roles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{role}s</span>
                </label>
              ))}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isPublishing} className="w-full py-4 text-lg">
            {isPublishing ? 'Publishing Announcement...' : 'Post Announcement'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
