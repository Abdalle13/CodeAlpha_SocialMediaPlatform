import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Navbar } from './components/Navbar';
import { FeedPage } from './routes/FeedPage';
import { ExplorePage } from './routes/ExplorePage';
import { SavedPostsPage } from './routes/SavedPostsPage';
import { NotificationsPage } from './routes/NotificationsPage';
import { MessagesPage } from './routes/MessagesPage';
import { TermsPage } from './routes/TermsPage';
import { PrivacyPage } from './routes/PrivacyPage';
import { LoginPage } from './routes/LoginPage';
import { RegisterPage } from './routes/RegisterPage';
import { ForgotPasswordPage } from './routes/ForgotPasswordPage';
import { ResetPasswordPage } from './routes/ResetPasswordPage';
import { ProfilePage } from './routes/ProfilePage';
import { PostDetailPage } from './routes/PostDetailPage';
import { SettingsProfilePage } from './routes/SettingsProfilePage';
import { OnboardingProfilePage } from './routes/OnboardingProfilePage';
import { AdminDashboardPage } from './routes/AdminDashboardPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

function HomeRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return user ? <FeedPage /> : <LoginPage />;
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const isAuthPage =
    !user &&
    (location.pathname === '/' ||
      location.pathname === '/login' ||
      location.pathname === '/register' ||
      location.pathname === '/forgot-password' ||
      location.pathname === '/reset-password');

  return (
    <div className="flex min-h-screen flex-col bg-page text-primary selection:bg-accent-soft selection:text-accent">
      <Navbar />
      <main className={`flex-1 flex flex-col ${isAuthPage ? '' : 'pb-24 sm:pb-28'}`}>
        <ErrorBoundary>
          <Routes>
            {/* Home and Core Features */}
            <Route path="/" element={<HomeRoute />} />
            <Route path="/welcome" element={<Navigate to="/" replace />} />
            <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/saved" element={<ProtectedRoute><SavedPostsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />

            {/* Public Informational */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Profile, Settings, and Admin */}
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingProfilePage /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/settings/profile" element={<ProtectedRoute><SettingsProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />

            {/* Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
