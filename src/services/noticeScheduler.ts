import { collectAllOfficialNotices } from './noticeScraper.ts';
import { noticeDatabase } from './noticeDatabase.ts';
import { AggregatedNotice } from '../types/noticeAggregator.ts';

export type OnSyncCompleteCallback = (notices: AggregatedNotice[]) => void;

export class NoticeScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastManualSyncTime = 0;
  private callbacks: OnSyncCompleteCallback[] = [];

  constructor() {
    // Will be initialized when start() is called
  }

  public onSyncComplete(cb: OnSyncCompleteCallback) {
    this.callbacks.push(cb);
  }

  public async start(): Promise<void> {
    const config = noticeDatabase.getDatabase().schedulerConfig;
    const intervalMs = (Number(process.env.SYNC_INTERVAL_MINUTES) || config.intervalMinutes || 60) * 60 * 1000;

    console.log(`[Notice Scheduler] Starting automatic aggregator with interval: ${intervalMs / (60 * 1000)} minutes.`);

    // Check if initial sync is needed (database empty, missing lastGlobalSync, or pending new sources)
    const db = noticeDatabase.getDatabase();
    const hasPendingSources = db.sources.some((s) => s.status === 'pending');
    if (db.notices.length === 0 || !db.lastGlobalSync || hasPendingSources) {
      console.log(`[Notice Scheduler] Triggering initial startup sync (empty: ${db.notices.length === 0}, pendingSources: ${hasPendingSources})...`);
      await this.syncNow('startup').catch((err) => {
        console.warn('[Notice Scheduler] Initial startup sync encountered error:', err);
      });
    }

    this.scheduleNext(intervalMs);
  }

  private scheduleNext(intervalMs: number) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const nextRunDate = new Date(Date.now() + intervalMs).toISOString();
    noticeDatabase.getDatabase().schedulerConfig.nextRun = nextRunDate;

    this.timer = setTimeout(async () => {
      console.log('[Notice Scheduler] Triggering scheduled automatic notice check...');
      try {
        await this.syncNow('scheduled');
      } catch (err) {
        console.error('[Notice Scheduler] Scheduled sync error:', err);
      } finally {
        this.scheduleNext(intervalMs);
      }
    }, intervalMs);
  }

  public async syncNow(trigger: 'manual' | 'scheduled' | 'startup' = 'manual'): Promise<{
    success: boolean;
    added: number;
    updated: number;
    total: number;
    durationMs: number;
    error?: string;
  }> {
    if (this.isSyncing) {
      return {
        success: false,
        added: 0,
        updated: 0,
        total: noticeDatabase.getDatabase().notices.length,
        durationMs: 0,
        error: 'A synchronization operation is already in progress.'
      };
    }

    // Rate-limit manual requests to prevent server abuse (minimum 10s between manual runs)
    const now = Date.now();
    if (trigger === 'manual' && now - this.lastManualSyncTime < 10000) {
      const waitSec = Math.ceil((10000 - (now - this.lastManualSyncTime)) / 1000);
      return {
        success: false,
        added: 0,
        updated: 0,
        total: noticeDatabase.getDatabase().notices.length,
        durationMs: 0,
        error: `Please wait ${waitSec}s before triggering another manual sync.`
      };
    }

    this.isSyncing = true;
    if (trigger === 'manual') this.lastManualSyncTime = now;
    const startTime = Date.now();

    try {
      console.log(`[Notice Scheduler] Running sync (trigger: ${trigger})...`);
      const { notices, sourcesStatus } = await collectAllOfficialNotices();
      const durationMs = Date.now() - startTime;

      const result = noticeDatabase.upsertNotices(notices, sourcesStatus, trigger, durationMs);
      noticeDatabase.getDatabase().schedulerConfig.lastRun = new Date().toISOString();

      console.log(`[Notice Scheduler] Sync completed in ${durationMs}ms: +${result.added} new, ${result.updated} updated, total ${result.total}.`);

      // Notify listeners (e.g. Chatbot knowledge base updater)
      for (const cb of this.callbacks) {
        try {
          cb(noticeDatabase.getNotices());
        } catch (cbErr) {
          console.warn('[Notice Scheduler] Callback execution error:', cbErr);
        }
      }

      return {
        success: true,
        added: result.added,
        updated: result.updated,
        total: result.total,
        durationMs
      };
    } catch (err: any) {
      console.error('[Notice Scheduler] Fatal sync error:', err);
      return {
        success: false,
        added: 0,
        updated: 0,
        total: noticeDatabase.getDatabase().notices.length,
        durationMs: Date.now() - startTime,
        error: err?.message || 'Sync failed due to an unexpected error'
      };
    } finally {
      this.isSyncing = false;
    }
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const noticeScheduler = new NoticeScheduler();
