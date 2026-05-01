import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './lib/stores/authStore';
import './index.css';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PublicLanding } from './pages/PublicLanding';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Yearbook } from './pages/Yearbook';
import { Memories } from './pages/Memories';
import { Alumni } from './pages/Alumni';
import { AlumniRequests } from './pages/AlumniRequests';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileEdit } from './pages/ProfileEdit';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { ContentModeration } from './pages/admin/ContentModeration';
import { ManageStudents } from './pages/admin/ManageStudents';
import { ManageFaculty } from './pages/admin/ManageFaculty';
import { ManageEvents } from './pages/admin/ManageEvents';
import { Announcements } from './pages/Announcements';
import { ManageUsers } from './pages/admin/ManageUsers';
import { CreateAnnouncement } from './pages/admin/CreateAnnouncement';
import { NotFound } from './pages/NotFound';
import { ThemeProvider } from './lib/hooks/useTheme';

function App() {
  const { checkAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/onboarding" element={<Onboarding />} />
            <Route 
              path="/dashboard" 
              element={
                user?.role === 'admin'
                  ? <Admin /> 
                  : <Dashboard />
              } 
            />
            <Route path="/yearbook" element={<Yearbook />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/alumni/requests" element={<AlumniRequests />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            
            {/* Admin Specific Routes */}
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><ManageStudents /></ProtectedRoute>} />
            <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><ManageFaculty /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><ManageEvents /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['admin']}><CreateAnnouncement /></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['admin']}><ContentModeration /></ProtectedRoute>} />

            <Route
              path="/announcements"
              element={<Announcements />}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
