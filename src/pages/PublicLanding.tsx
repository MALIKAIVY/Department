import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, Leaf, Lock, Users } from 'lucide-react';
import { Button } from '../components/ui';

export const PublicLanding: React.FC = () => {
  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <header className="border-b border-gray-100 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95">
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
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center sm:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Digital Tech-Connect Yearbook
            </p>
            <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-bold leading-tight text-gray-950 dark:text-white md:text-6xl">
              A living yearbook for students, faculty, and alumni.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              DTCY brings the Department of Technology into one digital space where students preserve their yearbook stories, faculty stay visible, and alumni remain connected after graduation.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/login">
                <Button className="w-full px-6 py-3 sm:w-auto">
                  Student Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="w-full px-6 py-3 sm:w-auto">Faculty Login</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="w-full px-6 py-3 sm:w-auto">Alumni Login</Button>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 border-y border-gray-100 py-8 text-left dark:border-gray-800 md:grid-cols-3">
            <div className="flex gap-4">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-gray-950 dark:text-white">One department hub</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Profiles, yearbook entries, memories, and alumni connections live in one place.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Leaf className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-gray-950 dark:text-white">Digital-first records</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">The yearbook stays useful after graduation and reduces printed records.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-gray-950 dark:text-white">Privacy aware</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Age is not collected, stored, displayed, or searchable anywhere in the platform.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
