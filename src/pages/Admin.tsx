import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { Users, BookOpen, CheckCircle, AlertCircle, Zap, ChevronDown, ChevronUp, Megaphone, ImagePlus, X, UserPlus, Upload, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState, Input, PageHeader, Select, Spinner, Textarea } from '../components/ui';
import { PUBLIC_SIGNUP_ROLES } from '../lib/constants';

export const Admin: React.FC = () => {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    studentCount: 0,
    facultyCount: 0,
    alumniCount: 0,
    adminCount: 0,
    totalYearbookEntries: 0,
    approvedEntries: 0,
    pendingEntries: 0,
    totalConnections: 0,
    acceptedConnections: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [yearOfStudy, setYearOfStudy] = useState(4);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showModeration, setShowModeration] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showStudentManager, setShowStudentManager] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingStudents, setIsCreatingStudents] = useState(false);

  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    target_roles: [] as string[],
    media_url: '',
  });

  const [manualStudent, setManualStudent] = useState({
    email: '',
    full_name: '',
    student_id: '',
    graduation_year: new Date().getFullYear() + 4,
  });

  const [announcementMedia, setAnnouncementMedia] = useState<File | null>(null);
  const [announcementMediaPreview, setAnnouncementMediaPreview] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetch('/users/stats');
      // Backend returns full stats map for admin
      setStats({
        totalUsers: data.totalUsers || 0,
        studentCount: data.studentCount || 0,
        facultyCount: data.facultyCount || 0,
        alumniCount: data.alumniCount || 0,
        adminCount: data.adminCount || 0,
        totalYearbookEntries: data.totalYearbookEntries || 0,
        approvedEntries: (data.totalYearbookEntries || 0) - (data.pendingEntries || 0),
        pendingEntries: data.pendingEntries || 0,
        totalConnections: data.userConnections || 0,
        acceptedConnections: data.userConnections || 0,
      });
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  };

  const processGraduations = async () => {
    setIsProcessing(true);
    try {
      await api.fetch('/users/graduate', {
        method: 'POST',
        body: JSON.stringify({ year_of_study: yearOfStudy })
      });

      toast.success(`Successfully transitioned students to alumni!`);
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process graduations');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchPendingQueue = async () => {
    setLoadingQueue(true);
    try {
      // Use the existing yearbook endpoint with pending filter if I had one, 
      // or assume /yearbook?status=pending exists (I should check backend)
      const data = await api.fetch('/yearbook/pending');
      setPendingQueue(data || []);
    } catch {
      toast.error('Failed to fetch pending entries');
    } finally {
      setLoadingQueue(false);
    }
  };

  const toggleModeration = () => {
    if (!showModeration) {
      fetchPendingQueue();
    }
    setShowModeration(!showModeration);
  };

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.fetch(`/yearbook/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      toast.success(`Entry ${status} successfully`);
      setPendingQueue((prev) => prev.filter(e => e.id !== id));
      fetchStats();
    } catch {
      toast.error('Failed to moderate entry');
    }
  };

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
      setShowAnnouncement(false);
      fetchStats();
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

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStudents(true);
    try {
      await api.fetch('/admin/students', {
        method: 'POST',
        body: JSON.stringify({ students: [manualStudent] })
      });
      toast.success('Student account created');
      setManualStudent({
        email: '',
        full_name: '',
        student_id: '',
        graduation_year: new Date().getFullYear() + 4,
      });
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create student');
    } finally {
      setIsCreatingStudents(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const students = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          students.push({
            email: parts[0].trim(),
            full_name: parts[1].trim(),
            student_id: parts[2]?.trim() || `STU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            graduation_year: parseInt(parts[3]?.trim()) || new Date().getFullYear() + 4,
          });
        }
      }

      if (students.length === 0) {
        toast.error('No valid students found in CSV');
        return;
      }

      setIsCreatingStudents(true);
      try {
        const results = await api.fetch('/admin/students', {
          method: 'POST',
          body: JSON.stringify({ students })
        });
        toast.success(`Successfully imported ${results.length} students`);
        fetchStats();
      } catch (err: any) {
        toast.error('Bulk upload failed');
      } finally {
        setIsCreatingStudents(false);
      }
    };
    reader.readAsText(file);
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard" description="Manage users, content, and system operations" />

      {isLoading ? (
        <div className="flex justify-center">
          <Spinner className="h-12 w-12" />
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                User Statistics
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                <StatCard icon={Users} label="Total" value={stats.totalUsers} color="bg-blue-600" />
                <StatCard icon={Users} label="Students" value={stats.studentCount} color="bg-green-600" />
                <StatCard icon={Users} label="Faculty" value={stats.facultyCount} color="bg-purple-600" />
                <StatCard icon={Users} label="Alumni" value={stats.alumniCount} color="bg-orange-600" />
                <StatCard icon={Users} label="Admins" value={stats.adminCount} color="bg-red-600" />
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Yearbook Statistics
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <StatCard icon={BookOpen} label="Total Entries" value={stats.totalYearbookEntries} color="bg-blue-600" />
                <StatCard icon={CheckCircle} label="Approved" value={stats.approvedEntries} color="bg-green-600" />
                <StatCard icon={AlertCircle} label="Pending" value={stats.pendingEntries} color="bg-yellow-600" />
              </div>
            </div>

            {profile?.role === 'admin' && (
              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                  <Zap className="h-6 w-6 text-yellow-600" />
                  Process Graduations
                </h2>
                <div className="flex gap-4">
                  <Select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(parseInt(e.target.value))}
                    className="w-auto"
                  >
                    {[4, 5, 6, 7].map((year) => (
                      <option key={year} value={year}>Year {year} Students</option>
                    ))}
                  </Select>
                  <Button
                    onClick={processGraduations}
                    disabled={isProcessing}
                    className="px-6"
                  >
                    {isProcessing ? 'Processing...' : 'Transition to Alumni'}
                  </Button>
                </div>
              </Card>
            )}

            {profile?.role === 'admin' && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowStudentManager(!showStudentManager)}
                  className="flex w-full items-center justify-between rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4 dark:bg-gray-800 dark:border-gray-600"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    Manage Students (Add Manual/Bulk)
                  </span>
                  {showStudentManager ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {showStudentManager && (
                  <Card className="p-6">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      {/* Manual Entry */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <UserPlus className="h-5 w-5 text-blue-600" />
                          Manual Student Entry
                        </h3>
                        <form onSubmit={handleCreateStudent} className="space-y-3">
                          <Input
                            placeholder="Full Name"
                            value={manualStudent.full_name}
                            onChange={(e) => setManualStudent({ ...manualStudent, full_name: e.target.value })}
                            required
                          />
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={manualStudent.email}
                            onChange={(e) => setManualStudent({ ...manualStudent, email: e.target.value })}
                            required
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="Student ID"
                              value={manualStudent.student_id}
                              onChange={(e) => setManualStudent({ ...manualStudent, student_id: e.target.value })}
                              required
                            />
                            <Input
                              type="number"
                              placeholder="Grad Year"
                              value={manualStudent.graduation_year}
                              onChange={(e) => setManualStudent({ ...manualStudent, graduation_year: parseInt(e.target.value) })}
                              required
                            />
                          </div>
                          <Button type="submit" disabled={isCreatingStudents} className="w-full">
                            {isCreatingStudents ? 'Creating...' : 'Create Account'}
                          </Button>
                        </form>
                      </div>

                      {/* Bulk Upload */}
                      <div className="flex flex-col space-y-4 border-l pl-8 dark:border-gray-700">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <Upload className="h-5 w-5 text-purple-600" />
                          Bulk CSV Import
                        </h3>
                        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-700 dark:bg-gray-900/50">
                          <FileSpreadsheet className="mb-3 h-10 w-10 text-gray-400" />
                          <p className="mb-1 text-sm font-medium text-gray-900 dark:text-white">Upload CSV File</p>
                          <p className="mb-4 text-xs text-gray-500">Format: email, name, id, grad_year</p>
                          <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            Select File
                            <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => setShowAnnouncement(!showAnnouncement)}
                className="flex w-full items-center justify-between rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4 dark:bg-gray-800 dark:border-gray-600"
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                  Create New Announcement
                </span>
                {showAnnouncement ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {showAnnouncement && (
                <Card className="p-6">
                  <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                    <Input
                      type="text"
                      value={announcement.title}
                      onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                      placeholder="Announcement Title"
                    />
                    <Textarea
                      value={announcement.content}
                      onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                      placeholder="Write your announcement here..."
                      rows={4}
                    />

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Photo or Video (Optional)</p>
                      {announcementMediaPreview && (
                        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                          {announcementMedia?.type.startsWith('video/') ? (
                            <video src={announcementMediaPreview} className="max-h-48 w-full object-cover" controls />
                          ) : (
                            <img src={announcementMediaPreview} alt="Preview" className="max-h-48 w-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => { setAnnouncementMedia(null); setAnnouncementMediaPreview(''); }}
                            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        <ImagePlus className="h-5 w-5" />
                        <span>{announcementMediaPreview ? 'Change Media' : 'Upload Photo or Video'}</span>
                        <input type="file" accept="image/*,video/*" onChange={handleAnnouncementMedia} className="hidden" />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Audience</p>
                      <div className="flex flex-wrap gap-4">
                      {PUBLIC_SIGNUP_ROLES.map((role) => (
                        <label key={role} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={announcement.target_roles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                          />
                          <span className="capitalize dark:text-white">{role}</span>
                        </label>
                      ))}
                      </div>
                    </div>
                    <Button type="submit" disabled={isPublishing} className="px-6">
                      {isPublishing ? 'Publishing...' : 'Publish'}
                    </Button>
                  </form>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={toggleModeration}
                className="flex w-full items-center justify-between rounded-lg bg-blue-600 px-6 py-4 text-white"
              >
                <span>Review Yearbook Entries ({stats.pendingEntries} Pending)</span>
                {showModeration ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {showModeration && (
                <Card className="p-6">
                  {loadingQueue ? (
                    <div className="flex justify-center p-4">
                      <Spinner className="h-8 w-8" />
                    </div>
                  ) : pendingQueue.length === 0 ? (
                    <EmptyState description="No pending entries to review." />
                  ) : (
                    <div className="space-y-6">
                      {pendingQueue.map((entry) => (
                        <div key={entry.id} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/50">
                          <div className="flex flex-col md:flex-row">
                            {entry.profile_image_url && (
                              <div className="w-full md:w-48 shrink-0 bg-gray-200 dark:bg-gray-800">
                                {/\.(mp4|webm|mov)(\?.*)?$/i.test(entry.profile_image_url) ? (
                                  <video 
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${entry.profile_image_url}`} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <img 
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${entry.profile_image_url}`} 
                                    alt="Pending entry" 
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                            )}
                            <div className="flex-1 p-5">
                              <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{entry.author_name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{entry.academic_year} Academic Year</p>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quote</p>
                                  <p className="text-sm italic text-gray-700 dark:text-gray-300">"{entry.yearbook_quote}"</p>
                                </div>
                                {entry.favorite_memory && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Favorite Memory</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{entry.favorite_memory}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-6 flex gap-3">
                                <Button onClick={() => handleModerate(entry.id, 'approved')} variant="success" className="flex-1">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button onClick={() => handleModerate(entry.id, 'rejected')} variant="danger" className="flex-1">
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
