import React, { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../context/UserContext';
import { useTasks } from '../context/TaskContext';
import { UserProfile } from '../types';
import { Link } from 'react-router-dom';
import { analyzeResume } from '../services/geminiService';

// Helper to calculate profile strength dynamically
const calculateProfileStrength = (user: UserProfile) => {
    let score = 0;
    const requiredFields = ['name', 'role', 'location', 'bio', 'targetRole'];
    requiredFields.forEach(field => {
        const val = user[field as keyof UserProfile];
        if (typeof val === 'string' && val.length > 2) score += 10;
    });
    
    // Check avatar (simple length check for base64 or url)
    if (user.avatarUrl && user.avatarUrl.length > 50) score += 10;

    if (user.skills?.length >= 3) score += 15;
    else if (user.skills?.length > 0) score += 5;

    if (user.experience?.length >= 1) score += 15;
    if (user.education?.length >= 1) score += 5;
    if (user.projects?.length >= 1) score += 5;
    
    return Math.min(100, score);
};

// Helper to parse duration strings
const parseDuration = (duration: string): number => {
    if (!duration) return 0;
    const d = duration.toLowerCase().trim();
    
    let hours = 0;
    // Regex for "2 hours", "1.5 hr", "30 mins"
    const hourMatch = d.match(/(\d+(\.\d+)?)\s*h/);
    const minMatch = d.match(/(\d+(\.\d+)?)\s*m/);

    if (hourMatch) hours += parseFloat(hourMatch[1]);
    if (minMatch) hours += parseFloat(minMatch[1]) / 60;
    
    // Fallback if no specific unit found but number exists (assume hours)
    if (hours === 0 && !isNaN(parseFloat(d))) {
        hours = parseFloat(d);
    }
    // Fallback for generic text
    if (hours === 0) hours = 1;

    return hours;
};

const Dashboard: React.FC = () => {
  const { user, updateUser } = useUser();
  const { tasks, loading: tasksLoading } = useTasks();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Realtime Metrics State
  const [metrics, setMetrics] = useState({
      strength: 0,
      completionRate: 0,
      completedTasks: 0,
      totalTasks: 0,
      learningHours: 0,
      readinessScore: 0,
      hoursThisWeek: 0
  });

  useEffect(() => {
    // If user has email (loaded), calculate. Even if empty profile, we calculate 0s.
    if (user.email) {
        calculateMetrics();
    }
  }, [user, tasks]); // Re-run if user profile OR tasks update

  const calculateMetrics = () => {
        setLoading(true);
        try {
            // 1. Profile Strength
            const strength = calculateProfileStrength(user);
            
            // 2. Tasks (from Context)
            const completed = tasks.filter(t => t.status === 'Done');
            const compCount = completed.length;
            const totCount = tasks.length || 1; // Prevent div/0
            const rate = Math.round((compCount / totCount) * 100);

            // 3. Learning Hours
            const totalHours = completed.reduce((acc, t) => acc + parseDuration(t.duration), 0);
            
            // Simulate "This Week" (In a real app, check timestamps. Here, just take a fraction or random recent ones)
            // For demo: assume 20% of total hours were this week if total > 0
            const weekHours = Math.round(totalHours > 0 ? Math.max(1, totalHours * 0.2) : 0);

            // 4. Readiness Score
            // Formula: (Profile Strength * 0.3) + (Task Completion * 0.5) + (Base Knowledge * 0.2)
            // Base Knowledge is assumed 20 for existing users, 0 for new
            const baseKnowledge = user.experience.length > 0 ? 20 : 0;
            const rScore = Math.round((strength * 0.3) + (rate * 0.5) + baseKnowledge);
            
            setMetrics({
                strength,
                completionRate: rate,
                completedTasks: compCount,
                totalTasks: tasks.length,
                learningHours: Math.round(totalHours),
                readinessScore: Math.min(100, rScore),
                hoursThisWeek: weekHours
            });

            // 5. Generate Chart Data
            generateTrendChart(user.joinedDate, Math.min(100, rScore));

        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setLoading(false);
        }
  };

  const generateTrendChart = (joinedDateStr: string, currentScore: number) => {
      // Parse joined date
      const now = new Date();
      let joined = new Date(joinedDateStr);
      
      // Fix for "March 2023" format if Date.parse fails or returns invalid
      if (isNaN(joined.getTime())) {
          // Try appending " 1, "
          joined = new Date(`1 ${joinedDateStr}`);
          if (isNaN(joined.getTime())) {
               // Fallback to 6 months ago
               joined = new Date();
               joined.setMonth(now.getMonth() - 6);
          }
      }

      const monthsDiff = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
      const pointsToGenerate = Math.max(3, Math.min(12, monthsDiff + 1)); // Show max 12 months history
      
      const data = [];
      for (let i = 0; i < pointsToGenerate; i++) {
          // Time progress (0 to 1)
          const progress = i / (pointsToGenerate - 1);
          
          // Month Label
          const d = new Date(joined);
          d.setMonth(d.getMonth() + i);
          const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });

          // Score Calculation (Linear growth with slight random jitter)
          // Start at 10 (base), End at currentScore
          const startScore = 10;
          let calculated = startScore + ((currentScore - startScore) * progress);
          
          // Add jitter, but keep the last point exact
          if (i < pointsToGenerate - 1 && i > 0) {
              calculated += (Math.random() * 10 - 5);
          }
          
          data.push({
              name: monthLabel,
              score: Math.max(0, Math.round(calculated))
          });
      }
      setChartData(data);
  };

  const getQualitativeScore = (score: number) => {
      if (score > 80) return "Excellent";
      if (score > 60) return "Strong";
      if (score > 40) return "Good";
      return "Developing";
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const mimeType = file.type;
            
            // Analyze
            const result = await analyzeResume({ data: base64String, mimeType });
            
            // Update User Profile
            if (result && result.name) {
                // Ensure profile strength fields are updated implicitly by the data
                await updateUser(result);
                // Metrics will automatically recalculate due to useEffect dependency on 'user'
            }
            setUploading(false);
        };
        reader.readAsDataURL(file);
    } catch (e) {
        console.error("Resume upload failed", e);
        setUploading(false);
        alert("Failed to analyze resume. Please check your API key and try again.");
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">LIVE METRICS</span>
            {metrics.readinessScore > 70 && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">trending_up</span> TOP PERFORMER
                </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-[#111318] tracking-tight">Welcome, {user.name ? user.name.split(' ')[0] : 'User'}</h1>
          <p className="text-gray-500 mt-1">Overview of your path from <span className="font-bold">{user.role || 'Starter'}</span> to <span className="font-bold">{user.targetRole || 'Next Level'}</span>.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-700"
            >
                {uploading ? <span className="material-symbols-outlined animate-spin text-lg">sync</span> : <span className="material-symbols-outlined text-gray-500 text-lg">upload_file</span>}
                {uploading ? 'Analyzing...' : 'Update Resume'}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleResumeUpload} />
            
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">
                <span className="material-symbols-outlined text-lg">download</span>
                Export Report
            </button>
        </div>
      </header>

      {/* Zero State / Onboarding CTA */}
      {metrics.strength < 30 && !uploading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center mb-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md text-primary">
                  <span className="material-symbols-outlined text-3xl">rocket_launch</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialize Your Career Operating System</h2>
              <p className="text-gray-600 max-w-lg mx-auto mb-6">
                  Upload your resume to instantly generate a skill gap analysis, personalized roadmap, and profile strength score.
              </p>
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 mx-auto"
              >
                  <span className="material-symbols-outlined">cloud_upload</span>
                  Upload Resume / CV
              </button>
          </div>
      )}

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/profile" className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">flag</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Profile Strength</p>
            <div className="flex items-end gap-3 mt-2">
                <h3 className="text-2xl font-bold text-gray-900">{getQualitativeScore(metrics.strength)}</h3>
                {metrics.strength < 100 && (
                     <span className="text-xs font-medium text-primary mb-1.5 flex items-center bg-blue-50 px-1.5 py-0.5 rounded">
                        Improve <span className="material-symbols-outlined text-xs">arrow_forward</span>
                     </span>
                )}
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{width: `${metrics.strength}%`}}></div>
            </div>
        </Link>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-accent-purple">timer</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Learning Hours</p>
            <div className="flex items-end gap-3 mt-2">
                <h3 className="text-3xl font-bold text-gray-900">{metrics.learningHours}h</h3>
                <span className="text-sm font-medium text-green-500 mb-1 flex items-center">+{metrics.hoursThisWeek}h this week</span>
            </div>
            <div className="flex gap-1 mt-4">
                <div className="h-1.5 w-1/3 bg-accent-purple rounded-full"></div>
                <div className="h-1.5 w-1/3 bg-accent-purple/50 rounded-full"></div>
                <div className="h-1.5 w-1/3 bg-gray-100 rounded-full"></div>
            </div>
        </div>

        <Link to="/tasks" className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group hover:border-accent-teal transition-colors">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-accent-teal">check_circle</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
            <div className="flex items-end gap-3 mt-2">
                <h3 className="text-3xl font-bold text-gray-900">{metrics.completedTasks}/{metrics.totalTasks}</h3>
                <span className="text-sm font-medium text-gray-400 mb-1">Current Milestone</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-accent-teal h-full rounded-full transition-all duration-1000" style={{width: `${metrics.completionRate}%`}}></div>
            </div>
        </Link>

        <div className="p-5 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-20">
                <span className="material-symbols-outlined text-9xl">psychology</span>
            </div>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-blue-100 text-sm font-medium">Readiness Level</p>
                    <h3 className="text-2xl font-bold mt-2">{getQualitativeScore(metrics.readinessScore)}</h3>
                </div>
                <span className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-white">auto_awesome</span>
                </span>
            </div>
            <p className="text-xs text-blue-100 mt-4 bg-white/10 inline-block px-2 py-1 rounded">
                Calculated based on tasks & profile
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Career Velocity Trend</h3>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-xs text-gray-500">Your Pace</span>
                </div>
            </div>
            <div className="h-64 w-full">
                {loading || tasksLoading ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                        Calculating trend...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1754cf" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#1754cf" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} domain={[0, 100]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="score" stroke="#1754cf" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" animationDuration={1500} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary animate-pulse">auto_awesome</span>
                    <h3 className="text-lg font-bold text-gray-900">AI Insights</h3>
                </div>
                <div className="space-y-4">
                    {/* Dynamic Insights based on calculated metrics */}
                    {metrics.strength < 50 && (
                        <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex gap-3">
                                <div className="mt-1 min-w-[4px] h-10 rounded-full bg-accent-amber"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Complete Profile</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Your profile data is incomplete. Add more skills and bio to improve matching.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {metrics.completionRate < 30 && (
                        <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex gap-3">
                                <div className="mt-1 min-w-[4px] h-10 rounded-full bg-accent-purple"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Accelerate Learning</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Task completion is low. Try finishing 2 small tasks this week to build momentum.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {user.insights && user.insights.length > 0 ? (
                        user.insights.map((insight, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <div className="flex gap-3">
                                    <div className={`mt-1 min-w-[4px] h-10 rounded-full ${insight.type === 'Success' ? 'bg-green-500' : 'bg-accent-amber'}`}></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{insight.type === 'Success' ? 'Strength' : 'Optimization'}</h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-500">Add more details to your profile to generate personalized AI insights.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;