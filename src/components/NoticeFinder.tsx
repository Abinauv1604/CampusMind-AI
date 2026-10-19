import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Calendar, 
  Filter, 
  Bookmark, 
  BookmarkCheck, 
  Plus, 
  X, 
  ArrowRight, 
  FileText, 
  Building2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Globe,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  CheckSquare,
  ArrowUpDown,
  Key
} from 'lucide-react';
import { CollegeNotice, NoticeCategory } from '../types';
import { MonitoredSource } from '../types/noticeAggregator';
import { fetchMonitoredSources, triggerNoticeSync } from '../services/api';
import { NoticeActionModal } from './NoticeActionModal';

export const MONITORED_SOURCES_CONFIG = [
  {
    id: 'sathyabama_home',
    shortName: 'Home & News',
    fullName: 'Sathyabama Official Portal (Home & News)',
    url: 'https://www.sathyabama.ac.in/',
    badge: 'Portal'
  },
  {
    id: 'sathyabama_research',
    shortName: 'Research Circulars',
    fullName: 'Sathyabama Research Announcements',
    url: 'https://www.sathyabama.ac.in/research/announcements',
    badge: 'Ph.D'
  },
  {
    id: 'sathyabama_timetable',
    shortName: 'Exam Timetables',
    fullName: 'Sathyabama Examination Timetables',
    url: 'https://www.sathyabama.ac.in/academics/time_table',
    badge: 'COE'
  },
  {
    id: 'sathyabama_curriculum',
    shortName: 'Curriculum & Syllabi',
    fullName: 'Sathyabama Curriculum & Academic Regulations',
    url: 'https://www.sathyabama.ac.in/academics/curriculum-syllabus',
    badge: 'Academic'
  },
  {
    id: 'sist_notification',
    shortName: 'SIST Server Directory',
    fullName: 'SIST Official Notification Directory',
    url: 'https://sist.sathyabama.ac.in/website/Notification/',
    badge: 'Direct'
  },
  {
    id: 'sathyabama_examinations',
    shortName: 'Exam Regulations',
    fullName: 'Sathyabama Academic Regulations & Examinations',
    url: 'https://www.sathyabama.ac.in/academics/examinations',
    badge: 'Exam Rules'
  },
  {
    id: 'sathyabama_academic_calendar',
    shortName: 'Academic Calendar',
    fullName: 'Sathyabama Student Academic Calendar',
    url: 'https://www.sathyabama.ac.in/student/academic-calendar',
    badge: 'Calendar'
  }
];

interface NoticeFinderProps {
  notices: CollegeNotice[];
  onAddNotice: (notice: CollegeNotice) => void;
  onAskAboutNotice: (notice: CollegeNotice) => void;
  onViewNoticeDetails: (notice: CollegeNotice) => void;
  onRefreshData?: () => Promise<void>;
}

const BOOKMARKS_STORAGE_KEY = 'campusmind_bookmarked_notice_ids_v2';

function loadStoredBookmarks(): Set<string> {
  if (typeof window === 'undefined') return new Set(['kb-001']);
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY) || localStorage.getItem('campusmind_bookmarked_notice_ids_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((id) => typeof id === 'string' && id.trim().length > 0));
      }
    }
  } catch (err) {
    console.warn('Failed to load bookmarks from localStorage:', err);
  }
  return new Set(['kb-001']);
}

