import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnalysisResult, RoadmapPhase, RoadmapItem } from '../types';
import { generateGapAnalysis, generateRoadmap } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';

// Helper Component for Circular Progress
const ReadinessGauge = ({ score }: { score: number }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#1754cf"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="material-symbols-outlined text-4xl text-primary">analytics</span>
      </div>
    </div>
  );
};

interface ActionItem {
    id: number;
    title: string;
    duration: string;
    tag: string;
    type: string;
}

const GapAnalysis: React.FC = () => {
  const { user, updateUser } = useUser();
  const { openSettings } = useSettings();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendedActions, setRecommendedActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for missing data entry
  const [missingRoleInput, setMissingRoleInput] = useState(user.role || '');
  const [missingTargetInput, setMissingTargetInput] = useState(user.targetRole || '');

  const currentRole = user.role;
  const targetRole = user.targetRole;
  
  const fetchData = async () => {
    if (!currentRole || !targetRole) return;

    setLoading(true);
    setError(null);

    try {
        // 1. Fetch Analysis - Always fetch fresh from AI
        const analysisResult = await generateGapAnalysis(currentRole, targetRole);
        setAnalysis(analysisResult);

        // 2. Fetch Roadmap - Always fetch fresh from AI
        const roadmapResult = await generateRoadmap(currentRole, targetRole);

        // 3. Process Roadmap into Recommended Actions
        // Flatten phases to find "In Progress" or next up items
        // Prioritize: In Progress -> Locked (Next Phase)
        const allItems: { item: RoadmapItem, phaseTitle: string, phaseDuration: string }[] = [];
        
        roadmapResult.forEach(phase => {
            if (phase.status === 'In Progress' || phase.status === 'Locked' || phase.status === 'Completed') {
                // We include completed if we are early stage, but strictly user wants "Recommended Actions"
                // Usually In Progress is best.
                 phase.items.forEach(item => {
                    if (item.status !== 'Completed') {
                         allItems.push({ item, phaseTitle: phase.title, phaseDuration: phase.duration });
                    }
                });
            }
        });

        // If no active items (e.g. all completed or weird state), grab from first phase
        if (allItems.length === 0 && roadmapResult.length > 0) {
             roadmapResult[0].items.forEach(item => {
                 allItems.push({ item, phaseTitle: roadmapResult[0].title, phaseDuration: roadmapResult[0].duration });
             });
        }

        // Take top 3
        const topItems = allItems.slice(0, 3);
        const actions: ActionItem[] = topItems.map((entry, idx) => {
            let type = 'course';
            const lowerTitle = entry.item.title.toLowerCase();
            if (lowerTitle.includes('project') || lowerTitle.includes('build')) type = 'project';
            else if (lowerTitle.includes('mentor') || lowerTitle.includes('review') || lowerTitle.includes('interview')) type = 'mentor';
            
            return {
                id: idx,
                title: entry.item.title,
                duration: entry.item.subtitle || entry.phaseDuration,
                tag: idx === 0 ? 'High Impact' : '',
                type: type
            };
        });
        
        // Fallback if empty (shouldn't happen with valid roadmap)
        if (actions.length === 0) {
            actions.push({ id: 1, title: 'Start Foundation Phase', duration: '4 Weeks', tag: 'High Impact', type: 'course' });
        }

        setRecommendedActions(actions);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to generate analysis.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    setMissingRoleInput(user.role || '');
    setMissingTargetInput(user.targetRole || '');
    if (user.role && user.targetRole) {
        fetchData();
    }
  }, [user.role, user.targetRole]);

  const handleStartAnalysis = async () => {
      if (!missingRoleInput.trim() || !missingTargetInput.trim()) return;
      setLoading(true);
      await updateUser({ role: missingRoleInput, targetRole: missingTargetInput });
  };

  // --- MOCK DATA FOR UI VISUALIZATION ---
  const marketDemand = {
      growth: 24,
      competition: 'High',
      salaryDelta: '+$45k / year',
      topHub: 'Remote / SF'
  };

  // Calculate readiness score
  const calculateScore = () => {
      if (!analysis) return 0;
      const gaps = analysis.criticalGaps.length;
      return Math.max(15, 90 - (gaps * 15));
  };

  const score = calculateScore();

  if (!currentRole || !targetRole) {
      return (
          <div className="w-full max-w-4xl mx-auto px-4 py-12">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-3xl text-primary">analytics</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialize Gap Analysis</h2>
                  <p className="text-gray-500 mb-8">Define your trajectory to generate a smart report.</p>
                  <div className="max-w-md mx-auto space-y-4 text-left">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Role</label>
                          <input 
                            type="text" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g. Product Designer"
                            value={missingRoleInput}
                            onChange={(e) => setMissingRoleInput(e.target.value)}
                          />
                      </div>
                      <div className="flex justify-center -my-2 relative z-10">
                          <span className="bg-white p-1 rounded-full border border-gray-200 text-gray-400 material-symbols-outlined text-sm">arrow_downward</span>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-primary uppercase mb-1">Target Role</label>
                          <input 
                            type="text" 
                            className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-900 font-medium"
                            placeholder="e.g. Senior Product Designer"
                            value={missingTargetInput}
                            onChange={(e) => setMissingTargetInput(e.target.value)}
                          />
                      </div>
                      <button 
                          onClick={handleStartAnalysis}
                          disabled={loading}
                          className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all mt-4 flex items-center justify-center gap-2"
                      >
                          {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Generate Report'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-3">
                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                <span className="text-xs font-bold text-primary uppercase">AI Analysis Complete</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#111318] tracking-tight">Smart Gap Analysis</h1>
            <p className="text-gray-500 mt-2 text-lg">
                Comparing your current profile against the <span className="font-bold text-gray-900">{targetRole}</span> role requirements at top-tier tech companies.
            </p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-lg">download</span>
                Export PDF
            </button>
            <Link to="/roadmap" className="flex items-center gap-2 px-5 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Start Action Plan
            </Link>
        </div>
      </header>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex flex-col sm:flex-row items-center gap-3">
             <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined">error</span>
                 <div>
                     <p className="font-bold">Analysis Failed</p>
                     <p className="text-sm">{error}</p>
                 </div>
             </div>
             <div className="flex gap-2 ml-auto mt-3 sm:mt-0">
                 <button onClick={openSettings} className="px-4 py-2 bg-white border border-red-200 rounded-lg hover:bg-red-50 text-sm font-bold text-red-700 whitespace-nowrap">Update API Key</button>
                 <button onClick={() => fetchData()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold whitespace-nowrap">Retry</button>
             </div>
        </div>
      )}

      {loading ? (
        <div className="w-full h-96 bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center animate-pulse">
             <div className="w-16 h-16 border-4 border-gray-100 border-t-primary rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 font-medium">Analyzing {targetRole} requirements...</p>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN (2/3) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Readiness Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="flex-shrink-0">
                        <ReadinessGauge score={score} />
                    </div>
                    <div className="flex-1 w-full relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">You are nearly ready</h3>
                                <p className="text-gray-500 text-sm mt-1">Estimated 3 months to close critical gaps.</p>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">High Potential</span>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <div className="flex justify-between text-sm font-semibold mb-1.5">
                                    <span className="text-gray-700">Technical Skills</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{width: '88%'}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm font-semibold mb-1.5">
                                    <span className="text-gray-700">Leadership Experience</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-accent-amber h-full rounded-full" style={{width: '62%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                </div>

                {/* 2. Critical Skill Gaps */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-sm">priority_high</span>
                             </div>
                             <h3 className="font-bold text-gray-900">Critical Skill Gaps</h3>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                            {analysis.criticalGaps.length} Priorities
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {analysis.criticalGaps.map((gap) => (
                            <div key={gap.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-base font-bold text-gray-900">{gap.name}</h4>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                        gap.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                    }`}>
                                        {gap.priority} Priority
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">{gap.description}</p>
                                
                                <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-1.5 pr-4 border border-gray-100">
                                    <div className="flex-1 flex items-center gap-3 pl-3">
                                        <span className="text-xs text-gray-500 font-medium">Your Level: <span className="text-gray-900 font-bold">{gap.currentLevel}</span></span>
                                        <span className="material-symbols-outlined text-gray-300 text-sm">arrow_forward</span>
                                        <span className="text-xs text-gray-500 font-medium">Target: <span className="text-primary font-bold">{gap.targetLevel}</span></span>
                                    </div>
                                    <Link to="/roadmap" className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 group">
                                        View Plan <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* 3. Bottom Grid: Proficiency & Emerging */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-blue-500">tune</span>
                            <h3 className="font-bold text-gray-900">Proficiency Adjustments</h3>
                        </div>
                        <div className="space-y-5">
                            {analysis.proficiencyAdjustments.map((adj, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">{adj.skill}</span>
                                        <span className={`text-xs font-bold ${adj.percentage > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                            {adj.percentage > 0 ? 'Exceeds' : 'Gap'}
                                        </span>
                                    </div>
                                    <div className="relative w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`absolute h-full rounded-full ${adj.percentage > 0 ? 'bg-green-500' : 'bg-gray-400'}`} 
                                            style={{
                                                left: adj.percentage > 0 ? '0' : '0',
                                                width: adj.percentage > 0 ? '100%' : '70%' // Mock visual width logic
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     <div className="bg-[#4338ca] rounded-2xl shadow-lg shadow-indigo-500/20 p-6 text-white relative overflow-hidden flex flex-col justify-between">
                         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                         
                         <div>
                             <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-yellow-300">lightbulb</span>
                                <h3 className="font-bold">Emerging Skills</h3>
                             </div>
                             <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                                Acquiring these future-proof skills gives you a <span className="font-bold text-white">3x advantage</span> in the current market.
                             </p>
                         </div>

                         <div className="flex flex-wrap gap-2 relative z-10">
                            {analysis.emergingSkills.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-indigo-500/40 border border-indigo-400/30 hover:bg-indigo-500/60 transition-colors rounded-lg text-xs font-semibold backdrop-blur-sm cursor-default">
                                    {skill}
                                </span>
                            ))}
                         </div>
                     </div>
                </div>

            </div>

            {/* RIGHT COLUMN (1/3) */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* 1. Market Demand */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
                        <span className="material-symbols-outlined text-primary">trending_up</span>
                        MARKET DEMAND
                    </div>
                    
                    <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                             <h3 className="text-4xl font-extrabold text-[#111318]">+{marketDemand.growth}%</h3>
                             <span className="text-sm font-bold text-green-600">YoY Growth</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Demand for {targetRole}s with AI experience is surging. This is a prime time to pivot.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Competition Level</span>
                            <span className="font-semibold text-orange-500">{marketDemand.competition}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Avg. Salary Delta</span>
                            <span className="font-semibold text-green-600">{marketDemand.salaryDelta}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Top Hub</span>
                            <span className="font-semibold text-gray-900">{marketDemand.topHub}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Recommended Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Recommended Actions</h3>
                    <p className="text-xs text-gray-500 mb-6">AI-curated to close gaps fastest</p>
                    
                    <div className="relative pl-2">
                        {/* Timeline line */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gray-100"></div>

                        <div className="space-y-8">
                            {recommendedActions.map((action) => (
                                <div key={action.id} className="relative flex gap-4 group">
                                    <div className="relative z-10 w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center flex-shrink-0 group-hover:border-primary transition-colors shadow-sm">
                                        <span className="material-symbols-outlined text-primary text-sm font-bold">
                                            {action.type === 'course' ? 'school' : action.type === 'project' ? 'code_blocks' : 'forum'}
                                        </span>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h4 className="text-sm font-bold text-gray-900 leading-tight">{action.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 mb-2">
                                            {action.duration} {action.tag && <span className="text-gray-400">• {action.tag}</span>}
                                        </p>
                                        <Link to="/roadmap" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                            {action.type === 'course' ? 'Start Course' : action.type === 'project' ? 'View Templates' : 'Find Mentor'}
                                            <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={() => navigate('/roadmap')} className="w-full mt-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-sm transition-colors">
                        View Full Roadmap
                    </button>
                </div>
                
                {/* 3. Quote */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <span className="material-symbols-outlined text-lg">smart_toy</span>
                    </div>
                    <p className="text-xs text-gray-600 italic leading-relaxed">
                        “Focusing on SQL first will increase your interview qualification rate by 40%.”
                    </p>
                </div>

            </div>
        </div>
      ) : null}
    </div>
  );
};

export default GapAnalysis;