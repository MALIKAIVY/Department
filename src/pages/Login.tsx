import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell, Button, Card, Field, Input } from '../components/ui';
import { TEST_ACCOUNTS } from '../lib/constants';
import { useAuthStore } from '../lib/stores/authStore';
import { validateEmail } from '../lib/utils';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      toast.error(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to Digital Tech-Connect Yearbook">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Field label="Email Address">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Password">
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pl-10"
            />
          </div>
        </Field>

        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-gray-600"
          />
          <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Remember me
          </label>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full py-3">
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
          Create one
        </Link>
      </p>

      <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
        <p className="mb-4 text-xs font-medium uppercase text-gray-700 dark:text-gray-300">Test accounts</p>
        <Card className="space-y-2 bg-gray-50 p-4 dark:bg-gray-700">
          {TEST_ACCOUNTS.map((account) => (
            <p key={account} className="font-mono text-xs text-gray-600 dark:text-gray-300">
              {account}
            </p>
          ))}
        </Card>
      </div>
    </AuthShell>
  );
};
