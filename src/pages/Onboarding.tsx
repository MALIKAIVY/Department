import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Field, Input, PageHeader } from '../components/ui';
import { useAuthStore } from '../lib/stores/authStore';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { profile, changePassword } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const needsPasswordChange = Boolean(profile.is_first_login);

  if (!needsPasswordChange) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Enter your current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || newPassword.length < 8) {
      toast.error('Password needs 8+ characters, one uppercase letter, and one number');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Setup complete');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Could not complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Complete Account Setup"
        description="Please update your temporary password to secure your account."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card as="form" onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-gray-950 dark:text-white">Change temporary password</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Imported accounts must choose a private password first.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Current Password">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="New Password">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm New Password">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </section>

            <Button type="submit" disabled={isSubmitting} className="w-full py-3">
              {isSubmitting ? 'Completing setup...' : 'Complete Setup'}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <StepCard done={!needsPasswordChange} icon={KeyRound} title="Password" description="Temporary credentials must be replaced." />
          <StepCard done={true} icon={ShieldCheck} title="Privacy" description="Your data is protected by department policy." />
        </div>
      </div>
    </div>
  );
};

function StepCard({
  done,
  icon: Icon,
  title,
  description,
}: {
  done: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <span className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {done ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <Icon className="h-5 w-5" />}
        </span>
        <div>
          <h3 className="font-semibold text-gray-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Card>
  );
}
