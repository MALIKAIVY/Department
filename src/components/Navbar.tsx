import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Search, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../lib/stores/authStore';
import { Avatar, Button } from './ui';
import { useTheme } from '../lib/hooks/useTheme';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-1 items-center">
          <div className="hidden md:flex md:flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search profiles, entries..."
                className="w-full rounded-lg border border-transparent bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            className="h-10 w-10 p-0"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Avatar name={profile?.full_name} src={profile?.avatar_url} className="h-10 w-10 text-sm" />
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile?.role}</p>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => {
                    navigate(`/profile/${profile?.id}`);
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/profile/edit');
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Settings className="mr-2 inline h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  <LogOut className="mr-2 inline h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
