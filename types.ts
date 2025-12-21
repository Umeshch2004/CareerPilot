
export interface Skill {
  name: string;
  category: 'Technical' | 'Tools' | 'Soft' | 'Domain' | 'System Design';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  verified?: boolean;
  source?: 'Resume' | 'Project' | 'Manual' | 'Task';
  confidence?: number; // 0-100
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | 'Present';
  description: string;
  skillsUsed: string[];
  impactMetrics?: string[]; // e.g., "Increased revenue by 20%"
  location?: string;
  type?: 'Full-time' | 'Contract' | 'Internship';
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiry?: string;
  credentialUrl?: string;
  logo?: string; // URL or icon name
}

export interface Project {
  id: string;
  name: string;
  type: 'Personal' | 'Academic' | 'Professional' | 'CareerPilot AI';
  description: string;
  techStack: string[];
  link?: string;
  image?: string; // Cover image for project
  aiQualityScore?: number; // 0-100
}

export interface UserPreferences {
  weeklyHours: number;
  learningStyle: 'Visual' | 'Reading' | 'Hands-on';
  remotePreference: 'Remote' | 'Hybrid' | 'On-site';
  targetLocations: string[];
  salaryRange?: string;
  availability?: 'Immediate' | '1-3 Months' | '3-6 Months';
  companySize?: 'Startup' | 'Scale-up' | 'Enterprise';
}

export interface Insight {
  type: 'Success' | 'Warning' | 'Info';
  message: string;
}

export interface UserProfile {
  id?: string; // Database ID
  // Identity
  name: string;
  role: string; // Current Title
  avatarUrl: string;
  bio: string;
  location: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  joinedDate: string;
  openToOpportunities: boolean;
  
  // Career Goal
  targetRole: string;
  targetIndustry?: string;
  targetCompanies?: string[];
  timelineGoal?: '3 Months' | '6 Months' | '1 Year';
  
  // Readiness
  readinessScore: number;
  level: string; // e.g., Senior, Mid-Level
  profileStrength: number; // 0-100 (Profile completeness)
  insights: Insight[];
  
  // Data
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  preferences: UserPreferences;
  
  // Meta
  resumeLastUpdated?: string;
  resumeFileName?: string;
}

export interface SkillGap {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  currentLevel: string;
  targetLevel: string;
  description: string;
}

export interface AnalysisResult {
  criticalGaps: SkillGap[];
  proficiencyAdjustments: { skill: string; status: string; percentage: number; color: string }[];
  emergingSkills: string[];
}

export interface RoadmapResource {
  title: string;
  url: string;
  type: 'Video' | 'Article' | 'Course' | 'Documentation';
}

export interface RoadmapItem {
  title: string;
  status: 'Completed' | 'In Progress' | 'Locked';
  subtitle?: string;
  progress?: number;
  resources?: RoadmapResource[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'Locked';
  duration: string;
  items: RoadmapItem[];
}

export interface Milestone {
  id: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  date?: string;
}

export interface InterviewSession {
  id: string;
  topic: string;
  date: string;
  score: number;
  status: 'Completed' | 'Pending';
  type: 'Behavioral' | 'Technical' | 'System Design';
}

export interface InterviewFeedback {
  score: number;
  feedback: string;
  transcript: string;
}

export interface Metric {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  type: 'Learning' | 'Practice' | 'Building' | 'Reading';
  duration: string;
  status: 'Todo' | 'In Progress' | 'Done';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}

export interface ProjectBlueprint {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  techStack: string[];
  userStories: string[];
  features: string[];
  learningOutcomes: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  salaryRange: string;
  missingSkills: string[];
  postedDate: string;
  type: 'Remote' | 'Hybrid' | 'On-site';
}
