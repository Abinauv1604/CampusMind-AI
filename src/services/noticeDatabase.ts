import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  AggregatedNotice, 
  MonitoredSource, 
  NoticeDatabaseSchema, 
  SyncLogEntry,
  NoticeCategory 
} from '../types/noticeAggregator.ts';
import { OFFICIAL_SOURCES } from './noticeScraper.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.resolve(__dirname, '../../data/notices_db.json');

export class NoticeDatabase {
  private db: NoticeDatabaseSchema;
  private isSaving = false;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): NoticeDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.notices)) {
          // Reconcile sources so newly added official sources are immediately tracked
          const existingSourceIds = new Set(parsed.sources?.map((s: MonitoredSource) => s.id) || []);
          if (!parsed.sources) parsed.sources = [];
          for (const s of OFFICIAL_SOURCES) {
            if (!existingSourceIds.has(s.id)) {
              parsed.sources.push({
                ...s,
                status: 'pending',
                noticeCount: parsed.notices.filter((n: AggregatedNotice) => n.sourceId === s.id).length
              });
            } else {
              const existing = parsed.sources.find((item: MonitoredSource) => item.id === s.id);
              if (existing) {
                existing.name = s.name;
                existing.url = s.url;
                existing.description = s.description;
              }
            }
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('[NoticeDatabase] Error reading database file, initializing fresh store:', err);
    }

    const initialSources: MonitoredSource[] = OFFICIAL_SOURCES.map((s) => ({
      ...s,
      status: 'pending',
      noticeCount: 0
    }));

    const initialDb: NoticeDatabaseSchema = {
      version: 1,
      lastGlobalSync: null,
      schedulerConfig: {
        intervalMinutes: 60,
        enabled: true
      },
      sources: initialSources,
      notices: [],
      syncHistory: []
    };

    this.persist(initialDb);
    return initialDb;
  }

  private persist(data: NoticeDatabaseSchema): void {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (err) {
      console.error('[NoticeDatabase] Failed to persist database:', err);
    } finally {
      this.isSaving = false;
    }
  }

  public getDatabase(): NoticeDatabaseSchema {
    return this.db;
  }

  public getNotices(filter?: {
    search?: string;
    category?: string;
    priority?: string;
    sourceId?: string;
    sortBy?: 'newest' | 'oldest' | 'verified' | 'priority';
  }): AggregatedNotice[] {
    let result = [...this.db.notices];

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter((n) => 
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        n.publicationDate.includes(q)
      );
    }

    if (filter?.category && filter.category !== 'All') {
      result = result.filter((n) => n.category.toLowerCase() === filter.category!.toLowerCase());
    }

    if (filter?.priority && filter.priority !== 'all') {
      result = result.filter((n) => n.priority === filter.priority);
    }

    if (filter?.sourceId && filter.sourceId !== 'all') {
      result = result.filter((n) => n.sourceId === filter.sourceId);
    }

    const sortBy = filter?.sortBy || 'newest';
    if (sortBy === 'newest') {
      result.sort((a, b) => b.publicationDate.localeCompare(a.publicationDate) || b.lastVerified.localeCompare(a.lastVerified));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.publicationDate.localeCompare(b.publicationDate));
    } else if (sortBy === 'verified') {
      result.sort((a, b) => b.lastVerified.localeCompare(a.lastVerified));
    } else if (sortBy === 'priority') {
      const score = (p: string) => (p === 'urgent' ? 3 : p === 'important' ? 2 : 1);
      result.sort((a, b) => score(b.priority) - score(a.priority) || b.publicationDate.localeCompare(a.publicationDate));
    }

    return result;
  }

  public getSources(): MonitoredSource[] {
    return this.db.sources;
  }

  public getSyncHistory(): SyncLogEntry[] {
    return this.db.syncHistory.slice(0, 30);
  }

  public getStats() {
    const total = this.db.notices.length;
    const categoryCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};

    for (const n of this.db.notices) {
      categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
      sourceCounts[n.sourceId] = (sourceCounts[n.sourceId] || 0) + 1;
    }

    const onlineSources = this.db.sources.filter((s) => s.status === 'online').length;

    return {
      totalNotices: total,
      onlineSources,
      totalSources: this.db.sources.length,
      lastGlobalSync: this.db.lastGlobalSync,
      schedulerConfig: this.db.schedulerConfig,
      categoryCounts,
      sourceCounts
    };
  }

  /**
   * Upserts newly scraped notices, handles deduplication, and preserves existing items even on source failure.
   */
  public upsertNotices(
    newItems: AggregatedNotice[],
    sourcesStatus: Record<string, { status: 'online' | 'error'; count: number; error?: string; httpStatus?: number }>,
    trigger: 'scheduled' | 'manual' | 'startup',
    durationMs: number
  ): { added: number; updated: number; total: number } {
    const existingMap = new Map<string, AggregatedNotice>();

    // Key by contentHash OR canonicalUrl
    for (const notice of this.db.notices) {
      existingMap.set(notice.contentHash, notice);
      existingMap.set(notice.originalUrl, notice);
    }

    let addedCount = 0;
    let updatedCount = 0;
    const nowIso = new Date().toISOString();

    for (const incoming of newItems) {
      const match = existingMap.get(incoming.contentHash) || existingMap.get(incoming.originalUrl);

      if (match) {
        // Update existing record
        match.title = incoming.title;
        match.summary = incoming.summary;
        match.category = incoming.category;
        match.publicationDate = incoming.publicationDate || match.publicationDate;
        match.lastVerified = nowIso;
        match.verificationStatus = 'verified';
        match.department = incoming.department;
        if (incoming.pdfUrl) match.pdfUrl = incoming.pdfUrl;
        if (incoming.fileSize) match.fileSize = incoming.fileSize;
        match.priority = incoming.priority;
        updatedCount++;
      } else {
        // New record
        incoming.firstDiscovered = nowIso;
        incoming.lastVerified = nowIso;
        incoming.verificationStatus = 'verified';
        this.db.notices.push(incoming);
        existingMap.set(incoming.contentHash, incoming);
        existingMap.set(incoming.originalUrl, incoming);
        addedCount++;
      }
    }

    // Update source statuses
    for (const src of this.db.sources) {
      const stat = sourcesStatus[src.id];
      src.lastChecked = nowIso;

      if (stat) {
        if (stat.status === 'online') {
          src.status = 'online';
          src.lastSuccess = nowIso;
          src.noticeCount = this.db.notices.filter((n) => n.sourceId === src.id).length;
          src.errorMessage = undefined;
          src.httpStatus = stat.httpStatus || 200;
        } else {
          src.status = src.lastSuccess ? 'degraded' : 'error';
          src.errorMessage = stat.error || 'Failed to sync source';
          src.httpStatus = stat.httpStatus || 500;
          // Keep the existing notice count! Never erase!
          src.noticeCount = this.db.notices.filter((n) => n.sourceId === src.id).length;
        }
      }
    }

    this.db.lastGlobalSync = nowIso;

    // Log sync history
    const logEntry: SyncLogEntry = {
      timestamp: nowIso,
      trigger,
      durationMs,
      totalNoticesFound: newItems.length,
      newNoticesCount: addedCount,
      updatedNoticesCount: updatedCount,
      sourcesStatus: Object.fromEntries(
        Object.entries(sourcesStatus).map(([k, v]) => [k, { status: v.status, count: v.count, error: v.error }])
      )
    };

    this.db.syncHistory.unshift(logEntry);
    if (this.db.syncHistory.length > 50) {
      this.db.syncHistory = this.db.syncHistory.slice(0, 50);
    }

    this.persist(this.db);

    return {
      added: addedCount,
      updated: updatedCount,
      total: this.db.notices.length
    };
  }

  public updateSchedulerConfig(intervalMinutes: number, enabled: boolean): void {
    this.db.schedulerConfig.intervalMinutes = Math.max(5, intervalMinutes);
    this.db.schedulerConfig.enabled = enabled;
    this.persist(this.db);
  }
}

export const noticeDatabase = new NoticeDatabase();
