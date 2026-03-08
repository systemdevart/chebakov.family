import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import TreePage from './pages/TreePage';
import TimelinePage from './pages/TimelinePage';
import MapPage from './pages/MapPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { useAuthStore } from './store/authStore';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      {!isAdminRoute && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<TreePage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin" element={<AdminLoginWrapper />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminLoginWrapper() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminLogin />;
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
