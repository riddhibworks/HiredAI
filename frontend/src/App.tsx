import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResumesPage from './pages/ResumesPage';
import JobFeedPage from './pages/JobFeedPage';
import SavedJobsPage from './pages/SavedJobsPage';
import JobSourcesPage from './pages/JobSourcesPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Layout wrapper containing Navigation Bar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobFeedPage />} />
          <Route path="/saved-jobs" element={<SavedJobsPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/job-sources" element={<JobSourcesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
