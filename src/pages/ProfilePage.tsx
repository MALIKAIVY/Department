import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { useConnectionStore } from '../lib/stores/connectionStore';
import { Linkedin, Github } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials } from '../lib/utils';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUserSession } = useAuthStore();
  const { getConnectionStatus, sendConnectionRequest, respondToConnection } =
    useConnectionStore();
  
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [showConnectionMessage, setShowConnectionMessage] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (profileUser && currentUserSession && profileUser.id !== currentUserSession.id) {
      checkConnectionStatus();
    }
  }, [profileUser, currentUserSession]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetch(`/users/${id}`);
      setProfileUser(data);
    } catch (error: any) {
      toast.error('Profile not found');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const status = await getConnectionStatus(profileUser!.id);

      setConnectionStatus(status);
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!profileUser || !currentUserSession) return;
    try {
      await sendConnectionRequest(profileUser.id, connectionMessage);

      toast.success('Connection request sent!');
      setShowConnectionMessage(false);
      setConnectionMessage('');
      checkConnectionStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    }
  };

  const handleRespondConnection = async (status: 'accepted' | 'rejected') => {
    if (!connectionStatus) return;
    try {
      await respondToConnection(connectionStatus.id, status);
      toast.success(`Request ${status}!`);
      checkConnectionStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to respond');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
      </div>
    );
  }

  if (!profileUser) return null;

  const isOwnProfile = currentUserSession?.id === profileUser.id;
  const roleData = profileUser.role_data || {};

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex gap-4">
              <div className="-mt-16 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-3xl font-bold text-white shadow-lg overflow-hidden border-4 border-white dark:border-gray-800">
                {profileUser.avatar_url ? (
                  <img
                    src={profileUser.avatar_url}
                    alt={profileUser.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(profileUser.full_name)
                )}
              </div>
              <div className="flex flex-col justify-end">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profileUser.full_name}
                </h1>
                <p className="mt-1 capitalize text-gray-600 dark:text-gray-400">
                  {profileUser.role}
                </p>
                {profileUser.bio && (
                  <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">{profileUser.bio}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Edit Profile
                </button>
              )}

              {!isOwnProfile && currentUserSession?.role === 'student' && profileUser.role === 'alumni' && (
                <div>
                  {!connectionStatus ? (
                    <>
                      <button
                        onClick={() => setShowConnectionMessage(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        Connect
                      </button>
                      {showConnectionMessage && (
                        <div className="mt-4 space-y-2">
                          <textarea
                            value={connectionMessage}
                            onChange={(e) => setConnectionMessage(e.target.value)}
                            placeholder="Send a message..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSendRequest}
                              className="flex-1 rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                              Send Request
                            </button>
                            <button
                              onClick={() => setShowConnectionMessage(false)}
                              className="flex-1 rounded-lg bg-gray-200 py-2 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : connectionStatus.status === 'pending' &&
                    connectionStatus.receiver_id === currentUserSession?.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondConnection('accepted')}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondConnection('rejected')}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </div>
                  ) : connectionStatus.status === 'accepted' ? (
                    <span className="rounded-lg bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Connected
                    </span>
                  ) : (
                    <span className="rounded-lg bg-gray-100 px-4 py-2 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                      Request Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            {roleData.linkedin_url && (
              <a
                href={roleData.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn
              </a>
            )}
            {roleData.github_url && (
              <a
                href={roleData.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <Github className="h-5 w-5" />
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {profileUser.role === 'student' && roleData && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Academic Information
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Course / Program</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {roleData.course}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Year of Study</p>
              <p className="font-medium text-gray-900 dark:text-white">
                Year {roleData.year_of_study}
              </p>
            </div>
          </div>
        </div>
      )}

      {profileUser.role === 'faculty' && roleData && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Faculty Information
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {roleData.department}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Position / Designation</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {roleData.position}
              </p>
            </div>
            {roleData.courses_taught?.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Courses Teaching</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roleData.courses_taught.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {profileUser.role === 'alumni' && roleData && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Career Information
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Graduation Year</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {roleData.graduation_year}
              </p>
            </div>
            {roleData.current_company && (
              <>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Company</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {roleData.current_company}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Position</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {roleData.current_job_title}
                  </p>
                </div>
              </>
            )}
            {roleData.industry && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Industry</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roleData.industry}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
