import React, { useEffect, useState } from 'react';
import { Award, BookOpen, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';

const adminStats = [
  { key: 'totalUsers', icon: Users, label: 'Total Users' },
  { key: 'totalYearbookEntries', icon: BookOpen, label: 'Yearbook Entries' },
  { key: 'pendingEntries', icon: Award, label: 'Pending Approval' },
  { key: 'userConnections', icon: CheckCircle, label: 'Active Connections' },
] as const;

const roleCards = {
  student: [
    {
      title: 'Share Your Yearbook Entry',
      description: 'Create a memorable yearbook entry with a photo, quote, and memories.',
      action: 'Create Entry',
      variant: 'primary' as const,
      className: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Connect with Alumni',
      description: 'Network with graduates and learn about their career journeys.',
      action: 'Browse Alumni',
      variant: 'success' as const,
      className: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ],
  alumni: [
    {
      title: 'Your Network',
      description: 'Stay connected with current students and other alumni.',
      action: 'View Connections',
      variant: 'primary' as const,
      className: '',
    },
    {
      title: 'Update Your Profile',
      description: 'Share your current role, company, and career achievements.',
      action: 'Edit Profile',
      variant: 'primary' as const,
      className: '',
    },
  ],
};

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalYearbookEntries: 0,
    pendingEntries: 0,
    userConnections: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.fetch('/users/stats');
        setStats({
          totalUsers: data.totalUsers || 0,
          totalYearbookEntries: data.totalYearbookEntries || 0,
          pendingEntries: data.pendingEntries || 0,
          userConnections: data.userConnections || 0,
        });
      } catch {
        toast.error('Failed to load stats');
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${profile?.full_name || 'there'}`}
        description="Here's what's happening on DTCY today."
      />

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {adminStats.map(({ key, icon: Icon, label }) => (
            <Card key={key} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats[key]}</p>
                </div>
                <Icon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {user?.role === 'student' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {roleCards.student.map((card) => (
            <Card key={card.title} className={`p-6 ${card.className}`}>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
              <Button variant={card.variant} className="mt-4">
                {card.action}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {user?.role === 'faculty' && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Yearbook Submissions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and approve student yearbook entries from your classes.
          </p>
          <Button className="mt-4">Review Entries</Button>
        </Card>
      )}

      {user?.role === 'alumni' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {roleCards.alumni.map((card) => (
            <Card key={card.title} className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
              <Button className="mt-4">{card.action}</Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Announcements</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">No announcements yet. Stay tuned for updates!</p>
      </Card>
    </div>
  );
};
