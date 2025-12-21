import React, { useEffect, useState } from 'react';
import { scanJobMarket } from '../services/geminiService';
import { Job } from '../types';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';

const Jobs: React.FC = () => {
  const { user } = useUser();
  const { openSettings } = useSettings();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user.role) {
      loadJobs();
    }
  }, [user.targetRole, user.location, user.role]);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
        const role = user.targetRole || user.role || "Software Engineer";
        const location = user.preferences?.targetLocations?.[0] || user.location || "Remote";
        const result = await scanJobMarket(role, location);
        setJobs(result);
    } catch (err: any) {
        console.error(err);
        setError("Unable to scan job market. Please ensure your API key is configured.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Job Market Scanner</h1>
            <p className="text-gray-500 mt-1">Real-time matching engine finding roles that fit your current skill matrix.</p>
        </div>
        <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">radar</span>
                Live Scan Active
            </span>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex flex-col sm:flex-row items-center gap-3">
             <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined">error</span>
                 <div>
                     <p className="font-bold">Scan Failed</p>
                     <p className="text-sm">{error}</p>
                 </div>
             </div>
             <div className="flex gap-2 ml-auto mt-3 sm:mt-0">
                 <button onClick={openSettings} className="px-4 py-2 bg-white border border-red-200 rounded-lg hover:bg-red-50 text-sm font-bold text-red-700 whitespace-nowrap">Update API Key</button>
                 <button onClick={loadJobs} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold whitespace-nowrap">Retry</button>
             </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
             <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse"></div>
                ))}
            </div>
        ) : (
            jobs.map((job, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500">
                                {job.company.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{job.title}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                    <span className="font-medium text-gray-700">{job.company}</span>
                                    <span>•</span>
                                    <span>{job.location}</span>
                                    <span>•</span>
                                    <span className="text-green-600 font-medium">{job.salaryRange}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{job.type}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm text-gray-500 mb-1">Match Score</div>
                                <div className="flex items-center gap-2 justify-end">
                                    <div className="text-2xl font-bold text-gray-900">{job.matchScore}%</div>
                                    <div className={`w-2 h-2 rounded-full ${job.matchScore >= 80 ? 'bg-green-500' : job.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                </div>
                            </div>
                            <button className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                                Apply
                            </button>
                        </div>
                    </div>

                    {job.missingSkills.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-start gap-2">
                            <span className="text-xs font-bold text-red-500 uppercase mt-1">Missing Skills:</span>
                            <div className="flex flex-wrap gap-2">
                                {job.missingSkills.map(skill => (
                                    <span key={skill} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium border border-red-100">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 ml-auto flex items-center gap-1 cursor-pointer hover:text-primary">
                                Add to roadmap <span className="material-symbols-outlined text-sm">add_circle</span>
                            </span>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Jobs;