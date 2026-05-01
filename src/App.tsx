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
import { EmptyState } from './components/ui';
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
                user?.role === 'admin' || user?.role === 'faculty' 
                  ? <Admin /> 
                  : <Dashboard />
              } 
            />
            <Route path="/yearbook" element={<Yearbook />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            
            {/* Admin Specific Routes */}
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/students" element={<ManageStudents />} />
            <Route path="/admin/faculty" element={<ManageFaculty />} />
            <Route path="/admin/events" element={<ManageEvents />} />
            <Route path="/admin/announcements" element={<CreateAnnouncement />} />
            <Route path="/admin/moderation" element={<ContentModeration />} />

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
