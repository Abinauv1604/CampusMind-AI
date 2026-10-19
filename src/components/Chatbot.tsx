import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  Copy, 
  Check, 
  Trash2, 
  ThumbsUp, 
  ThumbsDown,
  ArrowRight,
  Key,
  Mic,
  Volume2,
  VolumeX,
  Lightbulb,
  BookOpen,
  GraduationCap,
  ListFilter,
  RotateCcw
} from 'lucide-react';
import { ChatMessage, CollegeDocument, SystemStatus, QuestionCategory } from '../types';
import { askCampusChat } from '../services/api';
import { sanitizeTextForSpeech } from '../utils/voiceUtils';
import { MathMarkdown } from './MathMarkdown';

interface ChatbotProps {
  documents: CollegeDocument[];
  status: SystemStatus;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onViewDocument: (doc: CollegeDocument) => void;
  openSetupGuide?: () => void;
  onSwitchToVoice?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({
  documents,
  status,
  initialQuery,
  onClearInitialQuery,
  onViewDocument,
  openSetupGuide,
  onSwitchToVoice
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: 'Hello! I am CampusMind AI, your intelligent Hybrid AI Tutor and University Assistant.\n\nI can help you with:\n• 🔬 Academic & Science Concepts (Physics, Math, Chemistry, Engineering formulas & step-by-step solutions)\n• 💻 Programming & CS (C/C++, Python, pointers, data structures & debugging)\n• 🏛️ Sathyabama University (Exam dates, 80% attendance rule, official circulars & hall tickets)\n\nAsk any question or tap a sample query below to get started!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      found: true,
      category: 'general',
      engineUsed: status.hasGeminiKey ? 'gemini-3.1-flash-lite' : 'local-extractive'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handledQueryRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle auto-ask if passed from dashboard or notices
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && initialQuery !== handledQueryRef.current) {
      const q = initialQuery.trim();
      handledQueryRef.current = q;
      setInput('');
      if (onClearInitialQuery) onClearInitialQuery();
      handleSendQuestion(q);
    }
  }, [initialQuery]);

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = sanitizeTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendQuestion = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    const trimmedQuestion = questionText.trim();
    setLastFailedQuestion(null);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmedQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      found: true,
      engineUsed: status.hasGeminiKey ? 'gemini-3.1-flash-lite' : 'local-extractive'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages
        .filter((m) => m.id !== 'welcome-msg' && !m.isError)
        .slice(-8)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.text
        }));

      const response = await askCampusChat(trimmedQuestion, documents, historyForApi);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceDocTitle: response.sourceDocTitle,
        sourceDocId: response.sourceDocId,
        found: response.found,
        engineUsed: response.engineUsed as any,
        confidenceScore: response.confidenceScore,
        category: response.category
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat query error:', err);
      setLastFailedQuestion(trimmedQuestion);
      const isQuota = err?.isQuotaError || String(err?.message || '').toLowerCase().includes('quota');
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: isQuota
          ? '⏳ Gemini AI free quota limit temporarily reached. Free quotas reset automatically every minute. Please click "Retry Question" below.'
          : `⚠️ Notice: ${err.message || 'Unable to query AI service'}. Please check your connection or retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        found: false,
        isError: true,
        canRetry: true,
        failedQuery: trimmedQuestion,
        engineUsed: 'gemini-error'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: 'Chat history cleared. What topic or campus information can I help you with?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        found: true,
        category: 'general',
        engineUsed: status.hasGeminiKey ? 'gemini-3.1-flash-lite' : 'local-extractive'
      }
    ]);
  };

  const getCategoryBadge = (category?: QuestionCategory, sourceTitle?: string) => {
    if (sourceTitle || category === 'sathyabama') {
      return {
        label: '🏛️ Sathyabama Notice',
        className: 'bg-blue-950/60 text-blue-300 border-blue-800'
      };
    }
    switch (category) {
      case 'academic':
        return {
          label: '🔬 Academic STEM Tutor',
          className: 'bg-purple-950/60 text-purple-300 border-purple-800'
        };
      case 'programming':
        return {
          label: '💻 Coding Mentor',
          className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
        };
      case 'time_sensitive':
        return {
          label: '⏱️ Time-Sensitive',
          className: 'bg-amber-950/60 text-amber-300 border-amber-800'
        };
      default:
        return {
          label: '🌐 General AI',
          className: 'bg-slate-800 text-cyan-300 border-slate-700'
        };
    }
  };

  const samplePrompts = [
    {
      label: '🔬 What is refraction?',
      query: 'What is refraction? Explain Snell\'s law with an example.',
      type: 'academic'
    },
    {
      label: '💻 Pointers in C',
      query: 'What is a pointer in C and how does memory addressing work?',
      type: 'programming'
    },
    {
      label: '📐 Quadratic Equation',
      query: 'Solve a quadratic equation step by step with an example.',
      type: 'academic'
    },
    {
      label: '⚡ RAM vs ROM',
      query: 'Explain the difference between RAM and ROM with key points.',
      type: 'academic'
    },
    {
      label: '🏛️ 80% Attendance Rule',
      query: 'What is the minimum attendance requirement at Sathyabama to write end-term exams?',
      type: 'sathyabama'
    },
    {
      label: '📅 Midterm CAE Exam',
      query: 'When are the fall midterm exams and where can I download hall tickets?',
      type: 'sathyabama'
    },
    {
      label: '🏆 InnovateX Hackathon',
      query: 'What is the team size and prize pool for the InnovateX Hackathon?',
      type: 'sathyabama'
    },
    {
      label: '📚 Library Night Study',
      query: 'What are the operating hours for the Central Library and Exam Night Study room?',
      type: 'sathyabama'
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-[#0E172A] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Chatbot Top Bar */}
      <div className="px-5 py-3.5 bg-[#131F37] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">CampusMind Hybrid AI Tutor & Assistant</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                status.hasGeminiKey
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {status.hasGeminiKey ? '⚡ Gemini 3.1 Flash' : '🔍 Local Extractive RAG (Active)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              STEM & Coding Mentor • Verified Sathyabama University Notice Grounding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchToVoice && (
            <button
              onClick={onSwitchToVoice}
              title="Switch to CampusMind Voice Assistant"
              className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-semibold">Voice Mode</span>
            </button>
          )}

          {!status.hasGeminiKey && openSetupGuide && (
            <button
              onClick={openSetupGuide}
              className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Key className="w-3 h-3" />
              <span>Connect Gemini Key</span>
            </button>
          )}

          <button
            onClick={handleClearChat}
            title="Clear chat history"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Suggestion Prompts Bar */}
      <div className="px-4 py-2.5 bg-[#0B132B] border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 text-xs scrollbar-none">
        <span className="text-slate-400 font-semibold text-[11px] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Suggested Topics:
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendQuestion(p.query)}
            className="px-2.5 py-1 rounded-lg shrink-0 transition-all font-medium border bg-slate-800/70 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-cyan-300 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-[#0B132B]/50 to-[#0E172A]">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          const isNotFound = !msg.found;
          const categoryBadge = isBot ? getCategoryBadge(msg.category, msg.sourceDocTitle) : null;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-md ${
                isBot 
                  ? msg.isError
                    ? 'bg-rose-950/20 border border-rose-700/50 text-slate-200'
                    : isNotFound && msg.category === 'sathyabama'
                      ? 'bg-amber-950/20 border border-amber-700/40 text-slate-200'
                      : 'bg-[#15233E] border border-slate-700/80 text-slate-100'
                  : 'bg-cyan-600 text-slate-950 font-medium rounded-br-none shadow-cyan-900/30'
              }`}>
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 text-[11px] opacity-75">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {isBot ? 'CampusMind AI' : 'You'}
                    </span>
                    {isBot && categoryBadge && (
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadge.className}`}>
                        {categoryBadge.label}
                      </span>
                    )}
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <div className="text-sm leading-relaxed">
                  {isBot ? (
                    <MathMarkdown content={msg.text} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                </div>

                {/* Source Document Citation Badge */}
                {isBot && msg.sourceDocTitle && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Source: <strong className="text-white">{msg.sourceDocTitle}</strong></span>
                    </div>

                    {/* View Document Link */}
                    {msg.sourceDocId && (
                      <button
                        onClick={() => {
                          const matched = documents.find((d) => d.id === msg.sourceDocId || d.title === msg.sourceDocTitle);
                          if (matched) onViewDocument(matched);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Source Notice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Missing Info Warning */}
                {isBot && isNotFound && !msg.isError && msg.category === 'sathyabama' && msg.id !== 'welcome-msg' && (
                  <div className="mt-2.5 pt-2 border-t border-amber-800/40 flex items-center gap-2 text-xs text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Unverified claim avoided: Information not present in official university repository.</span>
                  </div>
                )}

                {/* Error Retry Option */}
                {msg.isError && msg.canRetry && (msg.failedQuery || lastFailedQuestion) && (
                  <div className="mt-3 pt-2 border-t border-rose-800/40 flex items-center justify-between">
                    <span className="text-xs text-rose-300">Click below to retry:</span>
                    <button
                      onClick={() => handleSendQuestion(msg.failedQuery || lastFailedQuestion!)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Question</span>
                    </button>
                  </div>
                )}

                {/* Contextual Follow-Up Learning Actions (Requirement 6) */}
                {isBot && !msg.isError && msg.id !== 'welcome-msg' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Actions:
                    </span>
                    <button
                      onClick={() => handleSendQuestion("Can you explain this more simply with an intuitive everyday analogy?")}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border border-slate-700 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Explain in simpler terms"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span>Explain more simply</span>
                    </button>
                    <button
                      onClick={() => handleSendQuestion("Please provide another worked example with step-by-step calculations.")}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border border-slate-700 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Show another example"
                    >
                      <BookOpen className="w-3 h-3 text-cyan-400" />
                      <span>Give another example</span>
                    </button>
                    <button
                      onClick={() => handleSendQuestion("Give me a practice question or numerical problem to test my understanding on this topic.")}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border border-slate-700 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Generate practice question"
                    >
                      <GraduationCap className="w-3 h-3 text-emerald-400" />
                      <span>Practice question</span>
                    </button>
                    <button
                      onClick={() => handleSendQuestion("Summarize the key takeaways of this answer in 3 concise bullet points.")}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border border-slate-700 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Summarize in bullets"
                    >
                      <ListFilter className="w-3 h-3 text-purple-400" />
                      <span>Summarize</span>
                    </button>
                    <button
                      onClick={() => handleToggleSpeak(msg.id, msg.text)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
                        speakingMsgId === msg.id
                          ? 'bg-rose-950/60 border-rose-700 text-rose-300 animate-pulse'
                          : 'bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border-slate-700'
                      }`}
                      title={speakingMsgId === msg.id ? "Stop reading aloud" : "Read answer aloud"}
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-rose-400" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          <span>Read Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Bot action footer: Copy, Feedback & Engine tag */}
                {isBot && msg.id !== 'welcome-msg' && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        {msg.engineUsed?.includes('gemini') ? '⚡ Gemini AI' : '🔍 Local Engine'}
                      </span>
                      {msg.confidenceScore !== undefined && msg.confidenceScore > 0 && (
                        <span className="text-[10px] text-cyan-400/80">
                          • {msg.confidenceScore}% confidence
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy answer"
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {/* Thumbs Feedback */}
                      <button
                        onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: 'up' }))}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                          feedbackGiven[msg.id] === 'up' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: 'down' }))}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                          feedbackGiven[msg.id] === 'down' ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Needs improvement"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isBot && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#15233E] border border-cyan-500/40 rounded-2xl p-4 shadow-lg text-slate-300 text-sm flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-cyan-300 font-semibold">Generating AI Answer...</span>
                <span className="text-slate-400 ml-1.5 hidden sm:inline">Thinking & structuring explanation</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar with prominent "Ask Assistant" button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuestion(input);
        }}
        className="p-3.5 bg-[#131F37] border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask an academic STEM question, coding problem, or Sathyabama notice..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-sm text-white placeholder-slate-400 transition-all outline-none"
        />

        <button
          type="submit"
          id="ask-assistant-button"
          data-testid="ask-assistant-button"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Ask Assistant</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
