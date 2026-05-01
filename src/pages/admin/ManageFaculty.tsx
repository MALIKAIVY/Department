import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Building2, Upload, FileSpreadsheet, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input, PageHeader } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

export const ManageFaculty: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [manualFaculty, setManualFaculty] = useState({
    email: '',
    full_name: '',
    password: '',
    faculty_id: '',
    department: 'Department of Technology',
    designation: '',
  });

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.fetch('/admin/faculty', {
        method: 'POST',
        body: JSON.stringify({ faculty: [manualFaculty] })
      });
      toast.success('Faculty profile added to directory');
      setManualFaculty({
        email: '',
        full_name: '',
        password: '',
        faculty_id: '',
        department: 'Department of Technology',
        designation: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create faculty profile');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFacultyBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const faculty = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          faculty.push({
            email: parts[0].trim(),
            full_name: parts[1].trim(),
            faculty_id: parts[2]?.trim() || `FAC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            department: parts[3]?.trim() || 'Department of Technology',
            designation: parts[4]?.trim() || 'Faculty Member',
          });
        }
      }

      if (faculty.length === 0) {
        toast.error('No valid faculty records found in CSV');
        return;
      }

      setIsCreating(true);
      try {
        const results = await api.fetch('/admin/faculty', {
          method: 'POST',
          body: JSON.stringify({ faculty })
        });
        toast.success(`Successfully imported ${results.length} faculty profiles`);
      } catch {
        toast.error('Faculty upload failed');
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
        title="Manage Faculty" 
        description="Expand the faculty directory or import departments in bulk" 
      />

      <Card className="p-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Manual Entry */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Add Faculty Profile
            </h3>
            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
                <Input
                  placeholder="e.g. Prof. Alice Smith"
                  value={manualFaculty.full_name}
                  onChange={(e) => setManualFaculty({ ...manualFaculty, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. alice@university.edu"
                  value={manualFaculty.email}
                  onChange={(e) => setManualFaculty({ ...manualFaculty, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Initial Password</label>
                <Input
                  type="password"
                  placeholder="Enter secure password"
                  value={manualFaculty.password}
                  onChange={(e) => setManualFaculty({ ...manualFaculty, password: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Faculty ID</label>
                  <Input
                    placeholder="e.g. FAC001"
                    value={manualFaculty.faculty_id}
                    onChange={(e) => setManualFaculty({ ...manualFaculty, faculty_id: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Designation</label>
                  <Input
                    placeholder="e.g. Senior Lecturer"
                    value={manualFaculty.designation}
                    onChange={(e) => setManualFaculty({ ...manualFaculty, designation: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Department</label>
                <Input
                  placeholder="e.g. Computer Science"
                  value={manualFaculty.department}
                  onChange={(e) => setManualFaculty({ ...manualFaculty, department: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700">
                {isCreating ? 'Adding Profile...' : 'Add Faculty Profile'}
              </Button>
            </form>
          </div>

          {/* Bulk Upload */}
          <div className="flex flex-col space-y-6 border-t pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Upload className="h-5 w-5 text-purple-600" />
              Faculty CSV Import
            </h3>
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 text-center dark:border-gray-700 dark:bg-gray-900/50">
              <FileSpreadsheet className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 font-medium text-gray-900 dark:text-white">Upload Faculty CSV</p>
              <p className="mb-6 text-sm text-gray-500 max-w-xs mx-auto">
                Format: email, name, faculty_id, department, designation
              </p>
              <label className="cursor-pointer rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95">
                Select CSV File
                <input type="file" accept=".csv" onChange={handleFacultyBulkUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
