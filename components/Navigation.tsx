import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_AVATAR } from '../utils/constants';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUser();
  const { isSettingsOpen, openSettings, closeSettings } = useSettings();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Load current key if exists on mount
  useEffect(() => {
    setApiKey(localStorage.getItem('gemini_api_key') || '');
  }, [isAuthenticated, isSettingsOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
      logout();
      setIsProfileOpen(false);
      navigate('/');
  };

  const handleSaveSettings = () => {
      if (apiKey.trim()) {
          localStorage.setItem('gemini_api_key', apiKey.trim());
      } else {
          localStorage.removeItem('gemini_api_key');
      }
      closeSettings();
      window.location.reload(); // Reload to ensure services pick up new key
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Analysis', path: '/analysis' },
    { name: 'Roadmap', path: '/roadmap' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Projects', path: '/projects' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Interview', path: '/interview' },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full glass-panel transition-colors duration-300 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between md:h-16 py-3 md:py-0 gap-3 md:gap-0">
          
          {/* Logo Section */}
          <div className="w-full md:w-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="flex items-center justify-center size-8 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">rocket_launch</span>
              </div>
              <h2 className="text-[#111318] text-lg font-bold tracking-tight">CareerPilot</h2>
            </Link>
            
            {/* Mobile Profile Toggle (Visible only on small screens) */}
            <div className="md:hidden flex items-center gap-3">
               {isAuthenticated ? (
                   <img
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      alt="User"
                      className="w-8 h-8 rounded-full border border-gray-200 object-cover bg-gray-200"
                      src={user.avatarUrl || DEFAULT_AVATAR}
                    />
               ) : (
                    <Link to="/signin" className="text-primary font-semibold text-sm">Sign In</Link>
               )}
            </div>
          </div>

          {/* Navigation Items - Scrollable on mobile - Only visible if authenticated */}
          {isAuthenticated && (
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg border border-gray-200 min-w-max mx-auto md:mx-0">
                {navItems.map((item) => (
                    <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 ${
                        isActive(item.path)
                        ? 'bg-white text-primary shadow-sm font-bold ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                    >
                    {item.name}
                    </Link>
                ))}
                </div>
            </div>
          )}

          {/* Desktop User Profile & Dropdown / Sign In Button */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
                <>
                    <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    </button>
                    <div className="h-8 w-[1px] bg-gray-200"></div>
                    
                    <div className="relative" ref={profileRef}>
                        <div 
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">Pro Plan</p>
                            </div>
                            <img
                                alt="User"
                                className="w-9 h-9 rounded-full border border-gray-200 object-cover shadow-sm bg-gray-200"
                                src={user.avatarUrl || DEFAULT_AVATAR}
                            />
                        </div>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-fade-in origin-top-right z-50">
                                <Link 
                                    to="/profile" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">person</span>
                                        My Profile
                                    </div>
                                </Link>
                                <button 
                                    onClick={() => { openSettings(); setIsProfileOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">settings</span>
                                        Settings
                                    </div>
                                </button>
                                <div className="h-[1px] bg-gray-100 my-1"></div>
                                <button 
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">logout</span>
                                        Sign Out
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-3">
                    <Link to="/signin" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors">
                        Log In
                    </Link>
                    <Link to="/signup" className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
                        Sign Up
                    </Link>
                </div>
            )}
          </div>

        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-500">settings</span>
                          Application Settings
                      </h3>
                      <button onClick={closeSettings} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                          <span className="material-symbols-outlined text-gray-500">close</span>
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Google Gemini API Key</label>
                          <p className="text-xs text-gray-500 mb-3">
                              The default system key has exceeded its quota. To continue using AI features, please provide your own free API key from Google AI Studio.
                          </p>
                          <input 
                              type="password" 
                              value={apiKey} 
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="AIzaSy..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                          />
                          <div className="mt-2 text-right">
                              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline flex items-center justify-end gap-1">
                                  Get a free API key <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                              </a>
                          </div>
                      </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                      <button onClick={closeSettings} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                      <button onClick={handleSaveSettings} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-md transition-colors">Save & Reload</button>
                  </div>
              </div>
          </div>
      )}
    </nav>
  );
};

export default Navigation;