
import { UserProfile, Task, Project } from '../types';
import { DEFAULT_AVATAR } from '../utils/constants';

// --- CONFIGURATION ---
// Set to false to fix "Failed to fetch" errors when backend server is not running.
const USE_REAL_BACKEND = false; 
const API_BASE_URL = 'http://localhost:3001/api';

// --- MOCK DATA SEED ---
const MOCK_USER_ID = '1';

// 1. Full Demo Profile (Alex)
const DEFAULT_USER_DATA: UserProfile = {
  name: 'Alex Mercer',
  role: 'Senior Product Designer',
  location: 'San Francisco, CA',
  avatarUrl: DEFAULT_AVATAR,
  bio: 'Passionate Senior Product Designer with over 7 years of experience building accessible, user-centric digital products. I specialize in design systems, prototyping, and user research.',
  email: 'alex@example.com',
  phone: '+1 (555) 012-3456',
  joinedDate: 'March 2023',
  openToOpportunities: true,
  targetRole: 'Staff Product Designer',
  targetIndustry: 'SaaS / FinTech',
  timelineGoal: '6 Months',
  readinessScore: 85,
  profileStrength: 85,
  level: 'Senior',
  resumeLastUpdated: 'Oct 24, 2023',
  insights: [
      { type: 'Success', message: 'Strong experience description in "TechFlow".' },
      { type: 'Warning', message: 'Consider adding metric outcomes to your project "EcoTrack".' }
  ],
  skills: [
    { name: 'UI Design', category: 'Domain', level: 'Expert', verified: true, source: 'Resume', confidence: 95 },
    { name: 'Figma', category: 'Tools', level: 'Expert', verified: true, source: 'Project', confidence: 98 },
    { name: 'Prototyping', category: 'Domain', level: 'Expert', verified: true, source: 'Resume', confidence: 90 },
    { name: 'React', category: 'Technical', level: 'Intermediate', verified: false, source: 'Task', confidence: 65 },
  ],
  experience: [
    {
      id: '1',
      company: 'TechFlow Inc.',
      role: 'Senior Product Designer',
      startDate: '2021',
      endDate: 'Present',
      type: 'Full-time',
      description: 'Spearheaded the redesign of the core SaaS platform.',
      skillsUsed: ['Figma', 'React'],
      impactMetrics: ['25% increase in user retention']
    }
  ],
  education: [
    { id: '1', institution: 'California College of the Arts', degree: 'BA Interaction Design', year: '2014 - 2018' }
  ],
  certifications: [
      { id: '1', name: 'Google UX Design', issuer: 'Google', date: 'Jan 2023' }
  ],
  projects: [
    {
      id: '1',
      name: 'FinTech Dashboard',
      type: 'Professional',
      description: 'Financial analytics tool.',
      techStack: ['Figma', 'React'],
      image: 'https://picsum.photos/seed/fintech/400/200'
    }
  ],
  preferences: {
    weeklyHours: 15,
    learningStyle: 'Visual',
    remotePreference: 'Hybrid',
    targetLocations: ['San Francisco'],
    salaryRange: '$180k+',
    availability: '3-6 Months',
    companySize: 'Scale-up'
  }
};

// 2. Empty Profile Template (New Users / Umesh)
const EMPTY_USER_DATA: UserProfile = {
    name: '',
    role: '',
    location: '',
    avatarUrl: DEFAULT_AVATAR,
    bio: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    joinedDate: '', // Set on creation
    openToOpportunities: false,
    
    targetRole: '',
    targetIndustry: '',
    targetCompanies: [],
    timelineGoal: undefined,
    
    readinessScore: 0,
    level: '',
    profileStrength: 0,
    insights: [],
    
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    preferences: {
        weeklyHours: 0,
        learningStyle: 'Visual',
        remotePreference: 'Remote',
        targetLocations: [],
        salaryRange: '',
        availability: 'Immediate',
        companySize: 'Startup'
    }
};

// --- MOCK BACKEND IMPLEMENTATION (LocalStorage) ---
class MockBackend {
    private getStorageKey(key: string) { return `careerpilot_v7_${key}`; }

    private getUsersDB(): any[] {
        const key = this.getStorageKey('users_db');
        const stored = localStorage.getItem(key);
        
        if (!stored || stored === '[]') {
            const seed = [
                { ...DEFAULT_USER_DATA, password: 'password' },
                { 
                    ...EMPTY_USER_DATA, 
                    name: 'Umesh Chapala', 
                    email: 'umeshchapala@gmail.com', 
                    password: 'password',
                    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                }
            ];
            localStorage.setItem(key, JSON.stringify(seed));
            return seed;
        }
        
        try {
            return JSON.parse(stored);
        } catch (e) {
            const seed = [{ ...DEFAULT_USER_DATA, password: 'password' }];
            localStorage.setItem(key, JSON.stringify(seed));
            return seed;
        }
    }

    private saveUsersDB(users: any[]) {
        localStorage.setItem(this.getStorageKey('users_db'), JSON.stringify(users));
    }