export const NoticeFinder: React.FC<NoticeFinderProps> = ({
  notices,
  onAddNotice,
  onAskAboutNotice,
  onViewNoticeDetails,
  onRefreshData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'important' | 'standard'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'verified' | 'priority'>('newest');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => loadStoredBookmarks());
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Notice-to-Action AI modal state
  const [actionModalNotice, setActionModalNotice] = useState<CollegeNotice | null>(null);
  const [actionModalTab, setActionModalTab] = useState<'breakdown' | 'checklist' | 'calendar'>('breakdown');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [sources, setSources] = useState<MonitoredSource[]>([]);
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null);

  // New notice form state (for demo additions)
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<NoticeCategory>('Events');
  const [newDepartment, setNewDepartment] = useState('Computer Science Dept');
  const [newPriority, setNewPriority] = useState<'urgent' | 'important' | 'standard'>('important');
  const [newDate, setNewDate] = useState('2026-10-18');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('Campus Innovation Lab');

  // Load sources status on mount
  const loadSourceStatus = async () => {
    try {
      const res = await fetchMonitoredSources();
      if (res.sources && res.sources.length > 0) {
        setSources(res.sources);
      }
      if (res.lastGlobalSync) {
        setLastGlobalSync(res.lastGlobalSync);
      }
    } catch (err) {
      console.warn('Failed to fetch monitored sources info:', err);
    }
  };

  useEffect(() => {
    loadSourceStatus();
  }, []);

  const categories = [
    'All',
    'Examinations',
    'Results',
    'Timetables',
    'Admissions',
    'Academic Notices',
    'Events',
    'Research',
    'Scholarships',
    'Placements',
    'General'
  ];

  const quickChips = [
    { label: 'Nov 2026 ESE Timetable', query: 'timetable' },
    { label: 'Ph.D Admissions', query: 'admission' },
    { label: 'End Semester Results', query: 'results' },
    { label: 'Continuous Assessment (CAE)', query: 'cae' },
    { label: '80% Attendance Rule', query: 'attendance' },
    { label: 'Grading System & Passing', query: 'grading' },
    { label: 'Curriculum & Syllabi', query: 'curriculum' },
    { label: 'Campus Placements', query: 'recruitment' }
  ];

  // Admin Key authentication state for protected SYNC_ADMIN_KEY
  const [adminKey, setAdminKey] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('campusmind_sync_admin_key') || '';
  });
  const [isAdminKeyModalOpen, setIsAdminKeyModalOpen] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');

  const executeSync = async (tokenToUse?: string) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    const token = tokenToUse !== undefined ? tokenToUse : adminKey;
    try {
      const res = await triggerNoticeSync(token || undefined);
      if (res.ok) {
        setSyncFeedback({
          type: 'success',
          message: `Sync complete! Verified ${res.total} notices (+${res.added} new, ${res.updated} updated) in ${((res.durationMs || 0) / 1000).toFixed(1)}s.`
        });
        if (res.lastGlobalSync) {
          setLastGlobalSync(res.lastGlobalSync);
        }
        await loadSourceStatus();
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        if (res.status === 403 || res.error?.toLowerCase().includes('unauthorized')) {
          setAdminKeyInput(adminKey);
          setIsAdminKeyModalOpen(true);
          setSyncFeedback({
            type: 'error',
            message: 'Admin authorization required. Please provide the server SYNC_ADMIN_KEY.'
          });
        } else {
          setSyncFeedback({
            type: 'error',
            message: res.error || 'Failed to sync with official portals.'
          });
        }
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Network error triggering synchronization.'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 7000);
    }
  };

  const handleSyncNow = () => {
    executeSync();
  };

  const handleSaveAdminKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminKeyInput.trim();
    setAdminKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('campusmind_sync_admin_key', trimmed);
      } else {
        localStorage.removeItem('campusmind_sync_admin_key');
      }
    } catch {}
    setIsAdminKeyModalOpen(false);
    executeSync(trimmed);
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Failed to save bookmarks to localStorage:', err);
      }
      return next;
    });
  };

  const getChecklistBadge = (noticeId: string) => {
    try {
      const raw = localStorage.getItem('campusmind_notice_checklists_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const items = parsed[noticeId];
        if (Array.isArray(items) && items.length > 0) {
          const done = items.filter((i: any) => i.completed).length;
          return (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ml-0.5 ${
              done === items.length
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
            }`}>
              {done}/{items.length}
            </span>
          );
        }
      }
    } catch {}
    return null;
  };

  // Filter and sort notices
  const filteredNotices = useMemo(() => {
    let result = notices.filter((notice) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        notice.title.toLowerCase().includes(q) ||
        notice.description.toLowerCase().includes(q) ||
        (notice.fullDetails && notice.fullDetails.toLowerCase().includes(q)) ||
        notice.category.toLowerCase().includes(q) ||
        notice.department.toLowerCase().includes(q) ||
        (notice.sourceWebsite && notice.sourceWebsite.toLowerCase().includes(q)) ||
        (notice.location && notice.location.toLowerCase().includes(q)) ||
        notice.date.includes(q);

      const matchesCategory = 
        selectedCategory === 'All' || 
        notice.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();

      const matchesPriority = priorityFilter === 'all' || notice.priority === priorityFilter;

      const matchesSource = 
        selectedSourceId === 'all' ||
        notice.sourceId === selectedSourceId ||
        (!notice.sourceId && selectedSourceId === 'demo');

      const matchesBookmark = !onlyBookmarks || bookmarkedIds.has(notice.id);

      return matchesSearch && matchesCategory && matchesPriority && matchesSource && matchesBookmark;
    });

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => b.date.localeCompare(a.date) || (b.lastVerified || '').localeCompare(a.lastVerified || ''));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sortBy === 'verified') {
      result.sort((a, b) => (b.lastVerified || b.date).localeCompare(a.lastVerified || a.date));
    } else if (sortBy === 'priority') {
      const score = (p: string) => (p === 'urgent' ? 3 : p === 'important' ? 2 : 1);
      result.sort((a, b) => score(b.priority) - score(a.priority) || b.date.localeCompare(a.date));
    }

    return result;
  }, [notices, searchQuery, selectedCategory, selectedSourceId, priorityFilter, sortBy, onlyBookmarks, bookmarkedIds]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const created: CollegeNotice = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      date: newDate,
      department: newDepartment.trim(),
      priority: newPriority,
      description: newDescription.trim(),
      location: newLocation.trim(),
      fullDetails: `${newDescription.trim()}\n\nOfficial notice posted by ${newDepartment}. Verified by Sathyabama Institute of Science and Technology Campus Knowledge Base.`,
      isDemonstration: true,
      verificationStatus: 'verified'
    };

    onAddNotice(created);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedSourceId('all');
    setPriorityFilter('all');
    setSortBy('newest');
    setOnlyBookmarks(false);
  };

  const formatLastSync = (isoString?: string | null) => {
    if (!isoString) return 'Pending Initial Sync';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago (${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Official Monitored Sources Real-Time Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-[#131F37] to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Real-Time University Sync</span>
              </span>
              <span className="text-xs text-slate-400">
                • Auto-checks: <strong className="text-white">Every 60 minutes</strong>
              </span>
              <span className="text-xs text-slate-400">
                • Last Synced: <strong className="text-cyan-300">{formatLastSync(lastGlobalSync)}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Sathyabama Official Notice Aggregator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Continuously monitoring official portals, research circulars, examination timetables, and notification directories of <strong className="text-white">Sathyabama Institute of Science and Technology</strong>.
            </p>
          </div>

          {/* Action Buttons: Sync Now, Admin Key & Add Notice */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isSyncing
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:shadow-emerald-900/50'
              }`}
              title="Trigger immediate re-scan of official portals"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isSyncing ? 'Scanning Official Portals...' : 'Sync Now (Scan Portals)'}</span>
            </button>

            <button
              onClick={() => {
                setAdminKeyInput(adminKey);
                setIsAdminKeyModalOpen(true);
              }}
              className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                adminKey
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={adminKey ? 'Admin Key configured (Click to manage)' : 'Configure SYNC_ADMIN_KEY (Optional)'}
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-medium">{adminKey ? 'Admin Key' : 'Key'}</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Add custom notice for testing"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Notice</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Toast Message */}
        {syncFeedback && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
              : syncFeedback.type === 'error'
              ? 'bg-rose-950/50 border-rose-800 text-rose-200'
              : 'bg-slate-800 border-slate-700 text-slate-200'
          }`}>
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{syncFeedback.message}</span>
          </div>
        )}

        {/* Monitored Portals Status Indicators Grid (All 7 Official Sources) */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              7 Official Monitored University Sources (Live Status & Records):
            </span>
            <span className="text-[11px] text-slate-400">
              Total Database Records: <strong className="text-white font-mono">{notices.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {MONITORED_SOURCES_CONFIG.map((src) => {
              const liveStat = sources.find((s) => s.id === src.id);
              const count = notices.filter((n) => n.sourceId === src.id).length;
              
              let statusType: 'online' | 'degraded' | 'error' | 'pending' = 'pending';
              if (liveStat) {
                statusType = liveStat.status;
              } else if (count > 0) {
                statusType = 'online';
              }

              const isOnline = statusType === 'online';
              const isDegraded = statusType === 'degraded';
              const isError = statusType === 'error';

              return (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between group ${
                    isOnline
                      ? 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-cyan-500/30'
                      : isDegraded
                      ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-700/70'
                      : isError
                      ? 'bg-rose-950/20 border-rose-800/50 hover:border-rose-700/70'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                  title={`${src.fullName}\nURL: ${src.url}\nStatus: ${statusType.toUpperCase()}\nNotices: ${count}${liveStat?.errorMessage ? `\nError: ${liveStat.errorMessage}` : ''}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isOnline
                            ? 'bg-emerald-400 animate-pulse'
                            : isDegraded
                            ? 'bg-amber-400'
                            : isError
                            ? 'bg-rose-500'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span className="truncate">{src.shortName}</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-cyan-300 font-semibold">{count} notices</span>
                      <span className={`text-[9px] uppercase px-1 rounded font-medium ${
                        isOnline
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                          : isDegraded
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                          : isError
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {statusType}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-400 truncate flex items-center justify-between">
                      <span className="truncate">{liveStat?.lastSuccess ? `Synced ${formatLastSync(liveStat.lastSuccess)}` : 'Pending sync'}</span>
                      <span className="text-[8px] uppercase px-0.5 rounded bg-slate-800/80 text-slate-400 shrink-0">{src.badge}</span>
                    </div>

                    {liveStat?.errorMessage && (
                      <div className="text-[9px] text-amber-300/90 truncate pt-0.5" title={liveStat.errorMessage}>
                        ⚠️ {liveStat.errorMessage}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

      </div>

      {/* Search Bar & Quick Filters Control Center */}
      <div className="bg-[#131F37] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords (e.g. End Semester, Ph.D, CAE timetable, Arrear, Attendance, Regulation)..."
            className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-sm text-white placeholder-slate-400 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Keyword Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Quick Filters:</span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setSearchQuery(chip.query)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer ${
                searchQuery.toLowerCase() === chip.query.toLowerCase()
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline ml-1 cursor-pointer"
            >
              Clear Query
            </button>
          )}
        </div>

        {/* Category Filter Pills (All 10 requested categories) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters Bar: Source, Sort, Priority, Bookmarks */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Source Portal Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Source Portal:</span>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">All 7 Monitored Sources ({notices.length} notices)</option>
                {MONITORED_SOURCES_CONFIG.map((src) => {
                  const count = notices.filter((n) => n.sourceId === src.id).length;
                  return (
                    <option key={src.id} value={src.id}>
                      {src.shortName} ({count})
                    </option>
                  );
                })}
                <option value="demo">Custom / Test Notices ({notices.filter((n) => !n.sourceId).length})</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="verified">Recently Verified</option>
                <option value="priority">Priority First</option>
              </select>
            </div>

            {/* Priority Pills */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] mr-1">Priority:</span>
              {(['all', 'urgent', 'important', 'standard'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded capitalize cursor-pointer text-[11px] ${
                    priorityFilter === p
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Bookmarks Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyBookmarks(!onlyBookmarks)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-xs ${
                onlyBookmarks
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {onlyBookmarks ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>Bookmarked ({bookmarkedIds.size})</span>
            </button>

            <span className="text-[11px] font-semibold text-slate-400">
              Showing <strong className="text-white">{filteredNotices.length}</strong> of {notices.length}
            </span>
          </div>

        </div>

      </div>

      {/* Notices Grid or Empty State */}
      {filteredNotices.length === 0 ? (
        <div className="bg-[#131F37] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-white">No official notices matched your filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No notices match query <span className="text-cyan-300">"{searchQuery || selectedCategory}"</span>. Try adjusting keywords or reset all filters below.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredNotices.map((notice) => {
            const isBookmarked = bookmarkedIds.has(notice.id);

            // Category color coding
            const getCategoryStyle = (cat: string) => {
              switch (cat.toLowerCase()) {
                case 'examinations':
                  return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
                case 'timetables':
                  return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
                case 'results':
                  return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
                case 'admissions':
                  return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
                case 'research':
                  return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
                case 'events':
                  return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
                case 'academic notices':
                  return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
                case 'placements':
                  return 'text-green-400 bg-green-950/60 border-green-800/60';
                default:
                  return 'text-slate-300 bg-slate-800 border-slate-700';
              }
            };

            return (
              <div
                key={notice.id}
                onClick={() => onViewNoticeDetails(notice)}
                className="group bg-[#131F37] hover:bg-[#182847] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  
                  {/* Badges & Actions Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        notice.priority === 'urgent'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : notice.priority === 'important'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {notice.priority}
                      </span>

                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getCategoryStyle(notice.category)}`}>
                        {notice.category}
                      </span>

                      {notice.isOfficial ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Official SIST</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-amber-300/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                          Demo Notice
                        </span>
                      )}

                      {notice.pdfUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/50">
                          <FileText className="w-3 h-3 text-rose-400" />
                          <span>PDF {notice.fileSize ? `(${notice.fileSize})` : ''}</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => toggleBookmark(notice.id, e)}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this notice'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isBookmarked 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-slate-800/60 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {notice.title}
                  </h3>

                  {/* Description / Summary */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                    {notice.description}
                  </p>

                  {/* Metadata line: Source portal, Department, Date */}
                  <div className="pt-2 flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 text-cyan-300/90 font-medium truncate max-w-[240px]">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{notice.department || notice.sourceWebsite || 'Sathyabama University'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{notice.date}</span>
                    </div>
                  </div>

                  {/* Notice-to-Action AI Row */}
                  <div className="pt-2.5 pb-1 flex flex-wrap items-center gap-1.5 border-t border-slate-800/60">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Actions:
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionModalNotice(notice);
                        setActionModalTab('breakdown');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Grounded AI breakdown of announcement and explicit deadlines"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>AI Breakdown</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionModalNotice(notice);
                        setActionModalTab('checklist');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Student action checklist saved in your browser"
                    >
                      <CheckSquare className="w-3 h-3 text-indigo-400" />
                      <span>Action Checklist</span>
                      {getChecklistBadge(notice.id)}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionModalNotice(notice);
                        setActionModalTab('calendar');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Export confirmed event or deadline to .ics calendar"
                    >
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span>Add to Calendar</span>
                    </button>
                  </div>

                </div>

                {/* Card Action Footer: Open Official Notice, Download PDF, Ask AI, Full Details */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  
                  <div className="flex items-center gap-2">
                    {/* Primary Button: Open Official Notice */}
                    {notice.originalUrl && (
                      <a
                        href={notice.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors shadow-sm"
                        title="Open original official notice page"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Official Notice</span>
                      </a>
                    )}

                    {/* Direct PDF Button if available */}
                    {notice.pdfUrl && (
                      <a
                        href={notice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors shadow-sm"
                        title="Download official PDF document"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAboutNotice(notice);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer text-[11px]"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Ask AI</span>
                    </button>
                  </div>

                  <span className="text-slate-400 flex items-center gap-1 font-medium group-hover:text-slate-200 text-[11px]">
                    <span>Full Details</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Demo Notice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131F37] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-white text-base">Add Demonstration Notice</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. End-Term Practical Exam Schedule Released"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="Examinations">Examinations</option>
                    <option value="Results">Results</option>
                    <option value="Timetables">Timetables</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Academic Notices">Academic Notices</option>
                    <option value="Events">Events</option>
                    <option value="Research">Research</option>
                    <option value="Scholarships">Scholarships</option>
                    <option value="Placements">Placements</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="important">Important</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Building B Main Auditorium"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Content *</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter full notice announcement details..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  Save Notice
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Admin Key Configuration Modal */}
      {isAdminKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#131F37] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAdminKeyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Sync Admin Key</h3>
                <p className="text-xs text-slate-400">Authorization for university notice scanning</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If your university portal aggregator server has configured a secret <strong className="text-white font-mono">SYNC_ADMIN_KEY</strong> to prevent unauthorized scans, enter it below. The token will be securely stored in your browser session and transmitted via the <strong className="text-cyan-400 font-mono">x-admin-token</strong> header.
            </p>

            <form onSubmit={handleSaveAdminKey} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Server Admin Key:
                </label>
                <input
                  type="password"
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  placeholder="Enter secret SYNC_ADMIN_KEY value..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                {adminKey ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminKey('');
                      setAdminKeyInput('');
                      try {
                        localStorage.removeItem('campusmind_sync_admin_key');
                      } catch {}
                      setIsAdminKeyModalOpen(false);
                      setSyncFeedback({
                        type: 'info',
                        message: 'Admin key cleared from browser storage.'
                      });
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Clear Saved Key
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminKeyModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Save & Sync Now
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice-to-Action AI Modal (Breakdown, Checklist, Calendar) */}
      <NoticeActionModal
        notice={actionModalNotice}
        initialTab={actionModalTab}
        onClose={() => setActionModalNotice(null)}
        onAskAi={(n) => {
          setActionModalNotice(null);
          onAskAboutNotice(n);
        }}
      />

    </div>
  );
};
