import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle,
  Clock,
  GraduationCap,
  Megaphone,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Button, Card, EmptyState, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import type { Announcement, Connection, YearbookEntry } from '../lib/types';
import { cn, formatDate, getBackendAssetUrl, isVideoUrl } from '../lib/utils';

type DashboardStats = {
  totalUsers: number;
  totalYearbookEntries: number;
  pendingEntries: number;
  userConnections: number;
};

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'success';
};

const emptyStats: DashboardStats = {
  totalUsers: 0,
  totalYearbookEntries: 0,
  pendingEntries: 0,
  userConnections: 0,
};

const roleCopy = {
  student: {
    eyebrow: 'Student workspace',
    title: 'Build your yearbook story',
    description: 'Add your photo or video entry, discover alumni, and keep up with department updates.',
  },
  faculty: {
    eyebrow: 'Faculty workspace',
    title: 'Guide the yearbook flow',
    description: 'Review student submissions, publish announcements, and keep the department moving.',
  },
  alumni: {
    eyebrow: 'Alumni workspace',
    title: 'Stay visible to students',
    description: 'Keep your profile current, grow your network, and respond to student connections.',
  },
  admin: {
    eyebrow: 'Admin workspace',
    title: 'Run the department hub',
    description: 'Track platform health, moderate content, and manage yearbook operations.',
  },
} as const;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [yearbookEntry, setYearbookEntry] = useState<YearbookEntry | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingQueue, setPendingQueue] = useState<YearbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yearOfStudy, setYearOfStudy] = useState(4);
  const [isProcessingGraduation, setIsProcessingGraduation] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const [statsResult, announcementsResult] = await Promise.allSettled([
          api.fetch('/users/stats'),
          api.fetch('/announcements?limit=4'),
        ]);

        if (statsResult.status === 'fulfilled') {
          const data = statsResult.value;
          setStats({
            totalUsers: data.totalUsers || 0,
            totalYearbookEntries: data.totalYearbookEntries || 0,
            pendingEntries: data.pendingEntries || 0,
            userConnections: data.userConnections || 0,
          });
        }

        if (announcementsResult.status === 'fulfilled') {
          setAnnouncements(announcementsResult.value || []);
        }

        if (user?.role === 'student') {
          const entry = await api.fetch('/yearbook/me').catch(() => null);
          setYearbookEntry(entry);
        }

        if (user?.role === 'student' || user?.role === 'alumni') {
          const connectionData = await api.fetch('/connections').catch(() => []);
          setConnections(connectionData || []);
        }

        if (user?.role === 'faculty' || user?.role === 'admin') {
          const queue = await api.fetch('/yearbook/pending?limit=5').catch(() => []);
          setPendingQueue(queue || []);
        }
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role) fetchDashboard();
  }, [user?.role]);

  const processGraduations = async () => {
    if (!window.confirm(`Are you sure you want to transition all Year ${yearOfStudy} students to Alumni?`)) {
      return;
    }

    setIsProcessingGraduation(true);
    try {
      const result = await api.fetch('/admin/graduations/process', {
        method: 'POST',
        body: JSON.stringify({ year_of_study: yearOfStudy }),
      });
      toast.success(`Successfully transitioned ${result.processed_count} students to Alumni!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process graduations');
    } finally {
      setIsProcessingGraduation(false);
    }
  };

  const role = user?.role || 'student';
  const copy = roleCopy[role];
  const acceptedConnections = connections.filter((connection) => connection.status === 'accepted').length;
  const pendingConnections = connections.filter((connection) => connection.status === 'pending').length;

  const quickActions = useMemo<QuickAction[]>(() => {
    if (role === 'student') {
      return [
        {
          label: yearbookEntry ? 'Edit yearbook entry' : 'Add photo/video entry',
          description: yearbookEntry ? 'Update your quote, memories, and media.' : 'Start your yearbook profile with a photo or video.',
          href: '/yearbook',
          icon: PenLine,
          variant: 'primary',
        },
        {
          label: 'Browse alumni',
          description: 'Find graduates by year, industry, and career path.',
          href: '/alumni',
          icon: Briefcase,
          variant: 'success',
        },
        {
          label: 'Search members',
          description: 'Look up students, faculty, and alumni.',
          href: '/search',
          icon: Search,
          variant: 'secondary',
        },
      ];
    }

    if (role === 'faculty') {
      return [
        {
          label: 'Create announcement',
          description: 'Post an update with optional media.',
          href: '/admin/announcements/create',
          icon: Megaphone,
          variant: 'success',
        },
        {
          label: 'Review submissions',
          description: `${pendingQueue.length || stats.pendingEntries} entries need attention.`,
          href: '/admin',
          icon: ShieldCheck,
          variant: 'primary',
        },
        {
          label: 'Search profiles',
          description: 'Find students, faculty, or alumni quickly.',
          href: '/search',
          icon: Search,
          variant: 'secondary',
        },
      ];
    }

    if (role === 'alumni') {
      return [
        {
          label: 'Update profile',
          description: 'Keep your company, role, and links current.',
          href: '/profile/edit',
          icon: PenLine,
          variant: 'primary',
        },
        {
          label: 'Browse alumni',
          description: 'Reconnect with graduates from other classes.',
          href: '/alumni',
          icon: Users,
          variant: 'secondary',
        },
        {
          label: 'Find students',
          description: 'Discover students looking for guidance.',
          href: '/search',
          icon: UserPlus,
          variant: 'success',
        },
      ];
    }

    return [
      {
        label: 'Create announcement',
        description: 'Publish a new department-wide update.',
        href: '/admin/announcements/create',
        icon: Megaphone,
        variant: 'success',
      },
      {
        label: 'Add students',
        description: 'Manual or bulk student account creation.',
        href: '/admin/students/manage',
        icon: UserPlus,
        variant: 'primary',
      },
      {
        label: 'Review submissions',
        description: `${stats.pendingEntries} submissions are waiting.`,
        href: '/admin',
        icon: Clock,
        variant: 'secondary',
      },
    ];
  }, [pendingQueue.length, role, stats.pendingEntries, yearbookEntry]);

  const statCards = getStatCards(role, stats, yearbookEntry, acceptedConnections, pendingConnections, pendingQueue.length);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${profile?.full_name || 'there'}`}
        description="Your department yearbook hub is ready."
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/60 dark:bg-blue-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            {copy.eyebrow}
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold text-gray-950 dark:text-white">
            {copy.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700 dark:text-gray-300">
            {copy.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {quickActions.map((action) => (
              <ActionTile key={action.label} action={action} onClick={() => navigate(action.href)} />
            ))}
          </div>
        </div>

        <FocusPanel
          role={role}
          yearbookEntry={yearbookEntry}
          pendingQueue={pendingQueue}
          pendingConnections={pendingConnections}
          onNavigate={navigate}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      {user?.role === 'admin' && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/10 dark:to-orange-900/10 dark:border-yellow-900/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-600 rounded-xl text-white shadow-lg shadow-yellow-500/20">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-950 dark:text-white">Process Annual Graduations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  Transition all students in their final year to Alumni status. This will update their roles and permissions.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1 ml-1">Student Year</span>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(parseInt(e.target.value))}
                  className="rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:border-gray-700 dark:bg-gray-800"
                >
                  {[4, 5, 6, 7].map((year) => (
                    <option key={year} value={year}>Year {year} Students</option>
                  ))}
                </select>
              </div>
              <Button 
                onClick={processGraduations} 
                disabled={isProcessingGraduation}
                className="mt-5 md:mt-0 bg-yellow-600 hover:bg-yellow-700 text-white border-none shadow-lg shadow-yellow-500/20"
              >
                {isProcessingGraduation ? <Spinner className="h-4 w-4 mr-2" /> : <GraduationCap className="h-4 w-4 mr-2" />}
                Transition to Alumni
              </Button>
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <RoleDetailPanel
          role={role}
          yearbookEntry={yearbookEntry}
          connections={connections}
          pendingQueue={pendingQueue}
          stats={stats}
        />
        <AnnouncementsPanel announcements={announcements} />
      </section>
    </div>
  );
};

function getStatCards(
  role: string,
  stats: DashboardStats,
  yearbookEntry: YearbookEntry | null,
  acceptedConnections: number,
  pendingConnections: number,
  pendingQueueLength: number
) {
  if (role === 'student') {
    return [
      {
        label: 'Yearbook entry',
        value: yearbookEntry ? toTitleCase(yearbookEntry.status) : 'Not started',
        detail: yearbookEntry ? 'Your latest submission status' : 'Add your photo/video entry',
        icon: BookOpen,
        tone: 'blue',
      },
      {
        label: 'Connections',
        value: acceptedConnections,
        detail: `${pendingConnections} pending request${pendingConnections === 1 ? '' : 's'}`,
        icon: Users,
        tone: 'emerald',
      },
      {
        label: 'Yearbook entries',
        value: stats.totalYearbookEntries,
        detail: 'Approved stories to browse',
        icon: Award,
        tone: 'amber',
      },
      {
        label: 'Network',
        value: stats.totalUsers,
        detail: 'Students, faculty, and alumni',
        icon: GraduationCap,
        tone: 'slate',
      },
    ];
  }

  if (role === 'faculty') {
    return [
      {
        label: 'Pending reviews',
        value: stats.pendingEntries,
        detail: 'Student entries awaiting approval',
        icon: Clock,
        tone: stats.pendingEntries > 0 ? 'amber' : 'emerald',
      },
      {
        label: 'Published entries',
        value: stats.totalYearbookEntries,
        detail: 'Approved yearbook stories',
        icon: BookOpen,
        tone: 'blue',
      },
      {
        label: 'Network size',
        value: stats.totalUsers,
        detail: 'Active department profiles',
        icon: Users,
        tone: 'slate',
      },
      {
        label: 'Connections',
        value: stats.userConnections,
        detail: 'Active student-alumni links',
        icon: CheckCircle,
        tone: 'emerald',
      },
    ];
  }

  if (role === 'alumni') {
    return [
      {
        label: 'Connections',
        value: acceptedConnections,
        detail: 'Accepted network links',
        icon: Users,
        tone: 'emerald',
      },
      {
        label: 'Pending requests',
        value: pendingConnections,
        detail: 'Requests needing a response',
        icon: Bell,
        tone: pendingConnections > 0 ? 'amber' : 'slate',
      },
      {
        label: 'Yearbook stories',
        value: stats.totalYearbookEntries,
        detail: 'Department memories',
        icon: BookOpen,
        tone: 'blue',
      },
      {
        label: 'Directory',
        value: stats.totalUsers,
        detail: 'People in the hub',
        icon: GraduationCap,
        tone: 'slate',
      },
    ];
  }

  return [
    {
      label: 'Total users',
      value: stats.totalUsers,
      detail: 'Active profiles in the system',
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Yearbook entries',
      value: stats.totalYearbookEntries,
      detail: 'Approved and visible stories',
      icon: BookOpen,
      tone: 'emerald',
    },
    {
      label: 'Pending approval',
      value: stats.pendingEntries || pendingQueueLength,
      detail: 'Needs moderation',
      icon: Clock,
      tone: stats.pendingEntries > 0 ? 'amber' : 'slate',
    },
    {
      label: 'Connections',
      value: stats.userConnections,
      detail: 'Accepted mentorship links',
      icon: CheckCircle,
      tone: 'slate',
    },
  ];
}

function ActionTile({ action, onClick }: { action: QuickAction; onClick: () => void }) {
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      className="group rounded-lg border border-white/70 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('rounded-lg p-2 text-white', action.variant === 'success' ? 'bg-emerald-600' : action.variant === 'secondary' ? 'bg-gray-700' : 'bg-blue-600')}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-950 dark:text-white">{action.label}</h3>
      <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">{action.description}</p>
    </button>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    slate: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }[tone] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
        </div>
        <span className={cn('rounded-lg p-3', toneClass)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </Card>
  );
}

function FocusPanel({
  role,
  yearbookEntry,
  pendingQueue,
  pendingConnections,
  onNavigate,
}: {
  role: string;
  yearbookEntry: YearbookEntry | null;
  pendingQueue: YearbookEntry[];
  pendingConnections: number;
  onNavigate: (path: string) => void;
}) {
  if (role === 'student') {
    const hasEntry = Boolean(yearbookEntry);
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold text-gray-950 dark:text-white">
              {hasEntry ? 'Your yearbook entry is in motion' : 'Your yearbook entry is waiting'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {hasEntry ? `Status: ${toTitleCase(yearbookEntry!.status)}` : 'Add a photo or video to make it feel personal.'}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {hasEntry
              ? yearbookEntry?.yearbook_quote || 'You can still improve your entry while it is pending.'
              : 'Start with a media memory, then add a quote and favorite moment.'}
          </p>
        </div>
        <Button onClick={() => onNavigate('/yearbook')} className="mt-5 w-full">
          {hasEntry ? 'Open yearbook entry' : 'Create entry'}
        </Button>
      </Card>
    );
  }

  if (role === 'faculty' || role === 'admin') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold text-gray-950 dark:text-white">Moderation queue</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pendingQueue.length > 0 ? `${pendingQueue.length} recent entries need review.` : 'No recent pending entries.'}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {pendingQueue.slice(0, 3).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.author_name || 'Student entry'}</p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{entry.yearbook_quote}</p>
            </div>
          ))}
          {pendingQueue.length === 0 && (
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
              The queue is clear. Nice and tidy.
            </p>
          )}
        </div>
        <Button onClick={() => onNavigate('/admin')} className="mt-5 w-full">
          Open review tools
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <UserPlus className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-semibold text-gray-950 dark:text-white">Student connections</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pendingConnections > 0 ? `${pendingConnections} connection request${pendingConnections === 1 ? '' : 's'} pending.` : 'Keep your profile ready for students.'}
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Add your current role, company, and links so students know what they can ask you about.
        </p>
      </div>
      <Button onClick={() => onNavigate('/profile/edit')} className="mt-5 w-full">
        Update profile
      </Button>
    </Card>
  );
}

