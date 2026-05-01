import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { Megaphone, Plus, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState, PageHeader, Spinner } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { getBackendAssetUrl, isVideoUrl, formatDate } from '../lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  media_url?: string;
  target_roles: string[];
  created_at: string;
  author_name?: string;
}

export const Announcements: React.FC = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetch('/announcements');
      setAnnouncements(data || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const isStaff = profile?.role === 'admin' || profile?.role === 'faculty';

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PageHeader 
          title="Announcements" 
          description="Stay updated with the latest news and notices from the department." 
        />
        {isStaff && (
          <Button
            onClick={() => navigate('/admin/announcements')}
            className="shadow-lg shadow-blue-500/10 py-3 px-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Post New Announcement
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState 
          icon={Megaphone} 
          description="No active announcements at the moment. Check back later for updates." 
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {announcements.map((item) => (
            <Card key={item.id} className="overflow-hidden border-2 border-transparent hover:border-blue-100 transition-all group shadow-sm hover:shadow-xl">
              <div className="flex flex-col md:flex-row">
                {item.media_url && (
                  <div className="w-full md:w-80 h-64 md:h-auto overflow-hidden bg-black shrink-0">
                    {isVideoUrl(item.media_url) ? (
                      <video src={getBackendAssetUrl(item.media_url)} className="h-full w-full object-cover opacity-90" controls />
                    ) : (
                      <img src={getBackendAssetUrl(item.media_url)} alt="Announcement" className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                        <Megaphone className="h-3 w-3" />
                        Announcement
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Published By</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.author_name || 'Department Staff'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.target_roles.map((role) => (
                        <span key={role} className="text-[9px] font-black uppercase tracking-tighter text-gray-400 border border-gray-100 dark:border-gray-800 rounded px-2 py-0.5">
                          {role}s
                        </span>
                      ))}
                    </div>
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
