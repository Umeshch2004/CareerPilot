import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { SettingsProvider } from './context/SettingsContext';
import { TaskProvider } from './context/TaskContext';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import GapAnalysis from './pages/GapAnalysis';
import Interview from './pages/Interview';
import Roadmap from './pages/Roadmap';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Jobs from './pages/Jobs';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
    const { isAuthenticated, loading } = useUser();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <SettingsProvider>
        <TaskProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-[#f6f6f8]">
              <Navigation />
              <main className="pt-16">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/analysis" element={<ProtectedRoute><GapAnalysis /></ProtectedRoute>} />
                  <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                  <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
                  <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Landing />} />
                </Routes>
              </main>
            </div>
          </Router>
        </TaskProvider>
      </SettingsProvider>
    </UserProvider>
  );
};

export default App;