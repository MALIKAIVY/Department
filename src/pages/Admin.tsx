import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { Users, BookOpen, CheckCircle, Zap, ChevronDown, ChevronUp, Megaphone, Heart, Clock, UserPlus, Building2, CalendarPlus, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState, Input, PageHeader, Select, Spinner } from '../components/ui';
import { Link } from 'react-router-dom';

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
    pendingMemories: 0,
    totalConnections: 0,
    acceptedConnections: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [gradYearToProcess, setGradYearToProcess] = useState(new Date().getFullYear());
  const [transitionConfirm, setTransitionConfirm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showModeration, setShowModeration] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [showMemoryModeration, setShowMemoryModeration] = useState(false);
  const [pendingMemories, setPendingMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchStats(true);
      if (showModeration) fetchPendingQueue(true);
      if (showMemoryModeration) fetchPendingMemories(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [showModeration, showMemoryModeration]);

  const fetchStats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.fetch('/users/stats');
      setStats({
        totalUsers: data.totalUsers || 0,
        studentCount: data.studentCount || 0,
        facultyCount: data.facultyCount || 0,
        alumniCount: data.alumniCount || 0,
        adminCount: data.adminCount || 0,
        totalYearbookEntries: data.totalYearbookEntries || 0,
        approvedEntries: (data.totalYearbookEntries || 0) - (data.pendingEntries || 0),
        pendingEntries: data.pendingEntries || 0,
        pendingMemories: data.pendingMemories || 0,
        totalConnections: data.userConnections || 0,
        acceptedConnections: data.userConnections || 0,
      });
    } catch {
      if (!silent) toast.error('Failed to load stats');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchPendingQueue = async (silent = false) => {
    if (!silent) setLoadingQueue(true);
    try {
      const data = await api.fetch('/yearbook/pending');
      setPendingQueue(data || []);
    } catch {
      if (!silent) toast.error('Failed to fetch pending entries');
    } finally {
      if (!silent) setLoadingQueue(false);
    }
  };

  const fetchPendingMemories = async (silent = false) => {
    if (!silent) setLoadingMemories(true);
    try {
      const data = await api.fetch('/yearbook/memories/pending');
      setPendingMemories(data || []);
    } catch {
      if (!silent) toast.error('Failed to fetch pending memories');
    } finally {
      if (!silent) setLoadingMemories(false);
    }
  };

  const toggleModeration = () => {
    if (!showModeration) {
      fetchPendingQueue();
    }
    setShowModeration(!showModeration);
  };

  const toggleMemoryModeration = () => {
    if (!showMemoryModeration) {
      fetchPendingMemories();
    }
    setShowMemoryModeration(!showMemoryModeration);
  };

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const rejection_reason = status === 'rejected'
        ? window.prompt('Reason for rejection? This will be visible to the student.')
        : undefined;

      if (status === 'rejected' && !rejection_reason) {
        toast.error('A rejection reason is required');
        return;
      }

      await api.fetch(`/yearbook/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejection_reason })
      });
      
      toast.success(`Entry ${status} successfully`);
      setPendingQueue((prev) => prev.filter(e => e.id !== id));
      fetchStats(true);
    } catch {
      toast.error('Failed to moderate entry');
    }
  };

  const handleMemoryModerate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const rejection_reason = status === 'rejected'
        ? window.prompt('Reason for rejection? This will be visible to the contributor.')
        : undefined;

      if (status === 'rejected' && !rejection_reason) {
        toast.error('A rejection reason is required');
        return;
      }

      await api.fetch(`/yearbook/memories/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejection_reason })
      });

      toast.success(`Memory ${status} successfully`);
      setPendingMemories((prev) => prev.filter(memory => memory.id !== id));
      fetchStats(true);
    } catch {
      toast.error('Failed to moderate memory');
    }
  };

  const processGraduations = async () => {
    if (transitionConfirm !== 'CONFIRM') {
      toast.error('Type CONFIRM before running the transition');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await api.fetch('/users/graduate', {
        method: 'POST',
        body: JSON.stringify({ graduation_year: gradYearToProcess })
      });

      toast.success(`Transition complete: ${result.transitioned} students from Class of ${gradYearToProcess} are now Alumni.`);
      setTransitionConfirm('');
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process graduations');
    } finally {
      setIsProcessing(false);
    }
  };

  const PremiumStatCard = ({ icon: Icon, label, value, subtext, iconBg }: any) => (
    <Card className="flex items-center justify-between p-6 transition-all hover:shadow-md">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>
      </div>
      <div className={`rounded-xl p-3 ${iconBg}`}>
        <Icon className="h-6 w-6" />
      </div>
    </Card>
  );

  const QuickActionLink = ({ icon: Icon, label, to, color }: any) => (
    <Link 
      to={to}
      className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 transition-all hover:border-gray-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronRight className="h-6 w-6 text-gray-300" />
    </Link>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Manage users, content, and system operations" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-12 w-12" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Main Priority Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <PremiumStatCard 
              icon={Users} 
              label="Total users" 
              value={stats.totalUsers} 
              subtext="Active profiles in the system"
              iconBg="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <PremiumStatCard 
              icon={BookOpen} 
              label="Yearbook entries" 
              value={stats.approvedEntries} 
              subtext="Approved and visible stories"
              iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            />
            <PremiumStatCard 
              icon={Clock} 
              label="Pending approval" 
              value={stats.pendingEntries + stats.pendingMemories} 
              subtext="Needs moderation"
              iconBg="bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
            />
            <PremiumStatCard 
              icon={CheckCircle} 
              label="Connections" 
              value={stats.acceptedConnections} 
              subtext="Accepted mentorship links"
              iconBg="bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              {/* Quick Actions */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Quick Management Actions
                </h2>
                <div className="space-y-3">
                  <QuickActionLink 
                    icon={UserPlus} 
                    label="Manage Students (Add Manual/Bulk)" 
                    to="/admin/students" 
                    color="bg-blue-500"
                  />
                  <QuickActionLink 
                    icon={Building2} 
                    label="Manage Faculty Directory" 
                    to="/admin/faculty" 
                    color="bg-indigo-500"
                  />
                  <QuickActionLink 
                    icon={CalendarPlus} 
                    label="Manage Public Upcoming Events" 
                    to="/admin/events" 
                    color="bg-emerald-500"
                  />
                  <QuickActionLink 
                    icon={CheckCircle} 
                    label="Content Moderation (Approvals)" 
                    to="/admin/moderation" 
                    color="bg-orange-500"
                  />
                  <QuickActionLink 
                    to="/admin/users" 
                    icon={Users} 
                    label="User Records" 
                    color="bg-purple-500"
                  />
                  <QuickActionLink 
                    icon={Megaphone} 
                    label="Create New Announcement" 
                    to="/admin/announcements" 
                    color="bg-blue-600"
                  />
                </div>
              </div>

              {/* Moderation Queues */}
              <div className="space-y-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Moderation Queues
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <section className="space-y-4">
                    <button
                      onClick={toggleModeration}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-6 py-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                      <span className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900 dark:text-white">Yearbook Queue</span>
                        {stats.pendingEntries > 0 && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {stats.pendingEntries}
                          </span>
                        )}
                      </span>
                      {showModeration ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>

                    {showModeration && (
                      <Card className="p-4 overflow-hidden">
                        {loadingQueue ? (
                          <div className="flex justify-center py-8"><Spinner /></div>
                        ) : pendingQueue.length === 0 ? (
                          <EmptyState description="All yearbook entries have been moderated." icon={CheckCircle} />
                        ) : (
                          <div className="space-y-4">
                            {pendingQueue.map((entry) => (
                              <div key={entry.id} className="flex flex-col gap-4 rounded-lg border border-gray-50 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50 sm:flex-row sm:items-center">
                                <div className="flex-1 space-y-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">{entry.author_name}</p>
                                  <p className="text-sm text-gray-500">{entry.course} • {entry.academic_year}</p>
                                  <p className="text-sm italic text-gray-700 dark:text-gray-300">"{entry.yearbook_quote}"</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="secondary" onClick={() => handleModerate(entry.id, 'rejected')} className="text-red-600">Reject</Button>
                                  <Button onClick={() => handleModerate(entry.id, 'approved')}>Approve</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )}
                  </section>

                  <section className="space-y-4">
                    <button
                      onClick={toggleMemoryModeration}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-6 py-4 transition-all hover:border-emerald-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                      <span className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-gray-900 dark:text-white">Memories Queue</span>
                        {stats.pendingMemories > 0 && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {stats.pendingMemories}
                          </span>
                        )}
                      </span>
                      {showMemoryModeration ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>

                    {showMemoryModeration && (
                      <Card className="p-4 overflow-hidden">
                        {loadingMemories ? (
                          <div className="flex justify-center py-8"><Spinner /></div>
                        ) : pendingMemories.length === 0 ? (
                          <EmptyState description="All shared memories have been moderated." icon={CheckCircle} />
                        ) : (
                          <div className="space-y-4">
                            {pendingMemories.map((memory) => (
                              <div key={memory.id} className="flex flex-col gap-4 rounded-lg border border-gray-50 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900 dark:text-white">{memory.title}</p>
                                    <span className="text-xs text-gray-500">{memory.academic_year}</span>
                                  </div>
                                  <p className="text-sm text-gray-500">By {memory.author_name}</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{memory.story}</p>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-gray-700">
                                  <Button variant="secondary" onClick={() => handleMemoryModerate(memory.id, 'rejected')} className="text-red-600">Reject</Button>
                                  <Button onClick={() => handleMemoryModerate(memory.id, 'approved')}>Approve</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )}
                  </section>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Detailed Role Breakdown */}
              <Card className="p-6 space-y-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">User Distribution</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Students', value: stats.studentCount, color: 'bg-blue-500' },
                    { label: 'Faculty', value: stats.facultyCount, color: 'bg-indigo-500' },
                    { label: 'Alumni', value: stats.alumniCount, color: 'bg-orange-500' },
                    { label: 'Admins', value: stats.adminCount, color: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="text-gray-900 dark:text-white font-bold">{item.value}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.color}`} 
                          style={{ width: `${(item.value / (stats.totalUsers || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Graduation Transition */}
              {profile?.role === 'admin' && (
                <Card className="p-6 space-y-4 border-2 border-dashed border-yellow-200 dark:border-yellow-900/30">
                  <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Academic Transition
                  </h2>
                  <p className="text-xs text-gray-500">
                    Process students graduating in a specific year to Alumni status.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Graduation Class</label>
                      <Select
                        value={gradYearToProcess}
                        onChange={(e) => setGradYearToProcess(parseInt(e.target.value))}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>Class of {year}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Safety Confirmation</label>
                      <Input
                        value={transitionConfirm}
                        onChange={(e) => setTransitionConfirm(e.target.value)}
                        placeholder="Type CONFIRM"
                      />
                    </div>
                    <Button
                      onClick={processGraduations}
                      disabled={isProcessing || transitionConfirm !== 'CONFIRM'}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isProcessing ? 'Processing...' : 'Transition Class'}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
