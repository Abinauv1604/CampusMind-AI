import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Chatbot } from './components/Chatbot';
import { CampusMindVoice } from './components/CampusMindVoice';
import { StudyAssistant } from './components/StudyAssistant';
import { NoticeFinder } from './components/NoticeFinder';
import { DocumentLibrary } from './components/DocumentLibrary';
import { SetupGuideModal } from './components/SetupGuideModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { NoticeDetailModal } from './components/NoticeDetailModal';
import { 
  UNIFIED_KNOWLEDGE_BASE, 
  loadStoredKnowledgeBase, 
  saveStoredKnowledgeBase, 
  knowledgeItemToDocument, 
  knowledgeItemToNotice 
} from './data/sampleData';
import { CollegeDocument, CollegeNotice, KnowledgeItem, SystemStatus } from './types';
import { fetchSystemStatus, fetchKnowledgeBase, saveKnowledgeBaseItem } from './services/api';
import { ShieldCheck, Heart, Sparkles, BookOpen, MessageSquare, Bell, FileText, Mic } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'voice' | 'study' | 'notices' | 'documents'>('dashboard');
  
  // Single Unified Knowledge Base Source of Truth
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(() => loadStoredKnowledgeBase());

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    hasGeminiKey: false,
    engine: 'local-extractive',
    serverOnline: false,
    modelName: 'Local Extractive RAG'
  });

  const [initialChatQuery, setInitialChatQuery] = useState<string>('');
  const [selectedDocForView, setSelectedDocForView] = useState<CollegeDocument | null>(null);
  const [selectedNoticeForView, setSelectedNoticeForView] = useState<CollegeNotice | null>(null);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync derived notices and documents from the single unified knowledge base
  const notices: CollegeNotice[] = useMemo(() => knowledgeItems.map(knowledgeItemToNotice), [knowledgeItems]);
  const documents: CollegeDocument[] = useMemo(() => knowledgeItems.map(knowledgeItemToDocument), [knowledgeItems]);

  const refreshKnowledge = async () => {
    try {
      const [status, items] = await Promise.all([fetchSystemStatus(), fetchKnowledgeBase()]);
      setSystemStatus(status);
      if (Array.isArray(items) && items.length > 0) {
        setKnowledgeItems((prev) => {
          const itemMap = new Map<string, KnowledgeItem>();
          items.forEach((item) => itemMap.set(item.id, item));
          prev.forEach((item) => {
            if (!itemMap.has(item.id)) {
              itemMap.set(item.id, item);
            }
          });
          const merged = Array.from(itemMap.values());
          saveStoredKnowledgeBase(merged);
          return merged;
        });
      }
    } catch (err) {
      console.warn('Error refreshing knowledge base:', err);
    }
  };

  useEffect(() => {
    refreshKnowledge();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAskQuestionFromAnywhere = (query: string) => {
    setInitialChatQuery(query);
    setActiveTab('chat');
  };

  const handleAskAboutNotice = (notice: CollegeNotice) => {
    setInitialChatQuery(`What are the key rules, deadlines, or details for the notice: "${notice.title}"?`);
    setActiveTab('chat');
  };

  const handleAskAboutDocument = (doc: CollegeDocument) => {
    setInitialChatQuery(`What does the official document "${doc.title}" say regarding policies and requirements?`);
    setActiveTab('chat');
  };

  // Unified Handler: Adds to Knowledge Base, immediately updating both Notice Finder & Chatbot!
  const handleAddKnowledgeItem = async (newItem: KnowledgeItem) => {
    setKnowledgeItems((prev) => {
      const updated = [newItem, ...prev.filter((i) => i.id !== newItem.id)];
      saveStoredKnowledgeBase(updated);
      return updated;
    });

    // Sync to backend knowledge store
    await saveKnowledgeBaseItem(newItem);
    showToast(`Added "${newItem.title}" to campus knowledge base & notice finder!`);
  };

  const handleAddNotice = (newNotice: CollegeNotice) => {
    const item: KnowledgeItem = {
      id: newNotice.id,
      title: newNotice.title,
      date: newNotice.date,
      category: newNotice.category,
      department: newNotice.department,
      priority: newNotice.priority,
      location: newNotice.location || 'Campus Innovation Lab',
      summary: newNotice.description,
      content: newNotice.fullDetails || `${newNotice.title}\nDepartment: ${newNotice.department}\nDate: ${newNotice.date}\n\n${newNotice.description}`,
      tags: [newNotice.category.toLowerCase(), ...newNotice.title.toLowerCase().split(' ').filter((w) => w.length > 3)],
      isDemonstration: true
    };
    handleAddKnowledgeItem(item);
  };

  const handleAddDocument = (newDoc: CollegeDocument) => {
    const item: KnowledgeItem = {
      id: newDoc.id,
      title: newDoc.title,
      date: newDoc.lastUpdated,
      category: (newDoc.category as any) || 'Academic Policies',
      department: newDoc.department,
      priority: 'important',
      location: 'Academic Office',
      summary: newDoc.content.slice(0, 160) + '...',
      content: newDoc.content,
      tags: newDoc.tags,
      isDemonstration: true
    };
    handleAddKnowledgeItem(item);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090F1E] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={systemStatus}
        openSetupGuide={() => setIsSetupGuideOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={setActiveTab}
            onAskQuestion={handleAskQuestionFromAnywhere}
            notices={notices}
            status={systemStatus}
            openSetupGuide={() => setIsSetupGuideOpen(true)}
            onViewNoticeDetails={(n) => setSelectedNoticeForView(n)}
          />
        )}

        {activeTab === 'chat' && (
          <Chatbot
            documents={documents}
            status={systemStatus}
            initialQuery={initialChatQuery}
            onClearInitialQuery={() => setInitialChatQuery('')}
            onViewDocument={(d) => setSelectedDocForView(d)}
            openSetupGuide={() => setIsSetupGuideOpen(true)}
            onSwitchToVoice={() => setActiveTab('voice')}
          />
        )}

        {activeTab === 'voice' && (
          <CampusMindVoice
            documents={documents}
            status={systemStatus}
            onNavigateTab={setActiveTab}
            onViewDocument={(d) => setSelectedDocForView(d)}
            openSetupGuide={() => setIsSetupGuideOpen(true)}
          />
        )}

        {activeTab === 'study' && (
          <StudyAssistant
            status={systemStatus}
            openSetupGuide={() => setIsSetupGuideOpen(true)}
          />
        )}

        {activeTab === 'notices' && (
          <NoticeFinder
            notices={notices}
            onAddNotice={handleAddNotice}
            onAskAboutNotice={handleAskAboutNotice}
            onViewNoticeDetails={(n) => setSelectedNoticeForView(n)}
            onRefreshData={refreshKnowledge}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentLibrary
            documents={documents}
            onAskAboutDocument={handleAskAboutDocument}
            onViewDocument={(d) => setSelectedDocForView(d)}
            onAddDocument={handleAddDocument}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0B132B]/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">CampusMind AI</span>
            <span>•</span>
            <span>Sathyabama Institute of Science and Technology Hackathon Edition</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              API Key & Free Deployment Guide
            </button>
            <span>•</span>
            <span className="text-slate-400">
              Active Mode: <strong className="text-slate-200">{systemStatus.hasGeminiKey ? 'Gemini 3.1 Flash' : 'Free Local Extractive'}</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Setup & Deployment Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
        status={systemStatus}
      />

      {/* Full Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDocForView}
        onClose={() => setSelectedDocForView(null)}
        onAskAboutDoc={handleAskAboutDocument}
      />

      {/* Notice Detail Modal */}
      <NoticeDetailModal
        notice={selectedNoticeForView}
        onClose={() => setSelectedNoticeForView(null)}
        onAskAboutNotice={handleAskAboutNotice}
        documents={documents}
        onViewDocument={(doc) => setSelectedDocForView(doc)}
      />

    </div>
  );
}
