import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { BookOpen, Heart, CheckCircle, XCircle, Eye, ChevronLeft, Calendar, User, MapPin, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState, PageHeader, Spinner, Modal } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { getBackendAssetUrl, isVideoUrl, formatDate } from '../../lib/utils';

export const ContentModeration: React.FC = () => {
  const navigate = useNavigate();
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [pendingMemories, setPendingMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'yearbook' | 'memory'>('yearbook');

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    setIsLoading(true);
    try {
      const [entries, memories] = await Promise.all([
        api.fetch('/yearbook/pending'),
        api.fetch('/yearbook/memories/pending')
      ]);
      setPendingEntries(entries || []);
      setPendingMemories(memories || []);
    } catch {
      toast.error('Failed to load pending content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (id: string, type: 'yearbook' | 'memory', status: 'approved' | 'rejected') => {
    try {
      const reason = status === 'rejected' 
        ? window.prompt('Reason for rejection?') 
        : undefined;

      if (status === 'rejected' && !reason) return;

      const endpoint = type === 'yearbook' 
        ? `/yearbook/${id}/status` 
        : `/yearbook/memories/${id}/status`;

      await api.fetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ status, rejection_reason: reason })
      });

      toast.success(`${type === 'yearbook' ? 'Entry' : 'Memory'} ${status}`);
      setSelectedItem(null);
      fetchPendingContent();
    } catch {
      toast.error('Moderation failed');
    }
  };

  const ContentCard = ({ item, type }: { item: any, type: 'yearbook' | 'memory' }) => (
    <Card className="overflow-hidden flex flex-col h-full border-2 border-gray-100 hover:border-blue-100 transition-all group">
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {(type === 'yearbook' ? item.profile_image_url : item.media_url) ? (
          isVideoUrl(type === 'yearbook' ? item.profile_image_url : item.media_url) ? (
            <video 
              src={getBackendAssetUrl(type === 'yearbook' ? item.profile_image_url : item.media_url)} 
              className="w-full h-full object-cover opacity-80" 
            />
          ) : (
            <img 
              src={getBackendAssetUrl(type === 'yearbook' ? item.profile_image_url : item.media_url)} 
              className="w-full h-full object-cover opacity-80" 
              alt="Content"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            {type === 'yearbook' ? <User className="h-12 w-12 text-gray-300" /> : <Heart className="h-12 w-12 text-gray-300" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <Button variant="secondary" size="sm" onClick={() => setSelectedItem({ ...item, type })} className="w-full bg-white/20 text-white backdrop-blur-md border-white/30 hover:bg-white/40">
            <Eye className="h-4 w-4 mr-2" /> View Details
          </Button>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">
              {type === 'yearbook' ? item.author_name : item.title}
            </h3>
            <p className="text-xs text-blue-600 font-semibold">{type === 'yearbook' ? item.course : `By ${item.author_name}`}</p>
          </div>
          <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-bold uppercase tracking-wider text-gray-500">
            {item.academic_year}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 italic">
          "{type === 'yearbook' ? item.yearbook_quote : item.story}"
        </p>
        <div className="mt-auto flex gap-2">
          <Button 
            variant="secondary" 
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => handleModerate(item.id, type, 'rejected')}
          >
            <XCircle className="h-4 w-4 mr-2" /> Reject
          </Button>
          <Button 
            className="flex-1"
            onClick={() => handleModerate(item.id, type, 'approved')}
          >
            <CheckCircle className="h-4 w-4 mr-2" /> Approve
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/dashboard')}
        className="-ml-2 flex items-center gap-2 text-gray-600"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <PageHeader 
        title="Content Moderation" 
        description="Review and approve yearbook entries and shared memories before they go public." 
      />

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('yearbook')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'yearbook' 
              ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Yearbook Queue ({pendingEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'memory' 
              ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Memories Queue ({pendingMemories.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-12 w-12" /></div>
      ) : (activeTab === 'yearbook' ? pendingEntries : pendingMemories).length === 0 ? (
        <EmptyState 
          icon={CheckCircle} 
          title="All Caught Up!" 
          description={`No pending ${activeTab === 'yearbook' ? 'yearbook entries' : 'memories'} to moderate.`} 
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(activeTab === 'yearbook' ? pendingEntries : pendingMemories).map((item) => (
            <ContentCard key={item.id} item={item} type={activeTab} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.type === 'yearbook' ? 'Yearbook Entry Details' : 'Memory Details'}
          size="lg"
        >
          <div className="space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
              {(selectedItem.type === 'yearbook' ? selectedItem.profile_image_url : selectedItem.media_url) ? (
                isVideoUrl(selectedItem.type === 'yearbook' ? selectedItem.profile_image_url : selectedItem.media_url) ? (
                  <video 
                    src={getBackendAssetUrl(selectedItem.type === 'yearbook' ? selectedItem.profile_image_url : selectedItem.media_url)} 
                    className="w-full h-full object-contain" 
                    controls
                  />
                ) : (
                  <img 
                    src={getBackendAssetUrl(selectedItem.type === 'yearbook' ? selectedItem.profile_image_url : selectedItem.media_url)} 
                    className="w-full h-full object-contain" 
                    alt="Content"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <User className="h-20 w-20 text-gray-300" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Author</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedItem.author_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Year</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedItem.academic_year}</p>
                </div>
              </div>
              {selectedItem.type === 'memory' && selectedItem.location && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Location</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedItem.location}</p>
                  </div>
                </div>
              )}
              {selectedItem.type === 'yearbook' && selectedItem.course && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Tag className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Course</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedItem.course}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-gray-400 ml-1">Content</p>
              <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl italic text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-700 shadow-inner">
                "{selectedItem.type === 'yearbook' ? selectedItem.yearbook_quote : selectedItem.story}"
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                variant="secondary" 
                className="flex-1 py-4 text-red-600 border-red-100 hover:bg-red-50"
                onClick={() => handleModerate(selectedItem.id, selectedItem.type, 'rejected')}
              >
                Reject Entry
              </Button>
              <Button 
                className="flex-1 py-4"
                onClick={() => handleModerate(selectedItem.id, selectedItem.type, 'approved')}
              >
                Approve Entry
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
