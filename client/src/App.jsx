import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
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
import { NotFoundPage } from './routes/NotFoundPage';

function HomeRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <FeedPage /> : <LandingPage />;
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-page text-primary selection:bg-accent-soft selection:text-accent">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Home and Core Features */}
              <Route path="/" element={<HomeRoute />} />
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

              {/* Profile and Settings */}
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/settings/profile" element={<ProtectedRoute><SettingsProfilePage /></ProtectedRoute>} />

              {/* Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