function RoleDetailPanel({
  role,
  yearbookEntry,
  connections,
  pendingQueue,
  stats,
}: {
  role: string;
  yearbookEntry: YearbookEntry | null;
  connections: Connection[];
  pendingQueue: YearbookEntry[];
  stats: DashboardStats;
}) {
  if (role === 'student') {
    return (
      <section>
        <SectionTitle title="Student Checklist" description="The fastest way to make your profile useful." />
        <div className="grid gap-4 md:grid-cols-3">
          <ChecklistItem done={Boolean(yearbookEntry)} title="Submit yearbook media" description="Photo or video plus your quote." />
          <ChecklistItem done={connections.some((connection) => connection.status === 'accepted')} title="Make a connection" description="Reach out to an alumni mentor." />
          <ChecklistItem done={Boolean(yearbookEntry?.favorite_memory)} title="Add a memory" description="Share a moment your class will recognize." />
        </div>
      </section>
    );
  }

  if (role === 'faculty') {
    return (
      <section>
        <SectionTitle title="Faculty Priorities" description="Keep student submissions and communications moving." />
        <div className="grid gap-4 md:grid-cols-3">
          <ChecklistItem done={pendingQueue.length === 0} title="Review queue" description={`${pendingQueue.length || stats.pendingEntries} entries pending.`} />
          <ChecklistItem done={false} title="Publish update" description="Share deadlines, events, or reminders." />
          <ChecklistItem done={stats.totalYearbookEntries > 0} title="Monitor yearbook" description={`${stats.totalYearbookEntries} entries are visible.`} />
        </div>
      </section>
    );
  }

  if (role === 'alumni') {
    return (
      <section>
        <SectionTitle title="Alumni Presence" description="Help students understand your career path." />
        <div className="grid gap-4 md:grid-cols-3">
          <ChecklistItem done={connections.length > 0} title="Grow network" description={`${connections.length} total connection${connections.length === 1 ? '' : 's'}.`} />
          <ChecklistItem done={false} title="Update career info" description="Add company, role, industry, and links." />
          <ChecklistItem done={stats.totalYearbookEntries > 0} title="Browse stories" description="See what current students are sharing." />
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle title="Admin Operations" description="A quick read on system health and content flow." />
      <div className="grid gap-4 md:grid-cols-3">
        <ChecklistItem done={stats.pendingEntries === 0} title="Moderation" description={`${stats.pendingEntries} pending entries.`} />
        <ChecklistItem done={stats.totalUsers > 0} title="Directory" description={`${stats.totalUsers} active profiles.`} />
        <ChecklistItem done={stats.userConnections > 0} title="Mentorship" description={`${stats.userConnections} active connections.`} />
      </div>
    </section>
  );
}

function ChecklistItem({ done, title, description }: { done: boolean; title: string; description: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 rounded-full p-1', done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300')}>
          {done ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function AnnouncementsPanel({ announcements }: { announcements: Announcement[] }) {
  return (
    <section>
      <SectionTitle title="Announcements" description="Recent updates for your role." />
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Updates from faculty and admins will appear here." />
      ) : (
        <div className="space-y-4">
          {announcements.slice(0, 3).map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden">
              {announcement.media_url && (
                <div className="aspect-video bg-gray-100 dark:bg-gray-900">
                  {isVideoUrl(announcement.media_url) ? (
                    <video
                      src={getBackendAssetUrl(announcement.media_url)}
                      className="h-full w-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={getBackendAssetUrl(announcement.media_url)}
                      alt={announcement.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{announcement.title}</h3>
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(announcement.created_at)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                  {announcement.content}
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                  <Avatar name={announcement.author_name || 'Admin'} className="h-7 w-7 text-xs" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {announcement.author_name || 'Department'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
          <Link to="/announcements" className="inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            View all announcements
          </Link>
        </div>
      )}
    </section>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-gray-950 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
