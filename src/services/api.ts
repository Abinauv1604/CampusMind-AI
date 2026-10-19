import { CollegeDocument, CollegeNotice, KnowledgeItem, StudyResult, SystemStatus, QuestionCategory } from '../types';
import { AggregatedNotice, MonitoredSource } from '../types/noticeAggregator';
import { NoticeBreakdown } from '../types/noticeActions';
import { searchCollegeDocuments } from '../utils/localRag';
import { summarizeNotesLocal, extractKeyPointsLocal, generateQuizQuestionsLocal } from '../utils/studyParser';
import { generateLocalBreakdown } from '../utils/noticeActionParser';
import { SAMPLE_DOCUMENTS, loadStoredKnowledgeBase, knowledgeItemToDocument } from '../data/sampleData';

export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      const data = await res.json();
      return {
        hasGeminiKey: Boolean(data.hasGeminiKey),
        engine: data.engine || 'local-extractive',
        serverOnline: true,
        modelName: data.modelName || 'Local Extractive Engine'
      };
    }
  } catch (err) {
    // server might be booting or static
  }
  return {
    hasGeminiKey: false,
    engine: 'local-extractive',
    serverOnline: false,
    modelName: 'Local RAG Extractive Engine (Client Active)'
  };
}

export async function fetchKnowledgeBase(): Promise<KnowledgeItem[]> {
  try {
    const res = await fetch('/api/knowledge-base');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch (err) {
    console.warn('Could not fetch knowledge base from server, using local storage cache:', err);
  }
  return loadStoredKnowledgeBase();
}

export async function saveKnowledgeBaseItem(item: KnowledgeItem): Promise<boolean> {
  try {
    const res = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not sync knowledge item with server:', err);
    return false;
  }
}

export interface NoticeApiResponse {
  ok: boolean;
  notices: AggregatedNotice[];
  total: number;
  allCount: number;
  sources: MonitoredSource[];
  lastGlobalSync: string | null;
  isSyncing: boolean;
  schedulerConfig?: {
    intervalMinutes: number;
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
  };
}

export async function fetchAggregatedNotices(filter?: {
  search?: string;
  category?: string;
  priority?: string;
  sourceId?: string;
  sortBy?: string;
}): Promise<NoticeApiResponse> {
  try {
    const params = new URLSearchParams();
    if (filter?.search) params.set('search', filter.search);
    if (filter?.category && filter.category !== 'All') params.set('category', filter.category);
    if (filter?.priority && filter.priority !== 'all') params.set('priority', filter.priority);
    if (filter?.sourceId && filter.sourceId !== 'all') params.set('sourceId', filter.sourceId);
    if (filter?.sortBy) params.set('sortBy', filter.sortBy);

    const qs = params.toString();
    const res = await fetch(`/api/notices${qs ? `?${qs}` : ''}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch aggregated notices from server:', err);
  }

  return {
    ok: false,
    notices: [],
    total: 0,
    allCount: 0,
    sources: [],
    lastGlobalSync: null,
    isSyncing: false
  };
}

export async function fetchMonitoredSources(): Promise<{
  sources: MonitoredSource[];
  lastGlobalSync: string | null;
  isSyncing: boolean;
  stats?: any;
}> {
  try {
    const res = await fetch('/api/notices/sources');
    if (res.ok) {
      const data = await res.json();
      return {
        sources: data.sources || [],
        lastGlobalSync: data.lastGlobalSync || null,
        isSyncing: Boolean(data.isSyncing),
        stats: data.stats
      };
    }
  } catch (err) {
    console.warn('Could not fetch monitored sources:', err);
  }
  return { sources: [], lastGlobalSync: null, isSyncing: false };
}

export async function triggerNoticeSync(adminToken?: string): Promise<{
  ok: boolean;
  added?: number;
  updated?: number;
  total?: number;
  durationMs?: number;
  lastGlobalSync?: string;
  error?: string;
  status?: number;
}> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
    const res = await fetch('/api/notices/sync', {
      method: 'POST',
      headers
    });
    const data = await res.json();
    return { ...data, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Sync request failed', status: 500 };
  }
}

export async function fetchNoticeBreakdown(notice: CollegeNotice): Promise<{
  ok: boolean;
  breakdown: NoticeBreakdown;
  engineUsed: string;
}> {
  try {
    const res = await fetch('/api/notices/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend notice breakdown failed, falling back to local extractor:', err);
  }

  return {
    ok: true,
    breakdown: generateLocalBreakdown(notice),
    engineUsed: 'local-grounded'
  };
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export async function askCampusChat(
  question: string,
  documents: CollegeDocument[] = SAMPLE_DOCUMENTS,
  history: ChatHistoryItem[] = []
): Promise<{
  found: boolean;
  answer: string;
  sourceDocTitle?: string;
  sourceDocId?: string;
  engineUsed: string;
  confidenceScore?: number;
  note?: string;
  category?: QuestionCategory;
}> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, documents, history })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        found: Boolean(data.found),
        answer: data.answer,
        sourceDocTitle: data.sourceDocTitle,
        sourceDocId: data.sourceDocId,
        engineUsed: data.engineUsed || 'local-extractive',
        confidenceScore: data.confidenceScore,
        note: data.note,
        category: data.category
      };
    }

    // Server returned an explicit error response (such as 429 quota or 503)
    const errData = await res.json().catch(() => ({}));
    if (errData.error) {
      const errorObj = new Error(errData.error);
      (errorObj as any).isQuotaError = Boolean(errData.isQuotaError);
      (errorObj as any).canRetry = errData.canRetry !== false;
      throw errorObj;
    }
  } catch (err: any) {
    // If it's already an explicit API error with message, rethrow it so the UI shows retry
    if (err?.message && (err.message.includes('quota') || err.message.includes('rate-limited') || err.message.includes('service temporarily') || err.isQuotaError)) {
      throw err;
    }
    console.warn('Server chat call error or network failure, falling back to local client RAG:', err);
  }

  // Graceful client fallback for offline campus notice queries
  const localRes = searchCollegeDocuments(question, documents);
  return {
    found: localRes.found,
    answer: localRes.answer,
    sourceDocTitle: localRes.sourceDocTitle,
    sourceDocId: localRes.sourceDocId,
    engineUsed: 'local-extractive',
    confidenceScore: localRes.confidenceScore,
    note: 'Response verified from local institutional knowledge base'
  };
}

export async function processStudyNotes(
  text: string,
  action: 'summarize' | 'extract_points' | 'quiz'
): Promise<StudyResult> {
  try {
    const res = await fetch('/api/study-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, action })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        action,
        summary: data.summary,
        keyPoints: data.keyPoints,
        questions: data.questions,
        engineUsed: data.engineUsed || 'local-extractive',
        notice: data.notice
      };
    } else {
      const errData = await res.json().catch(() => ({ error: 'Request failed with status ' + res.status }));
      throw new Error(errData.error || 'Failed to analyze notes on server.');
    }
  } catch (err: any) {
    console.warn('Backend query error in study parser, falling back to local extractor:', err);
    // If it's a validation error (like empty notes), rethrow
    if (err.message && err.message.includes('required')) {
      throw err;
    }
  }

  // Client-side fallback
  if (action === 'summarize') {
    return summarizeNotesLocal(text);
  } else if (action === 'extract_points') {
    return extractKeyPointsLocal(text);
  } else {
    return generateQuizQuestionsLocal(text);
  }
}
