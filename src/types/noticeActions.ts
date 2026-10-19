export interface NoticeBreakdown {
  announcement: string;
  targetAudience: string;
  actionRequired: string;
  explicitDeadline: string | null;
  missingOrUncertainDetails: string[];
  checklistItems: string[];
  eventDates: Array<{
    title: string;
    date: string | null;
    time?: string | null;
    isExplicit: boolean;
    notes?: string;
  }>;
  sourceUrl: string;
  sourceWebsite?: string;
  pdfUrl?: string;
  verificationStatus: string;
}

export interface NoticeChecklistProgress {
  noticeId: string;
  items: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  lastUpdated: string;
}

export interface CalendarEventConfig {
  title: string;
  description: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endDate?: string;   // YYYY-MM-DD
  endTime?: string;   // HH:MM
  isAllDay: boolean;
  url?: string;
}
