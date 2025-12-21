import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center pt-24 w-full">
        <section className="w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-1 flex flex-col gap-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 self-center lg:self-start w-fit">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI CareerOS v2.0 Live</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#111318] leading-[1.1] tracking-tight">
                        Your Career, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Intelligently Engineered.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        CareerPilot operates as your personal AI strategist. Turn chaos into a structured roadmap and achieve your professional potential with precision guidance.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                        <Link to="/analysis" className="flex items-center justify-center gap-2 h-12 px-8 bg-primary hover:bg-blue-700 text-white text-base font-bold rounded-lg shadow-xl shadow-primary/25 transition-all transform hover:-translate-y-1">
                            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                            <span>Initialize Career OS</span>
                        </Link>
                        <Link to="/dashboard" className="flex items-center justify-center gap-2 h-12 px-8 bg-white border border-gray-200 hover:bg-gray-50 text-[#111318] text-base font-bold rounded-lg transition-all shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            <span>Open Dashboard</span>
                        </Link>
                    </div>
                </div>
                
                {/* Hero Visual */}
                <div className="flex-1 w-full max-w-[600px] lg:max-w-none relative">
                    <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                            </div>
                            <div className="ml-4 h-2 w-32 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Current Trajectory</h3>
                                    <p className="text-2xl font-bold text-gray-900">Senior Product Designer</p>
                                </div>
                                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">trending_up</span> On Track
                                </div>
                            </div>
                            
                            {/* Fake Chart Visualization */}
                            <div className="relative h-48 w-full bg-gradient-to-b from-blue-50 to-transparent rounded-lg border border-blue-100 overflow-hidden mb-6">
                                <svg className="w-full h-full p-4" viewBox="0 0 100 50" preserveAspectRatio="none">
                                    <path d="M0,50 L20,40 L40,42 L60,25 L80,15 L100,5" fill="none" stroke="#1754cf" strokeWidth="2" />
                                    <circle cx="20" cy="40" r="2" fill="white" stroke="#1754cf" />
                                    <circle cx="40" cy="42" r="2" fill="white" stroke="#1754cf" />
                                    <circle cx="60" cy="25" r="2" fill="white" stroke="#1754cf" />
                                    <circle cx="80" cy="15" r="2" fill="white" stroke="#1754cf" />
                                    <circle cx="100" cy="5" r="3" fill="#1754cf" className="animate-pulse" />
                                </svg>
                                <div className="absolute top-8 right-8 bg-white shadow-lg rounded-lg p-3 border border-gray-100 text-xs">
                                    <p className="font-bold text-gray-900">Next Milestone</p>
                                    <p className="text-gray-500">VP of Design in 18 mo</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-lg">school</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Complete Leadership Certification</p>
                                        <p className="text-xs text-gray-500">Recommended by AI</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
  );
};

export default Landing;