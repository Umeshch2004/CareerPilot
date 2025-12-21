import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface UserContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  loading: boolean;
  updateUser: (profile: Partial<UserProfile>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Initial empty state
const initialUser: UserProfile = {
    name: '', role: '', location: '', avatarUrl: '', bio: '', joinedDate: '', openToOpportunities: false,
    targetRole: '', readinessScore: 0, profileStrength: 0, level: '',
    insights: [], skills: [], experience: [], education: [], certifications: [], projects: [],
    preferences: { weeklyHours: 0, learningStyle: 'Visual', remotePreference: 'Remote', targetLocations: [], salaryRange: '', availability: 'Immediate', companySize: 'Startup' }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedEmail = localStorage.getItem('careerpilot_active_user');
      if (storedEmail) {
        try {
          // Fetch the specific user by email
          const userData = await api.user.get(storedEmail);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem('careerpilot_active_user');
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
      setLoading(true);
      try {
          const userData = await api.auth.login(email, password);
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('careerpilot_active_user', userData.email || email);
      } catch (error) {
          console.error("Login failed", error);
          throw error;
      } finally {
          setLoading(false);
      }
  };

  const register = async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
          const userData = await api.auth.register({ name, email }, password);
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('careerpilot_active_user', userData.email || email);
      } catch (error) {
          console.error("Registration failed", error);
          throw error;
      } finally {
          setLoading(false);
      }
  };

  const logout = () => {
      setUser(initialUser);
      setIsAuthenticated(false);
      localStorage.removeItem('careerpilot_active_user');
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    // Optimistic update
    setUser(prev => ({ ...prev, ...updates }));
    
    // Persist to backend (or mock storage)
    try {
        // Pass the user's email so the backend knows who to update
        await api.user.update({ ...updates, email: user.email });
    } catch (e) {
        console.error("Failed to save updates", e);
    }
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated, loading, updateUser, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};