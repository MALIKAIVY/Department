import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/stores/authStore';
import './index.css';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Yearbook } from './pages/Yearbook';
import { Alumni } from './pages/Alumni';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileEdit } from './pages/ProfileEdit';
import { Search } from './pages/Search';
import { Admin } from './pages/Admin';
import { NotFound } from './pages/NotFound';
import { EmptyState } from './components/ui';
import { ThemeProvider } from './lib/hooks/useTheme';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/yearbook" element={<Yearbook />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><Admin /></ProtectedRoute>} />
            <Route
              path="/announcements"
              element={<EmptyState title="Announcements" description="No announcements yet. Stay tuned for updates." />}
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
