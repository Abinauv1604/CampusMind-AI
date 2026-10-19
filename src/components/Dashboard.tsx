import React from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Bell, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Clock, 
  ShieldCheck, 
  Code2, 
  GraduationCap
} from 'lucide-react';
import { CollegeNotice, SystemStatus } from '../types';

interface DashboardProps {
  onNavigate: (tab: 'dashboard' | 'chat' | 'study' | 'notices' | 'documents') => void;
  onAskQuestion: (query: string) => void;
  notices: CollegeNotice[];
  status: SystemStatus;
  openSetupGuide: () => void;
  onViewNoticeDetails: (notice: CollegeNotice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onAskQuestion,
  notices,
  status,
  openSetupGuide,
  onViewNoticeDetails
}) => {
  const [quickSearch, setQuickSearch] = React.useState('');

  const urgentNotices = notices.filter((n) => n.priority === 'urgent' || n.priority === 'important').slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onAskQuestion(quickSearch.trim());
    } else {
      onNavigate('chat');
    }
  };

  const sampleQuickPrompts = [
    'What is the minimum attendance requirement for final exams?',
    'When does InnovateX 2026 Hackathon registration close?',
    'What are the library night study block hours?'
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Demonstration Data Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-900 border border-cyan-800/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div>
            <span className="font-semibold text-cyan-300">Demonstration Prototype:</span> Loaded with verified sample academic records, midterm schedules, and notices for <span className="text-white font-medium">Sathyabama Institute of Science and Technology</span>.
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            onClick={openSetupGuide}
            className="text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center gap-1"
          >
            <span>Beginner Setup & API Guide</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e1e3e] via-[#14264e] to-[#0b132b] border border-cyan-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Hackathon Edition 2026 • AI-Powered Campus Assistant
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Academic clarity, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-300">instantly verified</span> from official notices.
          </h1>

          <p className="mt-3 text-slate-300 text-base sm:text-lg leading-relaxed">
            Ask any question about examination schedules, grading policies, deadlines, or tech events. CampusMind searches official campus documents and strictly cites the source title without hallucinations.
          </p>

          {/* Quick Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Ask about attendance, midterm dates, hackathon, library hours..."
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-400 rounded-xl text-sm transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              id="dashboard-ask-assistant-button"
              title="Ask Campus AI Assistant"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Assistant</span>
            </button>
          </form>

          {/* Sample prompt pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Try asking:</span>
            {sampleQuickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onAskQuestion(prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors text-left truncate max-w-[280px] sm:max-w-none"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Pillar Launchers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Feature 1: Campus AI Chatbot */}
        <div 
          onClick={() => onNavigate('chat')}
          className="group relative bg-[#131F37] hover:bg-[#182847] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                1. Campus AI Chatbot
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Grounding
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Ask natural questions about college notices, exam rules, and facilities. Answers cite exact official documents and clearly state if info is missing.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
            <span>Launch Campus Chatbot</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Feature 2: Smart Study Assistant */}
        <div 
          onClick={() => onNavigate('study')}
          className="group relative bg-[#131F37] hover:bg-[#182847] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                2. Smart Study Assistant
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                3 Tools
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Paste lecture notes to instantly Summarize, Extract Core Bullet Points, or Generate 5 Interactive Practice Check Questions with explanations.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
            <span>Open Study Assistant</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Feature 3: College Notice Finder */}
        <div 
          onClick={() => onNavigate('notices')}
          className="group relative bg-[#131F37] hover:bg-[#182847] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                3. Notice Finder
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Search & Filter
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Filter through official notices by category (Exam Schedules, Hackathons, Deadlines, Facilities) with instant search, priority badges, and full descriptions.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
            <span>Explore All Notices ({notices.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Two Column Layout: Urgent Announcements & Technical Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Urgent Notices Carousel / Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                High Priority Campus Notices
              </h2>
            </div>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All Notices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {urgentNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => onViewNoticeDetails(notice)}
                className="bg-[#131F37] hover:bg-[#182847] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      notice.priority === 'urgent'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {notice.priority}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {notice.date}
                    </span>
                    <span className="text-xs text-cyan-400 font-medium">
                      • {notice.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    {notice.title}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {notice.description}
                  </p>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewNoticeDetails(notice);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 shrink-0 self-start sm:self-auto"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Quick link to Knowledge base */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-slate-400">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Looking for raw institutional documents and policies?</span>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-cyan-400 font-semibold hover:underline"
            >
              Browse Knowledge Base (8 Docs) →
            </button>
          </div>
        </div>

        {/* Right 1 Col: System Architecture & Free Tier Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Hackathon Architecture
            </h2>
          </div>

          <div className="bg-[#131F37] border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Current AI Engine:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  status.hasGeminiKey
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {status.hasGeminiKey ? 'Gemini 3.8 Flash' : 'Local Extractive RAG'}
                </span>
              </div>
              <p className="text-slate-400">
                {status.hasGeminiKey
                  ? 'Server is running with real Google Gemini 3.8 Flash API key injected via server proxy.'
                  : 'Zero-cost offline mode is active. Uses high-precision keyword/n-gram RAG matcher and rule-based heuristic study tools without requiring any paid subscriptions.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Beginner Design Principles:</span>
              </div>
              <ul className="space-y-2 text-slate-300 pl-5 list-disc">
                <li><strong className="text-white">Strict Source Grounding:</strong> No hallucinated answers; missing information is explicitly declared.</li>
                <li><strong className="text-white">Zero Frontend Key Exposure:</strong> All AI processing runs through server-side routes or local heuristics.</li>
                <li><strong className="text-white">100% Free Tier Ready:</strong> Fully testable without a credit card or subscription.</li>
              </ul>
            </div>

            <button
              onClick={openSetupGuide}
              className="w-full py-2.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-center transition-colors flex items-center justify-center gap-2"
            >
              <span>Setup Guide & Deployment Steps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
