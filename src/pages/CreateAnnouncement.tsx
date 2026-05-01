import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ImagePlus, X, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { Button, Card, Input, PageHeader, Select, Spinner, Textarea } from '../components/ui';
import { PUBLIC_SIGNUP_ROLES } from '../lib/constants';

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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit');
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

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      let mediaUrl = '';
      if (announcementMedia) {
        const formData = new FormData();
        formData.append('file', announcementMedia);
        const res = await api.fetch('/announcements/media', {
          method: 'POST',
          body: formData,
        });
        mediaUrl = res.url;
      }

      await api.fetch('/announcements', {
        method: 'POST',
        body: JSON.stringify({ ...announcement, media_url: mediaUrl }),
      });
      toast.success('Announcement published');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader 
          title="Create Announcement" 
          description="Share updates, news, and media with the community" 
        />
      </div>

      <Card className="p-8">
        <form onSubmit={handlePublishAnnouncement} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Announcement Title</label>
            <Input
              type="text"
              value={announcement.title}
              onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              placeholder="e.g. Graduation Ceremony 2026 Details"
              required
              className="text-lg py-6"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Content</label>
            <Textarea
              value={announcement.content}
              onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
              placeholder="Write your announcement message here..."
              required
              rows={8}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Audience</label>
            <div className="flex flex-wrap gap-3">
              {['student', 'faculty', 'alumni'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleToggle(role)}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    announcement.target_roles.includes(role)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
              <p className="w-full text-xs text-gray-500 mt-1 italic">Leave empty to target everyone.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Media (Optional)</label>
            {!announcementMediaPreview ? (
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 cursor-pointer hover:border-blue-500 transition-colors dark:bg-gray-800 dark:border-gray-700">
                <ImagePlus className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Image or Video</span>
                <span className="text-xs text-gray-500 mt-1">Max size: 50MB</span>
                <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncementMedia(null);
                    setAnnouncementMediaPreview('');
                  }}
                  className="absolute right-3 top-3 z-10 rounded-full bg-red-600 p-2 text-white hover:bg-red-700 transition-colors shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
                {announcementMedia?.type.startsWith('video/') ? (
                  <video src={announcementMediaPreview} className="aspect-video w-full object-contain" controls />
                ) : (
                  <img src={announcementMediaPreview} alt="Preview" className="aspect-video w-full object-contain" />
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t dark:border-gray-700">
            <Button type="submit" disabled={isPublishing} className="w-full h-14 text-lg">
              {isPublishing ? <Spinner className="h-5 w-5 mr-2" /> : <Send className="h-5 w-5 mr-2" />}
              Publish Announcement
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
