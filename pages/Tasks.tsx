import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';

const Tasks: React.FC = () => {
  const { user } = useUser();
  const { openSettings } = useSettings();
  const { tasks, loading, error, toggleTaskStatus, generateNewTasks } = useTasks();
  const [focusArea, setFocusArea] = useState<string>('');
  
  // Ref to track if we've already attempted initial generation to prevent loops
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
      // Determine focus area on mount/user change
      const area = getSmartFocusArea();
      setFocusArea(area);
      
      // Auto-generate if empty, not loading, no error, and haven't tried yet
      if (!loading && tasks.length === 0 && !error && !hasGeneratedRef.current && user.email) {
          hasGeneratedRef.current = true;
          generateNewTasks(area);
      }
  }, [user.email, user.role, user.targetRole, tasks.length]);

  // Helper to determine what the AI should focus on based on previous analysis
  const getSmartFocusArea = () => {
    // 1. Try to find the active phase in Roadmap
    const roadmapKey = `careerpilot_roadmap_v2_${user.email}_${user.role}_${user.targetRole}`;
    const cachedRoadmap = localStorage.getItem(roadmapKey);
    if (cachedRoadmap) {
        try {
            const roadmap = JSON.parse(cachedRoadmap);
            const activePhase = roadmap.find((p: any) => p.status === 'In Progress');
            if (activePhase) return activePhase.title; // e.g., "Core Tech" or "Advanced System Design"
        } catch (e) { console.error("Error parsing cached roadmap", e); }
    }

    // 2. Try to find high priority critical gap from Analysis
    const analysisKey = `careerpilot_analysis_v2_${user.email}_${user.role}_${user.targetRole}`;
    const cachedAnalysis = localStorage.getItem(analysisKey);
    if (cachedAnalysis) {
        try {
            const analysis = JSON.parse(cachedAnalysis);
            if (analysis.criticalGaps && analysis.criticalGaps.length > 0) {
                 return `Closing Skill Gap: ${analysis.criticalGaps[0].name}`;
            }
        } catch (e) { console.error("Error parsing cached analysis", e); }
    }
    
    // 3. Fallback
    return "Core Competencies & Growth";
  };

  const handleRegenerate = () => {
      generateNewTasks(focusArea);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900">Weekly Task System</h1>
                {focusArea && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wide">
                        Focus: {focusArea}
                    </span>
                )}
            </div>
            <p className="text-gray-500">Actionable steps generated from your Roadmap phase.</p>
        </div>
        <button 
            onClick={handleRegenerate} 
            disabled={loading}
            className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold disabled:opacity-50 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50"
        >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Regenerate Week
        </button>
      </div>

      {error ? (
          <div className="w-full p-6 bg-red-50 border border-red-100 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-red-700">
              <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-2xl">error_outline</span>
                  <div>
                      <h3 className="font-bold">Error</h3>
                      <p className="text-sm">{error}</p>
                  </div>
              </div>
              <div className="flex gap-2 ml-auto mt-3 sm:mt-0">
                  <button onClick={openSettings} className="px-3 py-1 bg-white border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50 whitespace-nowrap">Update API Key</button>
                  <button onClick={handleRegenerate} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 whitespace-nowrap">Retry</button>
              </div>
          </div>
      ) : loading && tasks.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5].map(i => (
                <div key={i} className="h-56 bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
                     <div className="w-24 h-6 bg-gray-100 rounded-md animate-pulse"></div>
                     <div className="w-3/4 h-8 bg-gray-100 rounded-md animate-pulse"></div>
                     <div className="w-full h-16 bg-gray-100 rounded-md animate-pulse"></div>
                </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
                <div 
                    key={task.id} 
                    className={`bg-white p-6 rounded-xl border transition-all group relative overflow-hidden flex flex-col h-full ${
                        task.status === 'Done' ? 'border-green-200 bg-green-50/30' : 'border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                >
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                        task.status === 'Done' ? 'bg-green-500' :
                        task.type === 'Learning' ? 'bg-blue-500' : 
                        task.type === 'Practice' ? 'bg-orange-500' : 
                        task.type === 'Building' ? 'bg-purple-500' : 'bg-yellow-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start mb-3 pl-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                             task.status === 'Done' ? 'bg-green-100 text-green-700' :
                             task.type === 'Learning' ? 'bg-blue-50 text-blue-600' : 
                             task.type === 'Practice' ? 'bg-orange-50 text-orange-600' : 
                             task.type === 'Building' ? 'bg-purple-50 text-purple-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                            {task.status === 'Done' ? 'Completed' : task.type}
                        </span>
                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {task.duration}
                        </span>
                    </div>
                    
                    <h3 className={`font-bold text-gray-900 mb-2 pl-3 group-hover:text-primary transition-colors ${task.status === 'Done' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                    </h3>
                    <p className={`text-sm text-gray-500 mb-6 pl-3 line-clamp-3 ${task.status === 'Done' ? 'text-gray-400' : ''}`}>
                        {task.description}
                    </p>
                    
                    <div className="pl-3 mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                         <span className={`text-xs font-bold ${
                             task.difficulty === 'Hard' ? 'text-red-500' : 
                             task.difficulty === 'Medium' ? 'text-orange-500' : 'text-green-500'
                         }`}>
                             {task.difficulty}
                         </span>
                         <button 
                            onClick={() => toggleTaskStatus(task.id)}
                            className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                                task.status === 'Done' ? 'text-green-600' : 'text-gray-400 hover:text-primary'
                            }`}
                         >
                            <span className="material-symbols-outlined text-xl">
                                {task.status === 'Done' ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {task.status === 'Done' ? 'Done' : 'Mark Done'}
                         </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;