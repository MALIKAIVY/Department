import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Upload, FileSpreadsheet, ArrowLeft, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { Button, Card, Input, PageHeader, Spinner } from '../components/ui';

export const ManageStudents: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [manualStudent, setManualStudent] = useState({
    email: '',
    full_name: '',
    student_id: '',
    graduation_year: new Date().getFullYear() + 4,
  });

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.fetch('/admin/students', {
        method: 'POST',
        body: JSON.stringify({ students: [manualStudent] })
      });
      toast.success('Student account created');
      setManualStudent({
        email: '',
        full_name: '',
        student_id: '',
        graduation_year: new Date().getFullYear() + 4,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create student');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const students = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          students.push({
            email: parts[0].trim(),
            full_name: parts[1].trim(),
            student_id: parts[2]?.trim() || `STU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            graduation_year: parseInt(parts[3]?.trim()) || new Date().getFullYear() + 4,
          });
        }
      }

      if (students.length === 0) {
        toast.error('No valid students found in CSV');
        return;
      }

      setIsCreating(true);
      try {
        const results = await api.fetch('/admin/students', {
          method: 'POST',
          body: JSON.stringify({ students })
        });
        toast.success(`Successfully imported ${results.length} students`);
      } catch (err: any) {
        toast.error('Bulk upload failed');
      } finally {
        setIsCreating(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader 
          title="Student Management" 
          description="Create individual accounts or import students in bulk" 
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Manual Creation */}
        <Card className="p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <UserPlus className="h-6 w-6 text-blue-600" />
            Manual Account Creation
          </h2>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <Input
                placeholder="e.g. John Doe"
                value={manualStudent.full_name}
                onChange={(e) => setManualStudent({ ...manualStudent, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={manualStudent.email}
                onChange={(e) => setManualStudent({ ...manualStudent, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Student ID</label>
                <Input
                  placeholder="ID-12345"
                  value={manualStudent.student_id}
                  onChange={(e) => setManualStudent({ ...manualStudent, student_id: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Graduation Year</label>
                <Input
                  type="number"
                  value={manualStudent.graduation_year}
                  onChange={(e) => setManualStudent({ ...manualStudent, graduation_year: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isCreating} className="w-full mt-4">
              {isCreating ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Create Student Account
            </Button>
          </form>
        </Card>

        {/* Bulk Import */}
        <Card className="p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <Upload className="h-6 w-6 text-purple-600" />
            Bulk CSV Import
          </h2>
          <div className="flex flex-col h-[380px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/50">
            <div className="mb-4 rounded-full bg-purple-100 p-4 dark:bg-purple-900/30">
              <FileSpreadsheet className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Upload Students CSV</h3>
            <p className="mb-6 max-w-xs text-sm text-gray-600 dark:text-gray-400">
              Your CSV should have columns for: <br/>
              <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">email, full_name, student_id, grad_year</span>
            </p>
            <label className="cursor-pointer rounded-lg bg-blue-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20">
              Select CSV File
              <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
            </label>
            <p className="mt-4 text-xs text-gray-500 italic">Passwords will be automatically generated and shared.</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-900/20">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Verified Process</p>
            <p className="font-bold text-gray-900 dark:text-white">Secure Creation</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg dark:bg-green-900/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Database Synced</p>
            <p className="font-bold text-gray-900 dark:text-white">Real-time Updates</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
