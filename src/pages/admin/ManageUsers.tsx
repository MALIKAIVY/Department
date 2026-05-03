import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  Shield, 
  UserPlus, 
  ChevronLeft,
  Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Modal, Field, Input, Select } from '../../components/ui';
import type { Profile, UserRole } from '../../lib/types';
import { toast } from 'react-hot-toast';

export const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "student",
    student_id: "",
    graduation_year: new Date().getFullYear(),
    department: "",
    designation: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.fetch('/admin/users');
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/users', newUser);
      toast.success("User account created successfully");
      setIsCreateModalOpen(false);
      setNewUser({
        email: "",
        full_name: "",
        password: "",
        role: "student",
        student_id: "",
        graduation_year: new Date().getFullYear(),
        department: "",
        designation: ""
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await api.fetch(`/admin/users/${userId}`, { method: 'DELETE' });
      toast.success('User deleted successfully');
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await api.fetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      toast.success(`User role updated to ${newRole}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/dashboard')}
        className="-ml-2 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <PageHeader 
        title="User Management" 
        description="Manage all platform accounts, roles, and permissions"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/students')}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Students
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/faculty')}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Faculty
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="faculty">Faculty</option>
            <option value="student">Students</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading user records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            user.full_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'faculty' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'student' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <div className="relative">
                           <select 
                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none pr-6"
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                            value={user.role}
                           >
                             <option value="admin">Admin</option>
                             <option value="faculty">Faculty</option>
                             <option value="student">Student</option>
                             <option value="alumni">Alumni</option>
                           </select>
                           <Shield className="h-3 w-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No users found matching your search.</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Field label="Role">
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrator</option>
              <option value="alumni">Alumni</option>
            </Select>
          </Field>

          <Field label="Full Name">
            <Input
              type="text"
              value={newUser.full_name}
              onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
              placeholder="Enter full name"
              required
            />
          </Field>

          <Field label="Email Address">
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              placeholder="name@example.com"
              required
            />
          </Field>

          <Field label="Initial Password (Optional)">
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              placeholder="Leave blank to email an auto-generated password"
            />
          </Field>

          {newUser.role === 'student' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Student ID (Optional)">
                <Input
                  type="text"
                  value={newUser.student_id}
                  onChange={(e) => setNewUser({...newUser, student_id: e.target.value})}
                  placeholder="Leave blank to auto-generate"
                />
              </Field>
              <Field label="Graduation Year">
                <Input
                  type="number"
                  value={newUser.graduation_year}
                  onChange={(e) => setNewUser({...newUser, graduation_year: parseInt(e.target.value)})}
                  required
                />
              </Field>
            </div>
          )}

          {newUser.role === 'faculty' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department">
                <Input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  placeholder="Computer Science"
                  required
                />
              </Field>
              <Field label="Designation">
                <Input
                  type="text"
                  value={newUser.designation}
                  onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                  placeholder="Professor"
                  required
                />
              </Field>
            </div>
          )}

          {newUser.role === 'alumni' && (
            <Field label="Graduation Year">
              <Input
                type="number"
                value={newUser.graduation_year}
                onChange={(e) => setNewUser({...newUser, graduation_year: parseInt(e.target.value)})}
                required
              />
            </Field>
          )}

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
