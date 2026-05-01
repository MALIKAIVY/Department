import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/stores/authStore';
import { api } from '../lib/api';
import { Upload, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Button, Card, Field, Input, Textarea } from '../components/ui';

export const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuthStore();
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
        const res = await api.fetch('/users/avatar', {
          method: 'POST',
          body: uploadData,
          headers: {} // Let browser set multipart boundary
        });
        avatarUrl = res.url;
      }

      const updatePayload: any = {
        full_name: formData.full_name,
        bio: formData.bio,
        phone: formData.phone,
        avatar_url: avatarUrl,
      };

      if (user.role === 'student') {
        updatePayload.student = formData.student;
      }
      if (user.role === 'faculty') {
        updatePayload.faculty = formData.faculty;
      }
      if (user.role === 'alumni') {
        updatePayload.alumni = formData.alumni;
      }

      const updatedProfile = await api.fetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      updateProfile(updatedProfile);
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
      <Button
        onClick={() => navigate(`/profile/${user.id}`)}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card as="form" onSubmit={handleSubmit} className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Edit Profile
        </h1>

        <div className="space-y-6">
          <Field label="Avatar">
            <div className="mt-4 flex items-end gap-6">
              <Avatar name={profile.full_name} src={avatarPreview} className="h-24 w-24 border-4 border-white text-3xl dark:border-gray-800" />
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
          </Field>

          <Field label="Full Name">
            <Input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </Field>

          <Field label="Bio">
            <Textarea
              value={formData.bio || ''}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </Field>

          {user.role === 'alumni' && (
            <>
              <Field label="Current Company">
                <Input
                  type="text"
                  value={formData.alumni?.current_company || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, alumni: { ...formData.alumni, current_company: e.target.value } })
                  }
                />
              </Field>
              <Field label="Position">
                <Input
                  type="text"
                  value={formData.alumni?.current_position || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, alumni: { ...formData.alumni, current_position: e.target.value } })
                  }
                />
              </Field>
              <Field label="Industry">
                <Input
                  type="text"
                  value={formData.alumni?.industry || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, alumni: { ...formData.alumni, industry: e.target.value } })
                  }
                />
              </Field>
              <Field label="LinkedIn URL">
                <Input
                  type="url"
                  value={formData.alumni?.linkedin_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, alumni: { ...formData.alumni, linkedin_url: e.target.value } })
                  }
                />
              </Field>
            </>
          )}

          {user.role === 'student' && (
            <>
              <Field label="LinkedIn URL">
                <Input
                  type="url"
                  value={formData.student?.linkedin_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, student: { ...formData.student, linkedin_url: e.target.value } })
                  }
                />
              </Field>
              <Field label="Portfolio URL">
                <Input
                  type="url"
                  value={formData.student?.portfolio_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, student: { ...formData.student, portfolio_url: e.target.value } })
                  }
                />
              </Field>
            </>
          )}

          {user.role === 'faculty' && (
            <>
              <Field label="Office Location">
                <Input
                  type="text"
                  value={formData.faculty?.office_location || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, faculty: { ...formData.faculty, office_location: e.target.value } })
                  }
                />
              </Field>
              <Field label="LinkedIn URL">
                <Input
                  type="url"
                  value={formData.faculty?.linkedin_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, faculty: { ...formData.faculty, linkedin_url: e.target.value } })
                  }
                />
              </Field>
            </>
          )}

          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate(`/profile/${user.id}`)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
