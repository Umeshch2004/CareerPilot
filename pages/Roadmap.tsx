import React, { useEffect, useState } from 'react';
import { generateRoadmap } from '../services/geminiService';
import { RoadmapPhase } from '../types';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';

const Roadmap: React.FC = () => {
  const { user } = useUser();
  const { openSettings } = useSettings();
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use user data or defaults if profile not yet populated
            const current = user.role || "Software Engineer";
            const target = user.targetRole || "Senior Software Engineer";
            
            // Always generate fresh roadmap from AI, no caching.
            const data = await generateRoadmap(current, target);
            setPhases(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Unable to generate roadmap. Please check your API key.");
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    load();
  }, [user.role, user.targetRole]);

  const getResourceIcon = (type: string) => {
    switch(type) {
        case 'Video': return 'play_circle';
        case 'Article': return 'article';
        case 'Documentation': return 'menu_book';
        case 'Course': return 'school';
        default: return 'link';
    }
  };

  const getResourceColor = (type: string) => {
      switch(type) {
          case 'Video': return 'text-red-500';
          case 'Article': return 'text-blue-500';
          case 'Documentation': return 'text-green-600';
          case 'Course': return 'text-purple-500';
          default: return 'text-gray-500';
      }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#111318]">Learning Roadmap</h1>
            <p className="text-gray-500 mt-1">Your personalized path from <span className="font-semibold text-gray-800">{user.role || 'Current Role'}</span> to <span className="font-semibold text-primary">{user.targetRole || 'Target Role'}</span>.</p>
        </header>

        {error ? (
             <div className="w-full p-8 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-red-600 text-2xl">error</span>
                </div>
                <h3 className="text-lg font-bold text-red-800 mb-2">Roadmap Generation Failed</h3>
                <p className="text-red-600 max-w-md mb-6">{error}</p>
                <div className="flex gap-3">
                    <button onClick={openSettings} className="px-5 py-2.5 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm shadow-sm">
                        Update API Key
                    </button>
                    <button onClick={load} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-sm shadow-sm">
                        Retry
                    </button>
                </div>
            </div>
        ) : loading ? (
             <div className="w-full h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Constructing Neural Path & Curating Resources...</p>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {phases.map((phase) => {
                    let borderColor = 'border-gray-200';
                    let dotColor = 'bg-gray-300';
                    let titleColor = 'text-gray-500';
                    let statusText = 'Locked';

                    if (phase.status === 'Completed') {
                        borderColor = 'border-green-500';
                        dotColor = 'bg-green-500';
                        titleColor = 'text-gray-900';
                        statusText = 'Completed';
                    } else if (phase.status === 'In Progress') {
                        borderColor = 'border-primary';
                        dotColor = 'bg-primary';
                        titleColor = 'text-gray-900';
                        statusText = 'In Progress';
                    }

                    return (
                        <div key={phase.id} className={`lg:col-span-1 border-l-2 ${borderColor} pl-6 relative pb-12`}>
                            <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${dotColor} border-2 border-white ${phase.status === 'In Progress' ? 'animate-pulse' : ''}`}></span>
                            <h3 className={`font-bold ${titleColor} mb-2`}>{phase.title}</h3>
                            <p className={`text-sm ${phase.status === 'In Progress' ? 'text-primary font-semibold' : 'text-gray-500'} mb-4`}>
                                {statusText} • {phase.duration}
                            </p>
                            <div className="space-y-4">
                                {phase.items.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border transition-all ${
                                        item.status === 'Completed' ? 'bg-green-50 border-green-100' :
                                        item.status === 'In Progress' ? 'bg-white border-primary/30 shadow-md ring-1 ring-primary/5 relative' :
                                        'bg-gray-50 border-gray-200 border-dashed opacity-75 hover:opacity-100'
                                    }`}>
                                        {item.status === 'In Progress' && (
                                             <span className="absolute top-2 right-2 text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">Current</span>
                                        )}
                                        <h4 className={`font-medium text-sm ${item.status === 'Locked' ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {item.title}
                                        </h4>
                                        {item.subtitle && <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>}
                                        
                                        {item.progress !== undefined && item.status !== 'Locked' && (
                                             <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
                                                <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{width: `${item.progress}%`}}></div>
                                            </div>
                                        )}

                                        {/* Resources Section */}
                                        {item.resources && item.resources.length > 0 && item.status !== 'Locked' && (
                                            <div className="mt-4 pt-3 border-t border-gray-100/50">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recommended</p>
                                                <div className="flex flex-col gap-2">
                                                    {item.resources.map((res, rIdx) => (
                                                        <a 
                                                            key={rIdx} 
                                                            href={res.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 group/link"
                                                        >
                                                            <span className={`material-symbols-outlined text-sm ${getResourceColor(res.type)}`}>
                                                                {getResourceIcon(res.type)}
                                                            </span>
                                                            <span className="text-xs text-gray-600 group-hover/link:text-primary group-hover/link:underline truncate">
                                                                {res.title}
                                                            </span>
                                                            <span className="material-symbols-outlined text-[10px] text-gray-300 ml-auto opacity-0 group-hover/link:opacity-100">open_in_new</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default Roadmap;