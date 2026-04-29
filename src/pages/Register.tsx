import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../lib/stores/authStore';
import { validateEmail, validatePassword } from '../lib/utils';
import toast from 'react-hot-toast';
import type { UserRole } from '../lib/types';

type Step = 'role' | 'details' | 'rolespecific';

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

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('details');
    setError('');
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRoleData({
      ...roleData,
      [e.target.name]: e.target.value,
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateDetails()) return;

    setIsLoading(true);
    try {
      // Collect all data into the flat structure expected by useAuthStore.signUp
      const signUpData: any = {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: role as any,
        ...roleData
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Join DTCY</h1>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Create your yearbook profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {step === 'role' && (
              <div className="space-y-4">
                <p className="text-center font-medium text-gray-700 dark:text-gray-300">Select your role:</p>
                {(['student', 'faculty', 'alumni'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className="w-full rounded-lg border-2 border-gray-300 p-4 text-left transition hover:border-blue-600 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <div className="font-semibold text-gray-900 capitalize dark:text-white">{r}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {r === 'student' && 'Current student pursuing degree'}
                      {r === 'faculty' && 'Faculty member or instructor'}
                      {r === 'alumni' && 'Graduate of the program'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleDetailsChange}
                    placeholder="John Doe"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleDetailsChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleDetailsChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleDetailsChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />

                </div>

                <button
                  type="button"
                  onClick={() => setStep('rolespecific')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="flex w-full items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
            )}

            {step === 'rolespecific' && (
              <div className="space-y-4">
                {role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Student ID
                      </label>
                      <input
                        type="text"
                        name="student_id"
                        value={roleData.student_id || ''}
                        onChange={handleRoleDataChange}
                        placeholder="STU-12345"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Year of Study
                      </label>
                      <select
                        name="year_of_study"
                        value={roleData.year_of_study || ''}
                        onChange={handleRoleDataChange}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Select year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </>
                )}

                {role === 'faculty' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Faculty ID
                      </label>
                      <input
                        type="text"
                        name="faculty_id"
                        value={roleData.faculty_id || ''}
                        onChange={handleRoleDataChange}
                        placeholder="FAC-12345"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={roleData.department || ''}
                        onChange={handleRoleDataChange}
                        placeholder="Computer Science"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Designation
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={roleData.designation || ''}
                        onChange={handleRoleDataChange}
                        placeholder="Associate Professor"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </>
                )}

                {role === 'alumni' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Alumni ID
                      </label>
                      <input
                        type="text"
                        name="alumni_id"
                        value={roleData.alumni_id || ''}
                        onChange={handleRoleDataChange}
                        placeholder="ALU-12345"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        name="graduation_year"
                        value={roleData.graduation_year || ''}
                        onChange={handleRoleDataChange}
                        placeholder="2020"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Degree Earned
                      </label>
                      <input
                        type="text"
                        name="degree_earned"
                        value={roleData.degree_earned || ''}
                        onChange={handleRoleDataChange}
                        placeholder="Master of Technology"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>


                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex w-full items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