    register(user: Partial<UserProfile>, password: string): UserProfile {
        const users = this.getUsersDB();
        if (users.find(u => u.email === user.email)) {
            throw new Error("User already exists");
        }

        const newUser: UserProfile = {
            ...EMPTY_USER_DATA,
            name: user.name || '',
            email: user.email || '',
            joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };

        users.push({ ...newUser, password });
        this.saveUsersDB(users);
        return newUser;
    }

    login(email: string, password: string): UserProfile {
        const users = this.getUsersDB();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            const { password, ...profile } = user;
            return profile;
        }
        throw new Error("Invalid credentials");
    }

    getUser(email?: string): UserProfile {
        if (email) {
             const users = this.getUsersDB();
             const user = users.find(u => u.email === email);
             if (user) {
                 const { password, ...profile } = user;
                 return profile;
             }
        }
        return DEFAULT_USER_DATA;
    }

    updateUser(email: string, updates: Partial<UserProfile>): UserProfile {
        const users = this.getUsersDB();
        const index = users.findIndex(u => u.email === email);
        
        if (index !== -1) {
            const updatedUser = { ...users[index], ...updates };
            users[index] = updatedUser;
            this.saveUsersDB(users);
            const { password, ...profile } = updatedUser;
            return profile;
        }
        return DEFAULT_USER_DATA;
    }

    getTasks(userId: string): Task[] {
        // Scoped by userId (email in this case)
        const stored = localStorage.getItem(this.getStorageKey(`tasks_${userId}`));
        return stored ? JSON.parse(stored) : [];
    }

    saveTasks(userId: string, tasks: Task[]): Task[] {
        localStorage.setItem(this.getStorageKey(`tasks_${userId}`), JSON.stringify(tasks));
        return tasks;
    }
}

// --- REAL BACKEND IMPLEMENTATION (Fetch) ---
class RealBackend {
    async register(user: Partial<UserProfile>, password: string): Promise<UserProfile> {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...user, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Registration failed');
        }
        return res.json();
    }

    async login(email: string, password: string): Promise<UserProfile> {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
        }
        return res.json();
    }

    async getUser(email: string): Promise<UserProfile> {
        const res = await fetch(`${API_BASE_URL}/user/${email}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
    }

    async updateUser(email: string, updates: Partial<UserProfile>): Promise<UserProfile> {
        const res = await fetch(`${API_BASE_URL}/user/${email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Update failed');
        return res.json(); // Usually returns success message, might need re-fetch or manual merge
    }

    async getTasks(email: string): Promise<Task[]> {
        const res = await fetch(`${API_BASE_URL}/tasks/${email}`);
        if (!res.ok) return [];
        return res.json();
    }

    async saveTasks(email: string, tasks: Task[]): Promise<Task[]> {
        const savedTasks: Task[] = [];
        for (const task of tasks) {
            const res = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, ...task })
            });
            if (res.ok) {
                const data = await res.json();
                savedTasks.push(data);
            }
        }
        return savedTasks;
    }
}

// --- SERVICE EXPORT ---
const mockService = new MockBackend();
const realService = new RealBackend();

export const api = {
    auth: {
        login: async (email: string, password: string) => {
             if (USE_REAL_BACKEND) return realService.login(email, password);
             return new Promise<UserProfile>((resolve, reject) => {
                 setTimeout(() => {
                    try {
                        const user = mockService.login(email, password);
                        resolve(user);
                    } catch (e) {
                        reject(e);
                    }
                 }, 800);
             });
        },
        register: async (user: Partial<UserProfile>, password: string) => {
            if (USE_REAL_BACKEND) return realService.register(user, password);
            return new Promise<UserProfile>((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const newUser = mockService.register(user, password);
                        resolve(newUser);
                    } catch (e) {
                        reject(e);
                    }
                }, 800);
            });
        }
    },
    user: {
        get: async (email?: string) => {
            if (USE_REAL_BACKEND && email) return realService.getUser(email);
            return new Promise<UserProfile>(resolve => setTimeout(() => resolve(mockService.getUser(email)), 500)); 
        },
        update: async (updates: Partial<UserProfile>) => {
            const email = updates.email || DEFAULT_USER_DATA.email;
            if (USE_REAL_BACKEND && email) {
                await realService.updateUser(email, updates);
                return updates as UserProfile; // Optimistic return
            }
            return new Promise<UserProfile>(resolve => setTimeout(() => resolve(mockService.updateUser(email as string, updates)), 300));
        }
    },
    tasks: {
        getAll: async (email?: string) => {
             if (USE_REAL_BACKEND && email) return realService.getTasks(email);
             // Use email as ID for mock if available, else default
             const mockId = email || MOCK_USER_ID; 
             return new Promise<Task[]>(resolve => setTimeout(() => resolve(mockService.getTasks(mockId)), 400));
        },
        saveBatch: async (tasks: Task[], email?: string) => {
            if (USE_REAL_BACKEND && email) return realService.saveTasks(email, tasks);
            const mockId = email || MOCK_USER_ID;
            return new Promise<Task[]>(resolve => setTimeout(() => resolve(mockService.saveTasks(mockId, tasks)), 400));
        }
    }
};
