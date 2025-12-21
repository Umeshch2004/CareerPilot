import React, { useState, useEffect, useRef } from 'react';
import { generateInterviewQuestion, evaluateAudioAnswer } from '../services/geminiService';
import { InterviewFeedback } from '../types';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';

const Interview: React.FC = () => {
  const { user } = useUser();
  const { openSettings } = useSettings();
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState("Loading question...");
  const [feedbackData, setFeedbackData] = useState<InterviewFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const interviewRole = user.targetRole || user.role || "Product Manager";

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const loadNewQuestion = async () => {
    setQuestion("Generating question...");
    setFeedbackData(null);
    setAudioUrl(null);
    setError(null);
    try {
        // Use user's target role, fallback to generic
        const q = await generateInterviewQuestion(interviewRole, "Core Competencies");
        setQuestion(q);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Could not generate question.");
        setQuestion("Failed to load");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setFeedbackData(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = async () => {
    if (chunksRef.current.length === 0) return;

    setIsProcessing(true);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      try {
          const base64String = (reader.result as string).split(',')[1];
          const result = await evaluateAudioAnswer(question, base64String, 'audio/webm');
          setFeedbackData(result);
      } catch (e) {
          alert("Failed to analyze audio. Please try again.");
      } finally {
          setIsProcessing(false);
      }
    };
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 h-[calc(100vh-80px)] flex flex-col">
       <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">{interviewRole} Interview</h1>
                <p className="text-sm text-gray-500">Topic: Core Competencies & Strategy</p>
            </div>
            <button onClick={loadNewQuestion} className="text-sm text-primary font-semibold hover:underline">
              New Question
            </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-6">
                <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0 size-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="material-symbols-outlined text-white text-2xl">smart_toy</span>
                        </div>
                        <div className="space-y-1 w-full">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">AI Interviewer</span>
                            <h2 className={`text-2xl font-bold leading-tight ${error ? 'text-red-600' : 'text-gray-900'}`}>
                                {error ? "Connection Failed" : `"${question}"`}
                            </h2>
                            {error && (
                                <div className="mt-2 flex items-center gap-3">
                                    <p className="text-sm text-red-600">{error}</p>
                                    <button onClick={openSettings} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold hover:bg-red-200">
                                        Update API Key
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 relative z-10 flex flex-col gap-6">
                         <div className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl transition-all ${
                            isRecording ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'
                         }`}>
                            {isRecording ? (
                                <div className="h-16 flex items-center justify-center gap-1 mb-6">
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className={`w-1 bg-red-500 rounded-full animate-pulse`} style={{height: `${Math.random() * 40 + 20}px`}}></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-16 flex items-center justify-center gap-1 mb-6">
                                    <div className="w-1 h-8 bg-primary/40 rounded-full"></div>
                                    <div className="w-1 h-12 bg-primary/60 rounded-full"></div>
                                    <div className="w-1 h-16 bg-primary shadow-lg rounded-full"></div>
                                    <div className="w-1 h-12 bg-primary/60 rounded-full"></div>
                                    <div className="w-1 h-8 bg-primary/40 rounded-full"></div>
                                </div>
                            )}
                            
                            <div className="text-center space-y-2">
                                <p className="text-lg font-medium text-gray-900">
                                  {isRecording ? "Listening..." : (audioUrl ? "Audio Recorded" : "Ready to answer")}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {isRecording ? "Speak clearly..." : (audioUrl ? "Click Submit to analyze" : "Click microphone to start")}
                                </p>
                            </div>

                            {audioUrl && !isRecording && (
                                <audio src={audioUrl} controls className="mt-4" />
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                             <div className="text-sm text-gray-400">
                                {isProcessing && <span className="flex items-center gap-2"><span className="animate-spin material-symbols-outlined">sync</span> Processing...</span>}
                             </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={!!error}
                                    className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors ${
                                        isRecording 
                                        ? 'border-red-500 text-red-500 bg-red-50 animate-pulse' 
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    } ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="material-symbols-outlined">{isRecording ? 'stop' : 'mic'}</span>
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!audioUrl || isRecording || isProcessing || !!error}
                                    className={`h-12 px-6 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5 ${
                                        !audioUrl || isRecording || isProcessing || !!error
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-primary hover:bg-primary-dark text-white shadow-primary/25'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Panel */}
            <div className="w-full lg:w-[400px] flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex-1">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">query_stats</span>
                        <h3 className="font-bold text-gray-900">Analysis Result</h3>
                    </div>
                    {feedbackData ? (
                        <div className="space-y-6 fade-in">
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-600">Overall Score</span>
                                    <span className={`text-xl font-bold ${feedbackData.score > 70 ? 'text-green-600' : 'text-orange-500'}`}>{feedbackData.score}/100</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-1000" style={{width: `${feedbackData.score}%`}}></div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs text-blue-800 font-bold uppercase mb-2">AI Feedback</p>
                                <p className="text-sm text-blue-900 leading-relaxed">{feedbackData.feedback}</p>
                            </div>

                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Transcript</p>
                                <p className="text-sm text-gray-600 italic">"{feedbackData.transcript}"</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <span className="material-symbols-outlined text-4xl mb-2">graphic_eq</span>
                            <p className="text-sm">Record and submit to see analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Interview;