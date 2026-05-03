import React, { useState } from 'react';
import { api } from '../../lib/api';
import { UserPlus, Upload, FileSpreadsheet, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input, PageHeader, Select } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

export const ManageStudents: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const currentYear = new Date().getFullYear();
  
  const [manualStudent, setManualStudent] = useState({
    email: '',
    full_name: '',
    password: '',
    student_id: '',
    graduation_year: currentYear + 4,
  });

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

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
        password: '',
        student_id: '',
        graduation_year: currentYear + 4,
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
            student_id: parts[2]?.trim() || undefined,
            graduation_year: parseInt(parts[3]?.trim()) || currentYear + 4,
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
      <Button 
        variant="ghost" 
        onClick={() => navigate('/admin/users')}
        className="-ml-2 flex items-center gap-2 text-gray-600"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to User Management
      </Button>

      <PageHeader 
        title="Manage Students" 
        description="Onboard new students by their graduating class" 
      />

      <Card className="p-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Manual Entry */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Manual Enrollment
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                <Input
                  placeholder="e.g. John Doe"
                  value={manualStudent.full_name}
                  onChange={(e) => setManualStudent({ ...manualStudent, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. john@university.edu"
                  value={manualStudent.email}
                  onChange={(e) => setManualStudent({ ...manualStudent, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Initial Password (Optional)</label>
                <Input
                  type="password"
                  placeholder="Leave blank to email an auto-generated password"
                  value={manualStudent.password}
                  onChange={(e) => setManualStudent({ ...manualStudent, password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Student ID (Optional)</label>
                  <Input
                    placeholder="Leave blank to auto-generate"
                    value={manualStudent.student_id}
                    onChange={(e) => setManualStudent({ ...manualStudent, student_id: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Graduating Class</label>
                  <Select
                    value={manualStudent.graduation_year}
                    onChange={(e) => setManualStudent({ ...manualStudent, graduation_year: parseInt(e.target.value) })}
                    required
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>Class of {year}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={isCreating} className="w-full py-3 shadow-lg shadow-blue-500/10">
                {isCreating ? 'Enrolling...' : 'Enroll Student'}
              </Button>
            </form>
          </div>

          {/* Bulk Upload */}
          <div className="flex flex-col space-y-6 border-t pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Upload className="h-5 w-5 text-purple-600" />
              Class-wide CSV Import
            </h3>
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 text-center dark:border-gray-700 dark:bg-gray-900/50">
              <FileSpreadsheet className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 font-semibold text-gray-900 dark:text-white">Upload Class CSV</p>
              <p className="mb-6 text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Expected CSV Format: <br />
                <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">email, full_name, student_id(optional), grad_year</code>
              </p>
              <label className="cursor-pointer rounded-2xl bg-blue-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20">
                Select CSV File
                <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
