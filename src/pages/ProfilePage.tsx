import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { useConnectionStore } from '../lib/stores/connectionStore';
import { Briefcase, CalendarDays, GraduationCap, Linkedin, Github, Mail, UserPlus, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Button, Card, Spinner, Textarea } from '../components/ui';
import type { Profile } from '../lib/types';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUserSession } = useAuthStore();
  const { getConnectionStatus, sendConnectionRequest, respondToConnection } =
    useConnectionStore();
  
  const [profileUser, setProfileUser] = useState<Profile | null>(null);
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
    } catch {
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
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!profileUser) return null;

  const isOwnProfile = currentUserSession?.id === profileUser.id;
  const roleData: any =
    profileUser.role === 'student'
      ? profileUser.student
      : profileUser.role === 'faculty'
        ? profileUser.faculty
        : profileUser.role === 'alumni'
          ? profileUser.alumni
          : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-32 bg-blue-600"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex gap-4">
              <Avatar
                name={profileUser.full_name}
                src={profileUser.avatar_url}
                className="-mt-16 h-32 w-32 border-4 border-white text-3xl shadow-lg dark:border-gray-800"
              />
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
                <Button
                  onClick={() => navigate('/profile/edit')}
                >
                  Edit Profile
                </Button>
              )}

              {!isOwnProfile && currentUserSession?.role === 'student' && profileUser.role === 'alumni' && (
                <div>
                  {!profileUser.alumni?.open_to_connections ? (
                    <span className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Not open to requests
                    </span>
                  ) : !connectionStatus ? (
                    <>
                      <Button
                        onClick={() => setShowConnectionMessage(true)}
                      >
                        Connect
                      </Button>
                      {showConnectionMessage && (
                        <div className="mt-4 w-full min-w-[280px] max-w-sm space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                          <Textarea
                            value={connectionMessage}
                            onChange={(e) => setConnectionMessage(e.target.value)}
                            placeholder="Send a message..."
                            rows={4}
                            className="min-h-28 resize-y"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={handleSendRequest}
                              className="h-11 w-full whitespace-nowrap"
                            >
                              Send Request
                            </Button>
                            <Button
                              onClick={() => setShowConnectionMessage(false)}
                              variant="secondary"
                              className="h-11 w-full whitespace-nowrap"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : connectionStatus.status === 'pending' &&
                    connectionStatus.receiver_id === currentUserSession?.id ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRespondConnection('accepted')}
                        variant="success"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleRespondConnection('rejected')}
                        variant="danger"
                      >
                        Decline
                      </Button>
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
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="h-5 w-5" />
              {profileUser.email}
            </span>
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
      </Card>

      {profileUser.role === 'student' && roleData && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Academic Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Student ID" value={roleData.student_id} />
              <InfoItem label="Year of Study" value={roleData.year_of_study ? `Year ${roleData.year_of_study}` : 'Not set'} />
              <InfoItem label="Graduation Year" value={roleData.graduation_year || 'Not set'} />
              <InfoItem label="Courses" value={roleData.courses_enrolled?.length ? roleData.courses_enrolled.join(', ') : 'Not listed'} />
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Profile completeness</h2>
            <ProfileCompleteness profile={profileUser} />
          </Card>
        </div>
      )}

      {profileUser.role === 'faculty' && roleData && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Faculty Information
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Department" value={roleData.department} />
            <InfoItem label="Position / Designation" value={roleData.designation} />
            <InfoItem label="Office Location" value={roleData.office_location || 'Not listed'} />
            {roleData.courses_taught?.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Courses Teaching</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roleData.courses_taught.join(', ')}
                </p>
              </div>
            )}
            {roleData.research_interest?.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Research Interests</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roleData.research_interest.join(', ')}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {profileUser.role === 'alumni' && roleData && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Career Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Graduation Year" value={roleData.graduation_year} />
              <InfoItem label="Degree" value={roleData.degree_earned} />
              {roleData.current_company && (
                <>
                  <InfoItem label="Company" value={roleData.current_company} />
                  <InfoItem label="Position" value={roleData.current_position || 'Not listed'} />
                </>
              )}
              {roleData.industry && <InfoItem label="Industry" value={roleData.industry} />}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Networking
            </h2>
            <div className="space-y-3">
              {roleData.open_to_connections ? (
                <Badge icon={UserPlus} text="Open to student connections" tone="emerald" />
              ) : (
                <Badge icon={UserPlus} text="Not accepting requests now" tone="gray" />
              )}
              {roleData.mentorship_available && <Badge icon={ShieldCheck} text="Available for mentorship" tone="blue" />}
            </div>

            {roleData.mentorship_areas?.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Can help with</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roleData.mentorship_areas.map((area: string) => (
                    <span key={area} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {roleData.open_to_connections && (
              <div className="mt-5 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                <InfoItem label="Preferred Contact" value={formatContactMethod(roleData.preferred_contact_method)} />
                {roleData.public_contact_email && <InfoItem label="Contact Email" value={roleData.public_contact_email} />}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

function Badge({
  icon: Icon,
  text,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  tone: 'blue' | 'emerald' | 'gray';
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }[tone];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${toneClass}`}>
      <Icon className="h-4 w-4" />
      {text}
    </span>
  );
}

function formatContactMethod(method?: string | null) {
  if (method === 'email') return 'Email';
  if (method === 'linkedin') return 'LinkedIn';
  return 'Internal request first';
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value || 'Not listed'}</p>
    </div>
  );
}

function ProfileCompleteness({ profile }: { profile: Profile }) {
  const checks = [
    Boolean(profile.avatar_url),
    Boolean(profile.bio),
    Boolean(profile.phone),
    Boolean(profile.student?.linkedin_url || profile.faculty?.linkedin_url || profile.alumni?.linkedin_url),
    Boolean(profile.student?.courses_enrolled?.length || profile.faculty?.courses_teaching?.length || profile.alumni?.current_company),
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${score}%` }} />
      </div>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        {score}% complete. Add media, bio, contact, and professional links to improve discovery.
      </p>
    </div>
  );
}
