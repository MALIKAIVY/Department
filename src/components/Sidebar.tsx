import { Link, useLocation } from 'react-router-dom';
import type React from 'react';
import { GraduationCap, X } from 'lucide-react';
import { UserRole } from '../lib/types';
import { cn } from '../lib/utils';
import { APP_FULL_NAME, APP_NAME, NAV_ITEMS } from '../lib/constants';
import { Button } from './ui';

interface SidebarProps {
  role: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, isOpen = false, onClose }) => {
  const location = useLocation();

  const userRole = (role || '').toLowerCase();
  const filteredItems = NAV_ITEMS.filter((item) => {
    const allowedRoles = item.roles as readonly string[];
    return allowedRoles.includes(userRole);
  });

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-6 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-10 w-10 text-blue-600 dark:text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tech Yearbook</p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          className="h-12 w-12 p-0 md:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-7 w-7" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-4 rounded-lg px-4 py-3.5 text-base font-semibold transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-7 w-7" />
              {item.label}
            </Link>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-gray-400">No navigation items available for your role ({role})</p>
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 {APP_FULL_NAME}</p>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:flex md:flex-col">
        {sidebarContent}
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-gray-950/50 backdrop-blur-sm transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col border-r border-gray-200 bg-white shadow-2xl transition-transform duration-200 dark:border-gray-700 dark:bg-gray-800 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Mobile navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
};
