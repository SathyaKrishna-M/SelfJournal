import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/store';
import { AuthService } from './features/auth/authService';
import { TimeService } from './core/time/timeService';
import { ReminderService } from './features/reminder/reminderService';
import SetupPage from './features/auth/SetupPage';
import LoginPage from './features/auth/LoginPage';
import RecoveryPage from './features/auth/RecoveryPage';
import BookJournalLayout from './features/journal/BookJournalLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    AuthService.isSetup().then(setIsSetup);
    TimeService.runIntegrityCheck().catch(console.error);
    ReminderService.init().catch(console.error);

    // Check for "smart" reminder every minute when app is open
    const interval = setInterval(() => {
      ReminderService.checkAndNotify().catch(console.error);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isSetup === null) {
    return <div className="flex items-center justify-center h-screen bg-stone-50 dark:bg-dark-bg text-stone-500 dark:text-stone-400">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isSetup ? <Navigate to="/login" replace /> : <Navigate to="/setup" replace />
        } />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recover" element={<RecoveryPage />} />

        <Route path="/journal" element={
          <ProtectedRoute>
            <BookJournalLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
