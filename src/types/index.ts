export type NoticeCategory = 
  | 'Examinations'
  | 'Results'
  | 'Timetables'
  | 'Admissions'
  | 'Academic Notices'
  | 'Events'
  | 'Research'
  | 'Scholarships'
  | 'Placements'
  | 'General'
  | 'Exam Schedules' 
  | 'Events & Hackathons' 
  | 'Deadlines' 
  | 'Academic Policies' 
  | 'Campus Facilities';

export interface KnowledgeItem {
  id: string;
  title: string;
  date: string;
  category: NoticeCategory;
  department: string;
  priority: 'urgent' | 'important' | 'standard';
  location?: string;
  summary: string;
  content: string;
  tags: string[];
  isDemonstration: boolean;
  originalUrl?: string;
  sourceWebsite?: string;
  sourceUrl?: string;
  sourceId?: string;
  firstDiscovered?: string;
  lastVerified?: string;
  pdfUrl?: string;
  contentHash?: string;
  fileSize?: string;
  isOfficial?: boolean;
  verificationStatus?: 'verified' | 'unverified' | 'pending';
}

export interface CollegeNotice {
  id: string;
  title: string;
  date: string;
  category: NoticeCategory;
  description: string;
  fullDetails?: string;
  department: string;
  priority: 'urgent' | 'important' | 'standard';
  location?: string;
  documentRefId?: string;
  isDemonstration?: boolean;
  originalUrl?: string;
  sourceWebsite?: string;
  sourceUrl?: string;
  sourceId?: string;
  firstDiscovered?: string;
  lastVerified?: string;
  verificationStatus?: 'verified' | 'unverified' | 'pending';
  pdfUrl?: string;
  contentHash?: string;
  fileSize?: string;
  isOfficial?: boolean;
}

export interface CollegeDocument {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  department: string;
  content: string;
  tags: string[];
  isDemonstration?: boolean;
  originalUrl?: string;
  pdfUrl?: string;
}

export type QuestionCategory = 'academic' | 'programming' | 'general' | 'sathyabama' | 'time_sensitive';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sourceDocTitle?: string;
  sourceDocId?: string;
  found: boolean;
  engineUsed: string;
  confidenceScore?: number;
  category?: QuestionCategory;
  canRetry?: boolean;
  failedQuery?: string;
  isError?: boolean;
}

export interface StudyQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface StudyResult {
  action: 'summarize' | 'extract_points' | 'quiz';
  summary?: string;
  keyPoints?: string[];
  questions?: StudyQuestion[];
  rawText?: string;
  engineUsed: string;
  notice?: string;
}

export interface SystemStatus {
  hasGeminiKey: boolean;
  engine: string;
  serverOnline: boolean;
  modelName: string;
  knowledgeItemsCount?: number;
}
