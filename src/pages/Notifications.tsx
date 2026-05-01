import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import type { Notification } from '../lib/types';
import { Button, Card, EmptyState, PageHeader, Spinner } from '../components/ui';
import { formatDate } from '../lib/utils';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetch('/notifications');
      setNotifications(data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    try {
      const updated = await api.fetch(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((items) => items.map((item) => item.id === id ? updated : item));
    } catch {
      toast.error('Could not update notification');
    }
  };

  const markAllRead = async () => {
    setIsUpdating(true);
    try {
      await api.fetch('/notifications/mark-all-read', { method: 'PUT' });
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch {
      toast.error('Could not mark notifications read');
    } finally {
      setIsUpdating(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Yearbook decisions, connection requests, and system updates."
        action={
          unreadCount > 0 ? (
            <Button onClick={markAllRead} disabled={isUpdating} variant="secondary">
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Important updates will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className="p-4">
              <div className="flex gap-4">
                <span className={notification.is_read ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}>
                  {notification.is_read ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5 fill-current" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="font-semibold text-gray-950 dark:text-white">{notification.title}</h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notification.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{notification.message}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {notification.link && (
                      <Link
                        to={notification.link}
                        onClick={() => !notification.is_read && markRead(notification.id)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Open
                      </Link>
                    )}
                    {!notification.is_read && (
                      <button
                        onClick={() => markRead(notification.id)}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
