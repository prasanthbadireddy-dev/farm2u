import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon, Zap, Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface NavbarProps {
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export default function Navbar({ theme, toggleTheme }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const token = localStorage.getItem('token');
  const name  = localStorage.getItem('name');
  const role  = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const isLanding = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll helper: if already on landing page scroll to section, else navigate then scroll
  const handleNavClick = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const scrollTo = () => {
      if (sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    if (isLanding) {
      scrollTo();
    } else {
      navigate('/');
      setTimeout(scrollTo, 400);
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-[#051f1c]/70 border-b border-gray-200 dark:border-white/10 transition-colors duration-500">
      {/* Animated neon top stripe */}
      <div
        className="h-0.5 w-full overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #22c55e, #06b6d4, #a855f7, #f59e0b, #22c55e)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 4s linear infinite',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link
              to={role === 'farmer' ? '/farmer/details' : token ? '/home' : '/'}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 bg-white overflow-hidden p-0.5 ring-1 ring-green-500/20">
                  <img src="/logo.jpg" alt="FARM2U Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
              </div>
              <div className="hidden md:block">
                <span className="font-black text-xl text-gray-900 dark:text-white tracking-tight">FARM2U</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-yellow-500 shadow-sm" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-green-600 dark:text-green-400">AI Platform</span>
                </div>
              </div>
            </Link>

            {/* Nav Links - Visible on all pages for guests */}
            {!token && (
              <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 dark:text-gray-300 ml-4">
                <a href="/" onClick={handleNavClick('top')} className="hover:text-green-600 dark:hover:text-white transition-colors relative group cursor-pointer">
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
                </a>
                <a href="/#features" onClick={handleNavClick('features')} className="hover:text-green-600 dark:hover:text-white transition-colors relative group cursor-pointer">
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
                </a>
                <Link to="/mission" className="hover:text-green-600 dark:hover:text-white transition-colors relative group">
                  Mission
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
                </Link>
                <Link to="/vision" className="hover:text-green-600 dark:hover:text-white transition-colors relative group">
                  Vision
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
                </Link>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-transparent hover:border-green-500/30 group"
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              ) : (
                <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              )}
            </button>

            {token ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/settings"
                  className={`p-2 rounded-xl transition-all flex items-center gap-2 ${
                    location.pathname === '/settings'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <SettingsIcon className={`w-5 h-5 ${location.pathname === '/settings' ? 'animate-spin-slow' : ''}`} />
                  <span className="hidden sm:block text-sm font-bold">Settings</span>
                </Link>

                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-white/10">
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-1 text-green-600 dark:text-green-400">{role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all group"
                  >
                    <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Link to="/consumer/login" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors">
                    Login
                  </Link>
                  <Link to="/farmer/login" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95">
                    Get Started
                  </Link>
                </div>
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 md:hidden rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu "Dialogue Box" */}
      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <motion.div
            key="mobile-nav-box"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="md:hidden fixed inset-x-4 top-20 z-[60] rounded-[32px] border border-gray-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-[#051f1c]/95 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          >
            <div className="px-8 py-10 flex flex-col gap-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Home', section: 'top' },
                  { name: 'Features', section: 'features' },
                ].map((link) => (
                  <a
                    key={link.name}
                    href="#"
                    onClick={handleNavClick(link.section)}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-center text-lg font-black text-gray-900 dark:text-white border border-transparent hover:border-green-500/50 transition-all cursor-pointer"
                  >
                    {link.name}
                  </a>
                ))}
                {[
                  { name: 'Mission', path: '/mission' },
                  { name: 'Vision', path: '/vision' },
                ].map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-center text-lg font-black text-gray-900 dark:text-white border border-transparent hover:border-green-500/50 transition-all"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <hr className="border-gray-200 dark:border-white/10" />
              <div className="flex flex-col gap-4">
                 <Link to="/consumer/login" onClick={() => setMobileMenuOpen(false)} className="text-center p-3 text-lg font-bold text-gray-600 dark:text-gray-400 hover:text-white">Login</Link>
                 <Link to="/farmer/login" onClick={() => setMobileMenuOpen(false)} className="bg-green-600 text-white p-5 rounded-[24px] text-center font-black shadow-xl shadow-green-600/30 hover:bg-green-500 active:scale-95 transition-all">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
