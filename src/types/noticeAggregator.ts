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
  | 'General';

export type VerificationStatus = 'verified' | 'unverified' | 'pending';

export interface AggregatedNotice {
  id: string;
  title: string;
  publicationDate: string; // YYYY-MM-DD
  category: NoticeCategory;
  summary: string;
  originalUrl: string;
  sourceWebsite: string;
  sourceId: string;
  sourceUrl: string;
  firstDiscovered: string; // ISO datetime
  lastVerified: string;   // ISO datetime
  verificationStatus: VerificationStatus;
  pdfUrl?: string;
  contentHash: string;
  priority: 'urgent' | 'important' | 'standard';
  department: string;
  fileSize?: string;
  isOfficial: boolean;
}

export interface MonitoredSource {
  id: string;
  name: string;
  url: string;
  description: string;
  status: 'online' | 'degraded' | 'error' | 'pending';
  lastChecked?: string;
  lastSuccess?: string;
  noticeCount: number;
  errorMessage?: string;
  httpStatus?: number;
}

export interface SyncLogEntry {
  timestamp: string;
  trigger: 'scheduled' | 'manual' | 'startup';
  durationMs: number;
  totalNoticesFound: number;
  newNoticesCount: number;
  updatedNoticesCount: number;
  sourcesStatus: Record<string, { status: string; count: number; error?: string }>;
}

export interface NoticeDatabaseSchema {
  version: number;
  lastGlobalSync: string | null;
  schedulerConfig: {
    intervalMinutes: number;
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
  };
  sources: MonitoredSource[];
  notices: AggregatedNotice[];
  syncHistory: SyncLogEntry[];
}
