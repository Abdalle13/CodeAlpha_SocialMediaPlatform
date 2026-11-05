import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './routes/LandingPage';
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

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-page text-primary selection:bg-accent-soft selection:text-accent">
          <Navbar />
          <main className="flex-1 pb-28">
            <ErrorBoundary>
              <Routes>
              {/* Home and Core Features */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
              <Route path="/explore" element={<ExplorePage />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
