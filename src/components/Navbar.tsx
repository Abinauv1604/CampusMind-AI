import React from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Bell, 
  FileText, 
  HelpCircle, 
  Cpu, 
  Menu, 
  X,
  Mic
} from 'lucide-react';
import { SystemStatus } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'chat' | 'voice' | 'study' | 'notices' | 'documents';
  setActiveTab: (tab: 'dashboard' | 'chat' | 'voice' | 'study' | 'notices' | 'documents') => void;
  status: SystemStatus;
  openSetupGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  status,
  openSetupGuide
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Campus AI Chat', icon: MessageSquare },
    { id: 'voice', label: 'CampusMind Voice', icon: Mic },
    { id: 'study', label: 'Study Assistant', icon: BookOpen },
    { id: 'notices', label: 'Notice Finder', icon: Bell },
    { id: 'documents', label: 'Knowledge Base', icon: FileText },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#0B132B]/95 backdrop-blur-md border-b border-cyan-950/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & College Identity */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  CampusMind<span className="text-cyan-400">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Hackathon
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Sathyabama Institute of Science and Technology
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action: AI Engine Status & Setup Guide */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Engine Indicator */}
            <div 
              onClick={openSetupGuide}
              title="Click to view AI Engine details and setup instructions"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs cursor-pointer hover:border-cyan-500/50 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.hasGeminiKey ? 'bg-cyan-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status.hasGeminiKey ? 'bg-cyan-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-slate-300 font-mono text-[11px]">
                {status.hasGeminiKey ? 'Gemini 3.8 Flash' : 'Local Extractive RAG'}
              </span>
            </div>

            {/* Beginner Setup Guide Button */}
            <button
              onClick={openSetupGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition-all hover:shadow-cyan-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Setup & Publish</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={openSetupGuide}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400"
              title="Setup Guide"
            >
              <Cpu className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B132B] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
          
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                openSetupGuide();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Setup & Deployment Guide</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
