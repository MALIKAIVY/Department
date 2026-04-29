import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/stores/authStore';
import { api } from '../lib/api';
import { Upload, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateUserAndProfile } = useAuthStore();
  const [formData, setFormData] = useState<any | null>(profile || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url);
  const [isSaving, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !formData) return;

    setIsLoading(true);
    try {
      let avatarUrl = formData.avatar_url;

      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append('file', avatarFile);
        const res = await api.fetch('/upload', {
          method: 'POST',
          body: uploadData,
          headers: {} // Let browser set multipart boundary
        });
        avatarUrl = res.url;
      }

      const updatePayload = {
        ...formData,
        avatar_url: avatarUrl,
      };

      // Strip internal fields
      delete updatePayload.id;
      delete updatePayload.created_at;
      delete updatePayload.updated_at;
      delete updatePayload.email;
      delete updatePayload.role;

      const updatedProfile = await api.fetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      updateUserAndProfile(user, updatedProfile);
      toast.success('Profile updated successfully!');
      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile || !user || !formData) return null;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(`/profile/${user.id}`)}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Edit Profile
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Avatar
            </label>
            <div className="mt-4 flex items-end gap-6">
              <div className="h-24 w-24 rounded-full bg-linear-to-br from-blue-400 to-blue-600 overflow-hidden border-4 border-white dark:border-gray-800">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                    U
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-2 cursor-pointer hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400">
                <Upload className="h-5 w-5" />
                <span className="text-sm font-medium">Change Avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell us about yourself..."
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {user.role === 'alumni' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Company
                </label>
                <input
                  type="text"
                  value={formData.current_company || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, current_company: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.current_job_title || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, current_job_title: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${user.id}`)}
              className="flex-1 rounded-lg bg-gray-200 py-2 font-semibold text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
