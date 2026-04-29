import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, BookOpen, CheckCircle, Users, Megaphone } from 'lucide-react';
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
      href: '/yearbook',
      variant: 'primary' as const,
      className: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Connect with Alumni',
      description: 'Network with graduates and learn about their career journeys.',
      action: 'Browse Alumni',
      href: '/alumni',
      variant: 'success' as const,
      className: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ],
  alumni: [
    {
      title: 'Your Network',
      description: 'Stay connected with current students and other alumni.',
      action: 'View Connections',
      href: '/alumni',
      variant: 'primary' as const,
      className: '',
    },
    {
      title: 'Update Your Profile',
      description: 'Share your current role, company, and career achievements.',
      action: 'Edit Profile',
      href: '/profile/edit',
      variant: 'primary' as const,
      className: '',
    },
  ],
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalYearbookEntries: 0,
    pendingEntries: 0,
    userConnections: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);

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

    const fetchAnnouncements = async () => {
      try {
        const data = await api.fetch('/announcements');
        setAnnouncements(data);
      } catch {
        console.error('Failed to fetch announcements');
      }
    };

    fetchStats();
    fetchAnnouncements();
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
              <Button variant={card.variant} onClick={() => navigate(card.href)} className="mt-4">
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
              <Button onClick={() => navigate(card.href)} className="mt-4">{card.action}</Button>
            </Card>
          ))}
        </div>
      )}

      {user?.role === 'faculty' && (
        <Card className="p-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-full text-white">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Share an Update</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Publish a new announcement with photos or videos.</p>
              </div>
            </div>
            <Link to="/admin">
              <Button>Create Announcement</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Announcements</h2>
        {announcements.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No announcements yet. Stay tuned for updates!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {announcements.map((ann) => (
              <Card key={ann.id} className="overflow-hidden">
                {ann.media_url && (
                  <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800">
                    {/\.(mp4|webm|mov)(\?.*)?$/i.test(ann.media_url) ? (
                      <video 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ann.media_url}`} 
                        className="h-full w-full object-cover" 
                        controls 
                      />
                    ) : (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ann.media_url}`} 
                        alt={ann.title} 
                        className="h-full w-full object-cover" 
                      />
                    )}
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ann.title}</h3>
                    <span className="text-xs text-gray-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{ann.content}</p>
                  <div className="mt-4 flex items-center gap-2 border-t pt-4 dark:border-gray-700">
                    <div className="h-6 w-6 rounded-full bg-blue-100 p-1 text-xs font-bold text-blue-600 dark:bg-blue-900/30">
                      {ann.author_name?.charAt(0) || 'A'}
                    </div>
                    <span className="text-xs font-medium text-gray-500">By {ann.author_name}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
