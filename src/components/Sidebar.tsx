import { Link, useLocation } from 'react-router-dom';
import type React from 'react';
import { GraduationCap } from 'lucide-react';
import { UserRole } from '../lib/types';
import { cn } from '../lib/utils';
import { APP_FULL_NAME, APP_NAME, NAV_ITEMS } from '../lib/constants';

interface SidebarProps {
  role: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const location = useLocation();
  const filteredItems = NAV_ITEMS.filter((item) => (item.roles as readonly UserRole[]).includes(role));

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:flex md:flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-6 dark:border-gray-700">
        <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tech Yearbook</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 {APP_FULL_NAME}</p>
      </div>
    </aside>
  );
};
