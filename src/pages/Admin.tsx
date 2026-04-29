import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, BookOpen, CheckCircle, AlertCircle, Zap, ChevronDown, ChevronUp, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState, Input, PageHeader, Select, Spinner, Textarea } from '../components/ui';
import { PUBLIC_SIGNUP_ROLES } from '../lib/constants';

export const Admin: React.FC = () => {
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    target_roles: [] as string[],
  });

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
        approvedEntries: data.totalYearbookEntries || 0, // Simplified for now
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
      const data = await api.fetch('/yearbook?status=pending');
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
      await api.fetch('/announcements', {
        method: 'POST',
        body: JSON.stringify(announcement)
      });

      toast.success('Announcement published successfully');
      setAnnouncement({ title: '', content: '', target_roles: [] });
      setShowAnnouncement(false);
    } catch {
      toast.error('Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setAnnouncement((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter((r) => r !== role)
        : [...prev.target_roles, role],
    }));
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
                    <div className="flex gap-4">
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
                        <div key={entry.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:text-white">
                          <h3 className="font-semibold">{entry.full_name}</h3>
                          <p className="text-sm italic">"{entry.yearbook_quote}"</p>
                          <div className="mt-4 flex gap-3">
                            <Button onClick={() => handleModerate(entry.id, 'approved')} variant="success">Approve</Button>
                            <Button onClick={() => handleModerate(entry.id, 'rejected')} variant="danger">Reject</Button>
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
