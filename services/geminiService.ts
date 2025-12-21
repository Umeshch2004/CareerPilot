import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, RoadmapPhase, InterviewFeedback, Task, ProjectBlueprint, Job, UserProfile } from "../types";

// Helper to get the AI client with the most current key
const getGenAI = () => {
  const customKey = localStorage.getItem('gemini_api_key');
  const apiKey = customKey || process.env.API_KEY || '';
  if (!apiKey) {
      throw new Error("API Key is missing. Please configure it in Settings.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- SYSTEM HEALTH ---

export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const ai = getGenAI();
        // Lightweight check to see if API key is valid and has quota
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'ping',
        });
        return true;
    } catch (e) {
        return false;
    }
};

// --- INTERVIEW SERVICES ---

export const generateInterviewQuestion = async (role: string, topic: string): Promise<string> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a single challenging interview question for a candidate applying for the role of ${role}, specifically focusing on ${topic}. Keep it concise, under 30 words.`,
    });
    return response.text || "Could not generate question.";
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to generate interview question via AI.");
  }
};

export const evaluateAudioAnswer = async (question: string, audioBase64: string, mimeType: string): Promise<InterviewFeedback> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: `Please transcribe the audio answer and then evaluate it against the interview question: "${question}". 
            Return a JSON object with:
            - score (number 0-100)
            - feedback (string, max 2 sentences)
            - transcript (string, the transcription of the audio)`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            transcript: { type: Type.STRING }
          },
          required: ["score", "feedback", "transcript"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to evaluate answer via AI.");
  }
};

// --- ANALYSIS SERVICES ---

export const generateGapAnalysis = async (currentRole: string, targetRole: string): Promise<AnalysisResult> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a skill gap analysis for a ${currentRole} aiming to become a ${targetRole}.
      Return a JSON object containing:
      1. criticalGaps: Array of 3 objects { id, name, priority (High/Medium/Low), currentLevel, targetLevel, description }
      2. proficiencyAdjustments: Array of 2 objects { skill, status (e.g. "Exceeds (+10%)"), percentage (number), color (hex code) }
      3. emergingSkills: Array of 3 strings representing future skills.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            criticalGaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  currentLevel: { type: Type.STRING },
                  targetLevel: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "name", "priority", "currentLevel", "targetLevel", "description"]
              }
            },
            proficiencyAdjustments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  status: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  color: { type: Type.STRING }
                }
              }
            },
            emergingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to generate gap analysis via AI.");
  }
};

export const generateRoadmap = async (currentRole: string, targetRole: string): Promise<RoadmapPhase[]> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a comprehensive 4-phase learning roadmap to go from ${currentRole} to ${targetRole}.
      
      Structure:
      1. Foundation (Completed)
      2. Core Tech (In Progress)
      3. Advanced Concepts (Locked)
      4. Capstone & Mastery (Locked)

      For EACH item in the roadmap, you MUST provide 2-3 **specific, real-world learning resources**. 
      - These should be direct links to high-quality YouTube tutorials, Medium/Dev.to articles, or Official Documentation.
      - If you cannot find a specific URL, provide a highly specific search query as the URL (e.g., "https://www.youtube.com/results?search_query=advanced+react+patterns").
      - Prioritize free, high-quality content.

      Return JSON: Array of 4 phases.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["Completed", "In Progress", "Locked"] },
              duration: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    status: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    progress: { type: Type.NUMBER },
                    resources: {
                      type: Type.ARRAY,
                      items: {
                         type: Type.OBJECT,
                         properties: {
                             title: { type: Type.STRING },
                             url: { type: Type.STRING },
                             type: { type: Type.STRING, enum: ['Video', 'Article', 'Course', 'Documentation'] }
                         }
                      }
                    }
                  },
                  required: ["title", "status", "resources"]
                }
              }
            },
            required: ["id", "title", "status", "duration", "items"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]") as RoadmapPhase[];
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to generate roadmap via AI.");
  }
};

// --- NEW FEATURES SERVICES ---

export const analyzeResume = async (fileData: { data: string, mimeType: string }): Promise<Partial<UserProfile>> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // High reasoning model for reading PDFs
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: fileData.mimeType,
                            data: fileData.data
                        }
                    },
                    {
                        text: `You are an expert HR Data Extraction AI. 
                        Analyze the attached resume document and extract a comprehensive Structured Career Profile.
                        
                        CRITICAL EXTRACTION RULES:
                        1. Extract EVERY single work experience entry found. Do not skip early roles.
                        2. For each role, summarize the key achievements into the 'description'.
                        3. Extract ALL technical and soft skills mentioned. 
                        4. Infer the candidate's current 'role' from the latest job title.
                        5. If 'bio' is missing, generate a professional summary based on the experience.
                        6. Extract location (City, Country) and contact info (email, linkedin).
                        
                        Return a JSON object matching the schema provided.`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        bio: { type: Type.STRING },
                        location: { type: Type.STRING },
                        email: { type: Type.STRING },
                        linkedinUrl: { type: Type.STRING },
                        skills: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    category: { type: Type.STRING, enum: ['Technical', 'Tools', 'Soft', 'Domain', 'System Design'] },
                                    level: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] }
                                },
                                required: ["name", "category", "level"]
                            }
                        },
                        experience: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    company: { type: Type.STRING },
                                    role: { type: Type.STRING },
                                    startDate: { type: Type.STRING },
                                    endDate: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    location: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ['Full-time', 'Contract', 'Internship'] },
                                    skillsUsed: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["company", "role", "startDate", "description"]
                            }
                        },
                        education: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    institution: { type: Type.STRING },
                                    degree: { type: Type.STRING },
                                    year: { type: Type.STRING }
                                },
                                required: ["institution", "degree", "year"]
                            }
                        },
                        certifications: {
                             type: Type.ARRAY,
                             items: {
                                 type: Type.OBJECT,
                                 properties: {
                                     name: { type: Type.STRING },
                                     issuer: { type: Type.STRING },
                                     date: { type: Type.STRING }
                                 },
                                 required: ["name"]
                             }
                        },
                        projects: {
                             type: Type.ARRAY,
                             items: {
                                 type: Type.OBJECT,
                                 properties: {
                                     name: { type: Type.STRING },
                                     description: { type: Type.STRING },
                                     techStack: { type: Type.ARRAY, items: { type: Type.STRING } }
                                 },
                                 required: ["name"]
                             }
                        }
                    },
                    required: ["name", "role", "skills", "experience"]
                }
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        const profile = JSON.parse(text);
        
        // Post-processing to match app types and add IDs
        const timestamp = Date.now();
        
        if (profile.skills) {
            profile.skills = profile.skills.map((s: any) => ({
                ...s,
                verified: true,
                source: 'Resume',
                confidence: 90
            }));
        }
        
        if (profile.experience) {
            profile.experience = profile.experience.map((e: any, i: number) => ({
                ...e,
                id: `exp_${timestamp}_${i}`,
                skillsUsed: e.skillsUsed || []
            }));
        }

        if (profile.education) {
             profile.education = profile.education.map((e: any, i: number) => ({
                ...e,
                id: `edu_${timestamp}_${i}`
            }));
        }

        if (profile.certifications) {
            profile.certifications = profile.certifications.map((c: any, i: number) => ({
                ...c,
                id: `cert_${timestamp}_${i}`
            }));
        }

         if (profile.projects) {
            profile.projects = profile.projects.map((p: any, i: number) => ({
                ...p,
                id: `proj_${timestamp}_${i}`,
                type: 'Professional',
                techStack: p.techStack || []
            }));
        }

        profile.resumeLastUpdated = new Date().toLocaleDateString();
        
        return profile;

    } catch (e) {
        console.error("AI Error:", e);
        throw new Error("Failed to analyze resume via AI.");
    }
};

export const generateWeeklyTasks = async (currentRole: string, targetRole: string, focusArea: string): Promise<Task[]> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 structured weekly tasks for a professional currently in the role of "${currentRole}" aiming to become a "${targetRole}".
            
            Crucial: The tasks must specifically focus on: "${focusArea}" to bridge the gap between their current and target role.
            
            Mix types: Learning, Practice, Building.
            Return JSON array of tasks.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['Learning', 'Practice', 'Building', 'Reading'] },
                            duration: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ['Todo'] },
                            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                            description: { type: Type.STRING }
                        },
                        required: ["id", "title", "type", "duration", "difficulty", "description"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("AI Error:", e);
        throw new Error("Failed to generate tasks via AI.");
    }
};

export const generateProjectIdea = async (targetRole: string, skills: string[], level: string): Promise<ProjectBlueprint> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a detailed software project blueprint specifically designed for the portfolio of an aspiring ${targetRole}.
            
            The project should:
            1. Demonstrate skills relevant to a ${targetRole}.
            2. Utilize their existing skills: ${skills.join(', ')}.
            3. Be appropriate for a ${level} level developer.
            4. Be portfolio-worthy and solve a real-world problem.
            
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                        techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                        userStories: { type: Type.ARRAY, items: { type: Type.STRING } },
                        features: { type: Type.ARRAY, items: { type: Type.STRING } },
                        learningOutcomes: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "description", "techStack", "userStories"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("AI Error:", e);
        throw new Error("Failed to generate project idea via AI.");
    }
};

export const scanJobMarket = async (role: string, location: string): Promise<Job[]> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Simulate a real-time job market scan for the role of ${role} in ${location}. 
            Generate 4 realistic job listings that would be relevant to someone targeting this role.
            Include a "matchScore" based on typical requirements for this role.
            Return JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            company: { type: Type.STRING },
                            location: { type: Type.STRING },
                            matchScore: { type: Type.NUMBER },
                            salaryRange: { type: Type.STRING },
                            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            postedDate: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['Remote', 'Hybrid', 'On-site'] }
                        },
                        required: ["title", "company", "matchScore", "missingSkills"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("AI Error:", e);
        throw new Error("Failed to scan job market via AI.");
    }
};