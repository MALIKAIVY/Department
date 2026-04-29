import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/stores/authStore';
import { api } from '../lib/api';
import { Users, BookOpen, Award, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
      } catch (error) {
        toast.error('Failed to load stats');
      }
    };

    fetchStats();
  }, [user]);

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <Icon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile?.full_name}! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening on DTCY today.
        </p>
      </div>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
          <StatCard icon={BookOpen} label="Yearbook Entries" value={stats.totalYearbookEntries} />
          <StatCard icon={Award} label="Pending Approval" value={stats.pendingEntries} />
          <StatCard icon={CheckCircle} label="Active Connections" value={stats.userConnections} />
        </div>
      )}

      {user?.role === 'student' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:from-blue-900/20 dark:to-blue-800/20">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Share Your Yearbook Entry
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a memorable yearbook entry with a photo, quote, and memories.
            </p>
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
              Create Entry
            </button>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 dark:from-green-900/20 dark:to-green-800/20">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Connect with Alumni
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Network with graduates and learn about their career journeys.
            </p>
            <button className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              Browse Alumni
            </button>
          </div>
        </div>
      )}

      {user?.role === 'faculty' && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recent Yearbook Submissions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and approve student yearbook entries from your classes.
          </p>
          <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
            Review Entries
          </button>
        </div>
      )}

      {user?.role === 'alumni' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Your Network
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stay connected with current students and other alumni.
            </p>
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
              View Connections
            </button>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Update Your Profile
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share your current role, company, and career achievements.
            </p>
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
              Edit Profile
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Recent Announcements
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No announcements yet. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
};
