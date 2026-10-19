import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Download, 
  CheckCircle2, 
  Square, 
  FileText, 
  HelpCircle,
  Plus,
  RotateCcw,
  Building2,
  CalendarCheck
} from 'lucide-react';
import { CollegeNotice } from '../types';
import { NoticeBreakdown, CalendarEventConfig } from '../types/noticeActions';
import { fetchNoticeBreakdown } from '../services/api';
import { downloadIcsFile, extractDatesFromNotice } from '../utils/noticeActionParser';

interface NoticeActionModalProps {
  notice: CollegeNotice | null;
  initialTab?: 'breakdown' | 'checklist' | 'calendar';
  onClose: () => void;
  onAskAi: (notice: CollegeNotice) => void;
}

const CHECKLIST_STORAGE_KEY = 'campusmind_notice_checklists_v1';

export const NoticeActionModal: React.FC<NoticeActionModalProps> = ({
  notice,
  initialTab = 'breakdown',
  onClose,
  onAskAi
}) => {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'checklist' | 'calendar'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<NoticeBreakdown | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>('');

  // Checklist state
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [newCustomTask, setNewCustomTask] = useState('');

  // Calendar configuration state
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState('');
  const [calTime, setCalTime] = useState('09:30');
  const [calEndTime, setCalEndTime] = useState('12:30');
  const [calIsAllDay, setCalIsAllDay] = useState(false);
  const [calLocation, setCalLocation] = useState('Sathyabama Institute of Science and Technology');
  const [dateIsAmbiguous, setDateIsAmbiguous] = useState(false);
  const [calendarDownloaded, setCalendarDownloaded] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!notice) return;

    // Initialize calendar fields
    const { eventDate, isDateExplicit, notes } = extractDatesFromNotice(notice);
    setCalTitle(notice.title);
    setCalLocation(notice.location || 'Sathyabama Institute of Science and Technology');

    if (isDateExplicit && eventDate) {
      setCalDate(eventDate);
      setDateIsAmbiguous(false);
    } else {
      // Missing or ambiguous: prompt user to confirm
      setCalDate(eventDate || notice.date || new Date().toISOString().slice(0, 10));
      setDateIsAmbiguous(!isDateExplicit);
    }

    // Fetch or generate breakdown
    setLoading(true);
    fetchNoticeBreakdown(notice)
      .then((res) => {
        setBreakdown(res.breakdown);
        setEngineUsed(res.engineUsed);

        // Load or initialize checklist with persistence
        loadChecklistProgress(notice.id, res.breakdown.checklistItems);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [notice]);

  // Load checklist progress from localStorage
  const loadChecklistProgress = (noticeId: string, defaultTasks: string[]) => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[noticeId] && Array.isArray(parsed[noticeId])) {
          setChecklist(parsed[noticeId]);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse checklist progress:', e);
    }

    // Initialize with grounded tasks
    const initialTasks = defaultTasks.map((text, idx) => ({
      id: `task-${idx}-${Date.now()}`,
      text,
      completed: false
    }));
    setChecklist(initialTasks);
    saveChecklistToStorage(noticeId, initialTasks);
  };

  const saveChecklistToStorage = (noticeId: string, items: Array<{ id: string; text: string; completed: boolean }>) => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      existing[noticeId] = items;
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to save checklist:', e);
    }
  };

  const toggleChecklistItem = (taskId: string) => {
    if (!notice) return;
    const updated = checklist.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    saveChecklistToStorage(notice.id, updated);
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTask.trim() || !notice) return;
    const newTask = {
      id: `custom-${Date.now()}`,
      text: newCustomTask.trim(),
      completed: false
    };
    const updated = [...checklist, newTask];
    setChecklist(updated);
    saveChecklistToStorage(notice.id, updated);
    setNewCustomTask('');
  };

  const handleResetChecklist = () => {
    if (!notice || !breakdown) return;
    const reset = breakdown.checklistItems.map((text, idx) => ({
      id: `task-${idx}-${Date.now()}`,
      text,
      completed: false
    }));
    setChecklist(reset);
    saveChecklistToStorage(notice.id, reset);
  };

  const handleDownloadCalendar = () => {
    if (!notice || !calDate) return;

    const eventConfig: CalendarEventConfig = {
      title: calTitle.trim() || notice.title,
      description: `${notice.title}\nCategory: ${notice.category}\nDepartment: ${notice.department}\n\nSummary:\n${breakdown?.announcement || notice.description}`,
      location: calLocation,
      startDate: calDate,
      startTime: calIsAllDay ? undefined : calTime,
      endDate: calDate,
      endTime: calIsAllDay ? undefined : calEndTime,
      isAllDay: calIsAllDay,
      url: notice.originalUrl || notice.sourceUrl
    };

    downloadIcsFile(eventConfig, notice.title);
    setCalendarDownloaded(true);
    setTimeout(() => setCalendarDownloaded(false), 3000);
  };

  if (!notice) return null;

  const completedCount = checklist.filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#131F37] border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-[#0B132B] rounded-t-2xl gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Notice-To-Action AI
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {notice.category}
              </span>
              {engineUsed && (
                <span className="text-[9px] font-mono text-slate-400">
                  Engine: {engineUsed === 'gemini' ? 'Gemini 3.1 Flash' : 'Grounded Institutional Extractor'}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
              {notice.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0E172A] px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-2.5 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'breakdown'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. AI Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2.5 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>2. Action Checklist</span>
            {checklist.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                completedCount === checklist.length
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {completedCount}/{checklist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2.5 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>3. Add to Calendar (.ics)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200 flex-1">
          
          {loading && (
            <div className="p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300">Grounding notice facts with verified university knowledge base...</p>
            </div>
          )}

          {/* TAB 1: AI BREAKDOWN */}
          {!loading && activeTab === 'breakdown' && breakdown && (
            <div className="space-y-4">
              
              {/* Executive Summary Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Official Announcement Summary
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {breakdown.announcement}
                </p>
              </div>

              {/* Grid: Target Audience, Action Required, Explicit Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Who It Applies To</span>
                  <p className="text-xs text-white font-medium">{breakdown.targetAudience}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Action Required</span>
                  <p className="text-xs text-emerald-300 font-medium">{breakdown.actionRequired}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Explicit Deadline / Event Schedule</span>
                  {breakdown.explicitDeadline ? (
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <Clock className="w-4 h-4 text-rose-400" />
                      <span>{breakdown.explicitDeadline}</span>
                      <span className="text-[10px] font-normal text-slate-400">(Explicitly stated in official announcement)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No specific cutoff deadline stated in notice header. Check batch schedule or department circular.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Missing or Uncertain Details Box */}
              {breakdown.missingOrUncertainDetails && breakdown.missingOrUncertainDetails.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Missing or Unconfirmed Details (Anti-Hallucination Guard)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 pl-1">
                    {breakdown.missingOrUncertainDetails.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Official Source & PDF Links */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Source: <strong>{breakdown.sourceWebsite || notice.department}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {breakdown.sourceUrl && (
                    <a
                      href={breakdown.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Official Portal Link</span>
                    </a>
                  )}

                  {breakdown.pdfUrl && (
                    <a
                      href={breakdown.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ACTION CHECKLIST */}
          {!loading && activeTab === 'checklist' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">Student Task Checklist</span>
                  <p className="text-slate-400 text-[11px]">Tasks automatically extracted from notice and saved locally in your browser.</p>
                </div>

                <button
                  onClick={handleResetChecklist}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] underline cursor-pointer"
                  title="Reset to default grounded tasks"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Progress</span>
                  <span>{completedCount} of {checklist.length} completed ({checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${checklist.length ? (completedCount / checklist.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {checklist.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleChecklistItem(task.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      task.completed
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400 line-through'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <button type="button" className="mt-0.5 shrink-0 text-cyan-400">
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                      )}
                    </button>
                    <span className="text-xs leading-relaxed">{task.text}</span>
                  </div>
                ))}
              </div>

              {/* Add Custom Student Sub-task */}
              <form onSubmit={handleAddCustomTask} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={newCustomTask}
                  onChange={(e) => setNewCustomTask(e.target.value)}
                  placeholder="Add a personal reminder or sub-task..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-cyan-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!newCustomTask.trim()}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </form>

            </div>
          )}

          {/* TAB 3: ADD TO CALENDAR */}
          {!loading && activeTab === 'calendar' && (
            <div className="space-y-4">
              
              {/* Ambiguity notice banner if dates are not explicit */}
              {dateIsAmbiguous && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-white">Date Confirmation Required:</span>
                    <p className="text-slate-300">
                      This official notice announces an examination or registration period without an exact day in its summary header. Please verify your specific paper/batch date and set it below before creating your calendar event.
                    </p>
                  </div>
                </div>
              )}

              {/* Calendar Config Form */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 text-xs">
                
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Event / Exam Title</label>
                  <input
                    type="text"
                    value={calTitle}
                    onChange={(e) => setCalTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Confirmed Event Date *</label>
                    <input
                      type="date"
                      required
                      value={calDate}
                      onChange={(e) => {
                        setCalDate(e.target.value);
                        setDateIsAmbiguous(false);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Campus Venue / Location</label>
                    <input
                      type="text"
                      value={calLocation}
                      onChange={(e) => setCalLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                {/* Timing controls */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={calIsAllDay}
                      onChange={(e) => setCalIsAllDay(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700"
                    />
                    <span>All-Day Calendar Reminder</span>
                  </label>
                </div>

                {!calIsAllDay && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Start Time</label>
                      <input
                        type="time"
                        value={calTime}
                        onChange={(e) => setCalTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">End Time</label>
                      <input
                        type="time"
                        value={calEndTime}
                        onChange={(e) => setCalEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exports RFC-5545 <code className="text-cyan-300 font-mono">.ics</code> file (compatible with Google Calendar, Apple Calendar, Outlook).</span>
                </div>

                <button
                  onClick={handleDownloadCalendar}
                  disabled={!calDate}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{calendarDownloaded ? 'Downloaded (.ics)!' : 'Download .ics Calendar Event'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B132B] rounded-b-2xl flex items-center justify-between text-xs">
          <button
            onClick={() => onAskAi(notice)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Campus AI More Questions</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
