import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell, Button, Field, Input, Select } from '../components/ui';
import { PUBLIC_SIGNUP_ROLES, ROLE_DESCRIPTIONS } from '../lib/constants';
import { useAuthStore } from '../lib/stores/authStore';
import type { UserRole } from '../lib/types';
import { validateEmail, validatePassword } from '../lib/utils';

type Step = 'role' | 'details' | 'rolespecific';

const roleFields: Record<Exclude<UserRole, 'admin'>, Array<{ name: string; label: string; placeholder?: string; type?: string }>> = {
  student: [
    { name: 'student_id', label: 'Student ID', placeholder: 'STU-12345' },
  ],
  faculty: [
    { name: 'faculty_id', label: 'Faculty ID', placeholder: 'FAC-12345' },
    { name: 'department', label: 'Department', placeholder: 'Computer Science' },
    { name: 'designation', label: 'Designation', placeholder: 'Associate Professor' },
  ],
  alumni: [
    { name: 'alumni_id', label: 'Alumni ID', placeholder: 'ALU-12345' },
    { name: 'graduation_year', label: 'Graduation Year', placeholder: '2020', type: 'number' },
    { name: 'degree_earned', label: 'Degree Earned', placeholder: 'Master of Technology' },
  ],
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole | ''>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [roleData, setRoleData] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleRoleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRoleData((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const validateDetails = () => {
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const continueToRoleDetails = () => {
    setError('');
    if (validateDetails()) setStep('rolespecific');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateDetails()) return;

    setIsLoading(true);
    try {
      const signUpData: any = {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: role as UserRole,
        ...roleData,
      };

      await signUp(signUpData);

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const publicRole = role as Exclude<UserRole, 'admin'>;

  return (
    <AuthShell title="Join DTCY" subtitle="Create your yearbook profile">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {step === 'role' && (
          <div className="space-y-4">
            <p className="text-center font-medium text-gray-700 dark:text-gray-300">Select your role</p>
            {PUBLIC_SIGNUP_ROLES.map((currentRole) => (
              <button
                key={currentRole}
                type="button"
                onClick={() => {
                  setRole(currentRole);
                  setStep('details');
                  setError('');
                }}
                className="w-full rounded-lg border border-gray-300 p-4 text-left transition hover:border-blue-600 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
              >
                <div className="font-semibold capitalize text-gray-900 dark:text-white">{currentRole}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{ROLE_DESCRIPTIONS[currentRole]}</div>
              </button>
            ))}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <Field label="Full Name">
              <Input name="fullName" value={formData.fullName} onChange={handleDetailsChange} placeholder="John Doe" />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleDetailsChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleDetailsChange}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm Password">
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleDetailsChange}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <Button type="button" onClick={continueToRoleDetails} className="w-full">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep('role')} className="w-full">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {step === 'rolespecific' && role && (
          <div className="space-y-4">
            {role === 'student' && (
              <Field label="Year of Study">
                <Select name="year_of_study" value={roleData.year_of_study || ''} onChange={handleRoleDataChange} required>
                  <option value="">Select year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </Select>
              </Field>
            )}

            {roleFields[publicRole].map((field) => (
              <Field key={field.name} label={field.label}>
                <Input
                  type={field.type || 'text'}
                  name={field.name}
                  value={roleData[field.name] || ''}
                  onChange={handleRoleDataChange}
                  placeholder={field.placeholder}
                  required
                />
              </Field>
            ))}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep('details')} className="w-full">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};
