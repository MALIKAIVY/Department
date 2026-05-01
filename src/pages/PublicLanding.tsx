import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, GraduationCap, Leaf, Lock, Users } from 'lucide-react';
import { Avatar, Button, Card, Spinner } from '../components/ui';
import { api } from '../lib/api';

type PublicFaculty = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  email: string;
  designation: string;
  department: string;
};

type PublicOverview = {
  stats: {
    students: number;
    alumni: number;
    faculty: number;
  };
  faculty: PublicFaculty[];
  events: Array<{
    title: string;
    date: string;
    location?: string | null;
    description: string;
  }>;
};

const fallbackOverview: PublicOverview = {
  stats: {
    students: 0,
    alumni: 0,
    faculty: 0,
  },
  faculty: [],
  events: [],
};

export const PublicLanding: React.FC = () => {
  const [overview, setOverview] = useState<PublicOverview>(fallbackOverview);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await api.fetch('/users/public/overview');
        setOverview(data || fallbackOverview);
      } catch {
        setOverview(fallbackOverview);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950 dark:bg-gray-950 dark:text-white">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-600 p-2 text-white">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold">DTCY</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Department of Technology</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Join</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-white dark:bg-gray-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Digital Tech-Connect Yearbook
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-gray-950 dark:text-white md:text-5xl">
              A living yearbook for students, faculty, and alumni.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
              DTCY centralizes department profiles, yearbook memories, alumni networking, and faculty visibility in one responsive platform.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login">
                <Button className="px-5 py-3">
                  Student Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="px-5 py-3">Faculty Login</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="px-5 py-3">Alumni Login</Button>
              </Link>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Leaf className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Sustainable by design</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Digital-first records replace printed yearbooks and stay useful after graduation.</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  Privacy note: age is not collected, stored, displayed, or searchable anywhere in the platform.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Stat icon={Users} label="Current Students" value={overview.stats.students} />
            <Stat icon={BookOpen} label="Alumni" value={overview.stats.alumni} />
            <Stat icon={GraduationCap} label="Faculty" value={overview.stats.faculty} />
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <SectionTitle title="Faculty Directory" description="Public faculty information approved for visitor access." />
          <div className="grid gap-4 sm:grid-cols-2">
            {overview.faculty.length === 0 ? (
              <Card className="p-6 text-sm text-gray-600 dark:text-gray-400">Faculty profiles will appear here once available.</Card>
            ) : (
              overview.faculty.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={member.full_name} src={member.avatar_url} className="h-12 w-12" />
                    <div>
                      <h3 className="font-semibold text-gray-950 dark:text-white">{member.full_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.designation}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{member.department}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionTitle title="Upcoming Events" description="Department calendar highlights." />
          <div className="space-y-4">
            {overview.events.length === 0 ? (
              <Card className="p-4 text-sm text-gray-600 dark:text-gray-400">
                Upcoming department events will appear here once published by an administrator.
              </Card>
            ) : overview.events.map((event) => (
              <Card key={event.title} className="p-4">
                <div className="flex gap-3">
                  <span className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-950 dark:text-white">{event.title}</h3>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{event.date}</p>
                    {event.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">{event.location}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{value}</p>
        </div>
        <span className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </Card>
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
