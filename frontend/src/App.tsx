import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import FarmerLogin from './pages/FarmerLogin';
import ConsumerLogin from './pages/ConsumerLogin';
import FarmerDetails from './pages/FarmerDetails';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import Mission from './pages/Mission';
import Vision from './pages/Vision';
import Chatbot from './components/Chatbot';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const ProtectedRoute = ({ children, allowedRole }: { children: JSX.Element, allowedRole: string }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) return <Navigate to="/" replace />;
    if (role !== allowedRole) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <div className={`min-h-screen flex flex-col relative z-10 w-full transition-colors duration-500`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className={`flex-1 w-full flex flex-col ${!isLanding ? 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8' : ''}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/farmer/login" element={<FarmerLogin />} />
          <Route path="/consumer/login" element={<ConsumerLogin />} />
          
          <Route 
            path="/farmer/details" 
            element={
              <ProtectedRoute allowedRole="farmer">
                <FarmerDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/home" 
            element={
              <ProtectedRoute allowedRole="consumer">
                <HomePage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/settings" 
            element={<SettingsPage />} 
          />
        </Routes>
      </main>
      <Chatbot />
    </div>
  );
}

export default App;
