import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Globe,
  Radio,
  FileText,
  CornerDownLeft,
  RefreshCw,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';
import { CollegeDocument, SystemStatus } from '../types';
import { askCampusChat } from '../services/api';
import { MathMarkdown } from './MathMarkdown';
import {
  VoiceState,
  VoiceLanguage,
  SUPPORTED_VOICE_LANGUAGES,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  isMicrophoneSupported,
  isSecureVoiceContext,
  ClassifiedVoiceError,
  VoiceSessionController,
  sanitizeTextForSpeech,
  parseVoiceCommand,
  findBestVoice
} from '../utils/voiceUtils';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sourceDocTitle?: string;
  sourceDocId?: string;
  found?: boolean;
  engineUsed?: string;
  isVoiceInput?: boolean;
  isCommand?: boolean;
  commandLabel?: string;
  category?: string;
}

interface CampusMindVoiceProps {
  documents: CollegeDocument[];
  status: SystemStatus;
  onNavigateTab: (tab: 'dashboard' | 'chat' | 'voice' | 'study' | 'notices' | 'documents') => void;
  onViewDocument: (doc: CollegeDocument) => void;
  openSetupGuide?: () => void;
}

export const CampusMindVoice: React.FC<CampusMindVoiceProps> = ({
  documents,
  status,
  onNavigateTab,
  onViewDocument,
  openSetupGuide
}) => {
  // Voice engine & session state
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>('en-IN');
  const [autoSpeakAnswer, setAutoSpeakAnswer] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);

  // Transcript state
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [textFallbackInput, setTextFallbackInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Installed Voices state
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceCapabilityNote, setVoiceCapabilityNote] = useState<string | null>(null);

  // Voice Command recognition feedback
  const [recognizedCommandAlert, setRecognizedCommandAlert] = useState<{
    label: string;
    targetTab?: string;
  } | null>(null);

  // Conversation history
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'voice-welcome',
      sender: 'bot',
      text: 'Welcome to CampusMind Voice! Tap the microphone and ask any question about Sathyabama examination timetables, 80% attendance regulations, CGPA scales, or campus circulars. You can also say commands like "Open Notice Finder" or "Open Study Assistant".',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      found: true,
      engineUsed: status.hasGeminiKey ? 'gemini-3.8-flash' : 'local-extractive'
    }
  ]);

  // Controller and UI refs
  const controllerRef = useRef<VoiceSessionController | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detailed error classification
  const [classifiedError, setClassifiedError] = useState<ClassifiedVoiceError | null>(null);

  // Capabilities
  const hasRecognitionSupport = isSpeechRecognitionSupported();
  const hasSynthesisSupport = isSpeechSynthesisSupported();
  const hasMicrophoneSupport = isMicrophoneSupported();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceState]);

  // Initialize or update VoiceSessionController when language or props change
  useEffect(() => {
    controllerRef.current = new VoiceSessionController({
      onStart: () => {
        setVoiceState('listening');
        setClassifiedError(null);
        setErrorMessage(null);
      },
      onInterim: (text) => {
        setInterimTranscript(text);
      },
      onFinal: (text) => {
        setFinalTranscript((prev) => (prev ? `${prev} ${text}` : text));
        setInterimTranscript('');
      },
      onError: (err) => {
        setClassifiedError(err);
        setErrorMessage(err.message);
        if (err.isFatal) {
          setVoiceState('error');
        } else {
          setVoiceState('ready');
        }
      },
      onEnd: () => {
        setVoiceState((prev) => (prev === 'listening' ? 'ready' : prev));
      },
      getLanguage: () => selectedLanguage
    });

    return () => {
      controllerRef.current?.stop();
    };
  }, [selectedLanguage]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (!hasSynthesisSupport) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      const voiceMatch = findBestVoice(voices, selectedLanguage);
      if (selectedLanguage === 'ta-IN' && !voiceMatch.hasVoiceForLanguage) {
        setVoiceCapabilityNote(voiceMatch.statusNote || null);
      } else {
        setVoiceCapabilityNote(null);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [hasSynthesisSupport, selectedLanguage]);

  // Stop any active recognition or speech on unmount
  useEffect(() => {
    return () => {
      stopListeningCleanly();
      stopSpeakingCleanly();
    };
  }, []);

  const stopSpeakingCleanly = () => {
    if (hasSynthesisSupport) {
      window.speechSynthesis.cancel();
    }
    setActiveSpeakingMsgId(null);
    if (voiceState === 'speaking') {
      setVoiceState('ready');
    }
  };

  const stopListeningCleanly = () => {
    if (controllerRef.current) {
      controllerRef.current.stop();
    }
    if (voiceState === 'listening') {
      setVoiceState('ready');
    }
  };

  // Toggle Microphone / Start Speech Recognition (Triggered strictly by user click)
  const handleToggleListening = async () => {
    // If currently listening, clicking the mic stops listening cleanly
    if (voiceState === 'listening' || controllerRef.current?.getIsActive()) {
      stopListeningCleanly();
      return;
    }

    // Stop active speech playback so mic doesn't catch AI's own audio
    stopSpeakingCleanly();

    setErrorMessage(null);
    setClassifiedError(null);
    setInterimTranscript('');
    setFinalTranscript('');
    setRecognizedCommandAlert(null);

    if (controllerRef.current) {
      await controllerRef.current.toggleListening();
    }
  };

  // Submit recognized transcript or manual text to Campus AI
  const handleSubmitQuery = async (queryText?: string) => {
    const rawText = queryText !== undefined ? queryText : (finalTranscript || interimTranscript || textFallbackInput);
    const trimmed = rawText.trim();
    if (!trimmed || voiceState === 'processing') return;

    // Stop any listening or speech
    stopListeningCleanly();
    stopSpeakingCleanly();

    // Check for deterministic voice command first
    const commandMatch = parseVoiceCommand(trimmed);
    if (commandMatch.isCommand) {
      if (commandMatch.commandType === 'navigate' && commandMatch.targetTab) {
        setRecognizedCommandAlert({
          label: commandMatch.label || 'Voice Command',
          targetTab: commandMatch.targetTab
        });

        // Add to history
        const cmdMsg: VoiceMessage = {
          id: `cmd-${Date.now()}`,
          sender: 'user',
          text: trimmed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isVoiceInput: true,
          isCommand: true,
          commandLabel: commandMatch.label
        };

        const replyMsg: VoiceMessage = {
          id: `reply-${Date.now()}`,
          sender: 'bot',
          text: commandMatch.feedbackText || 'Command executed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          found: true,
          engineUsed: 'system'
        };

        setMessages((prev) => [...prev, cmdMsg, replyMsg]);
        setFinalTranscript('');
        setInterimTranscript('');
        setTextFallbackInput('');

        // Smooth navigation delay so user sees feedback
        setTimeout(() => {
          if (commandMatch.targetTab) {
            onNavigateTab(commandMatch.targetTab);
          }
        }, 850);
        return;
      }

      if (commandMatch.commandType === 'stop_speaking') {
        stopSpeakingCleanly();
        setFinalTranscript('');
        setInterimTranscript('');
        return;
      }

      if (commandMatch.commandType === 'cancel_listening') {
        stopListeningCleanly();
        setFinalTranscript('');
        setInterimTranscript('');
        return;
      }

      if (commandMatch.commandType === 'clear_conversation') {
        handleClearConversation();
        setFinalTranscript('');
        setInterimTranscript('');
        return;
      }
    }

    // Regular question: Add User Message
    const userMsg: VoiceMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoiceInput: Boolean(finalTranscript || interimTranscript)
    };

    setMessages((prev) => [...prev, userMsg]);
    setFinalTranscript('');
    setInterimTranscript('');
    setTextFallbackInput('');
    setErrorMessage(null);
    setVoiceState('processing');

    try {
      // Build conversation history for API (last 8 turns)
      const historyForApi = messages
        .filter((m) => m.id !== 'voice-welcome' && !m.isCommand)
        .slice(-8)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.text
        }));

      // Call existing /api/chat endpoint
      const response = await askCampusChat(trimmed, documents, historyForApi);

      const botMsg: VoiceMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceDocTitle: response.sourceDocTitle,
        sourceDocId: response.sourceDocId,
        found: response.found,
        engineUsed: response.engineUsed,
        category: response.category
      };

      setMessages((prev) => [...prev, botMsg]);
      setVoiceState('ready');

      // Auto-read aloud if user explicitly enabled it
      if (autoSpeakAnswer && hasSynthesisSupport) {
        speakResponse(botMsg.id, response.answer);
      }
    } catch (err: any) {
      console.error('[CampusMind Voice] Error asking Campus AI:', err);
      const errMsg: VoiceMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ Notice: ${err.message || 'Unable to connect to campus AI service'}. Please check your connection or retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        found: false,
        engineUsed: 'local-extractive'
      };
      setMessages((prev) => [...prev, errMsg]);
      setVoiceState('ready');
    }
  };

  // Play spoken answer using SpeechSynthesis
  const speakResponse = (messageId: string, textToSpeak: string) => {
    if (!hasSynthesisSupport) {
      setErrorMessage('Speech synthesis is not supported on this browser.');
      return;
    }

    // If currently speaking this message, stop
    if (activeSpeakingMsgId === messageId) {
      stopSpeakingCleanly();
      return;
    }

    // Stop active listening to avoid mic feedback
    stopListeningCleanly();
    window.speechSynthesis.cancel();

    const spokenText = sanitizeTextForSpeech(textToSpeak);
    if (!spokenText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = selectedLanguage;

      const voiceInfo = findBestVoice(availableVoices, selectedLanguage);
      if (voiceInfo.voice) {
        utterance.voice = voiceInfo.voice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setActiveSpeakingMsgId(messageId);
        setVoiceState('speaking');
      };

      utterance.onend = () => {
        setActiveSpeakingMsgId(null);
        setVoiceState('ready');
      };

      utterance.onerror = (e) => {
        console.warn('[CampusMind Voice] Speech synthesis error:', e);
        setActiveSpeakingMsgId(null);
        setVoiceState('ready');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[CampusMind Voice] Failed to speak utterance:', err);
      setActiveSpeakingMsgId(null);
      setVoiceState('ready');
    }
  };

  const handleClearConversation = () => {
    stopListeningCleanly();
    stopSpeakingCleanly();
    setMessages([
      {
        id: `voice-welcome-${Date.now()}`,
        sender: 'bot',
        text: 'Conversation cleared. Tap the microphone or type below to ask a new question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        found: true,
        engineUsed: status.hasGeminiKey ? 'gemini-3.8-flash' : 'local-extractive'
      }
    ]);
    setFinalTranscript('');
    setInterimTranscript('');
    setTextFallbackInput('');
    setErrorMessage(null);
    setRecognizedCommandAlert(null);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPromptQuestions = [
    'What is the 80% attendance policy?',
    'Explain the 10-point CGPA grading scale and passing marks',
    'Open Notice Finder',
    'Are continuous assessment CAE exam timetables released?',
    'What are the passing requirements in End Semester Exams?',
    'Open Study Assistant'
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111C35] to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 text-xs font-semibold">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Voice-Controlled Assistant</span>
              </span>
              <span className="text-xs text-slate-400">
                • Mode: <strong className="text-white">{status.hasGeminiKey ? 'Gemini 3.8 Flash Grounded' : 'Local Extractive RAG'}</strong>
              </span>
              <span className="text-xs text-slate-400">
                • Target: <strong className="text-cyan-300">Sathyabama Official Portal</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>CampusMind Voice</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Hands-free voice queries and deterministic voice commands grounded strictly in official university notices, examination circulars, and academic regulations.
            </p>
          </div>

          {/* Controls: Language Selector & Audio Settings */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  stopListeningCleanly();
                  setSelectedLanguage(e.target.value as VoiceLanguage);
                }}
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium text-xs pr-1"
                title="Select Speech Recognition and Speech Synthesis language"
              >
                {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-Speak Toggle */}
            <button
              onClick={() => {
                if (autoSpeakAnswer && voiceState === 'speaking') {
                  stopSpeakingCleanly();
                }
                setAutoSpeakAnswer(!autoSpeakAnswer);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                autoSpeakAnswer
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically read AI responses aloud using speech synthesis"
            >
              {autoSpeakAnswer ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>Auto-Read: {autoSpeakAnswer ? 'ON' : 'OFF'}</span>
            </button>

            {/* Clear Conversation */}
            <button
              onClick={handleClearConversation}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700 cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tamil voice capability explanation note if Tamil TTS is missing */}
        {voiceCapabilityNote && selectedLanguage === 'ta-IN' && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-200 flex items-start gap-2 animate-in fade-in duration-150">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Tamil Voice Capability Status:</p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                {voiceCapabilityNote}
              </p>
            </div>
          </div>
        )}

        {/* Recognized Voice Command Alert Banner */}
        {recognizedCommandAlert && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
              <span className="font-medium">
                Voice Command Recognized: <strong className="text-white font-semibold">"{recognizedCommandAlert.label}"</strong> — Navigating...
              </span>
            </div>
            {recognizedCommandAlert.targetTab && (
              <button
                onClick={() => recognizedCommandAlert.targetTab && onNavigateTab(recognizedCommandAlert.targetTab as any)}
                className="text-[11px] underline text-emerald-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                Go now <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Error Feedback Banner with Detailed Recovery Instructions */}
        {(errorMessage || classifiedError) && (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-in fade-in duration-150 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <p className="font-bold text-rose-300 text-sm">
                  {classifiedError?.title || 'Voice Assistant Notice'}
                </p>
                <p className="font-medium text-rose-200 leading-relaxed">
                  {classifiedError?.message || errorMessage}
                </p>
                {classifiedError?.recovery && (
                  <p className="text-[11px] text-rose-300/90 leading-relaxed pt-0.5">
                    💡 <strong className="text-white">How to resolve:</strong> {classifiedError.recovery}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      textInputRef.current?.focus();
                      textInputRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-white font-medium text-[11px] border border-rose-700/60 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Use Text Chat Below</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleToggleListening()}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Retry Microphone</span>
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                setClassifiedError(null);
              }}
              className="text-xs text-rose-400 hover:text-white underline shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Primary Voice Interaction Hub */}
      <div className="bg-[#131F37] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden space-y-5">
        
        {/* Visual Pulse Rings depending on state */}
        <div className="relative flex items-center justify-center">
          {voiceState === 'listening' && (
            <>
              <div className="absolute w-36 h-36 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
              <div className="absolute w-28 h-28 rounded-full bg-cyan-500/25 animate-pulse pointer-events-none" />
            </>
          )}

          {voiceState === 'speaking' && (
            <>
              <div className="absolute w-36 h-36 rounded-full bg-purple-500/20 animate-ping pointer-events-none" />
              <div className="absolute w-28 h-28 rounded-full bg-blue-500/25 animate-pulse pointer-events-none" />
            </>
          )}

          {voiceState === 'processing' && (
            <div className="absolute w-32 h-32 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin pointer-events-none" />
          )}

          {/* Central Microphone / Stop Button */}
          <button
            onClick={handleToggleListening}
            disabled={voiceState === 'processing'}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start voice recognition'}
            className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-2xl cursor-pointer ${
              voiceState === 'listening'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/60 scale-105'
                : voiceState === 'speaking'
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/60'
                : voiceState === 'processing'
                ? 'bg-slate-800 text-cyan-400 cursor-wait'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/50 hover:scale-105'
            }`}
          >
            {voiceState === 'listening' ? (
              <Square className="w-8 h-8 fill-current text-white animate-pulse" />
            ) : voiceState === 'speaking' ? (
              <Volume2 className="w-9 h-9 text-white animate-bounce" />
            ) : voiceState === 'processing' ? (
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            ) : (
              <Mic className="w-9 h-9 text-white" />
            )}
          </button>
        </div>

        {/* State Label & Instructions */}
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                voiceState === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : voiceState === 'speaking'
                  ? 'bg-purple-400 animate-pulse'
                  : voiceState === 'processing'
                  ? 'bg-cyan-400 animate-spin'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs uppercase tracking-widest font-bold text-slate-300">
              State: {voiceState.toUpperCase()}
            </span>
          </div>

          <p className="text-base sm:text-lg font-bold text-white">
            {voiceState === 'listening' && 'Listening... Speak your university question now'}
            {voiceState === 'speaking' && 'Speaking answer aloud... Tap mic to ask next question'}
            {voiceState === 'processing' && 'CampusMind is analyzing official notices & regulations...'}
            {voiceState === 'ready' && 'Tap the microphone to speak, or use text below'}
            {voiceState === 'error' && 'Tap the microphone to retry voice recognition'}
          </p>

          <p className="text-xs text-slate-400">
            Language: <span className="text-cyan-300 font-medium">{SUPPORTED_VOICE_LANGUAGES.find(l => l.code === selectedLanguage)?.label}</span>
            {' • '}
            {hasRecognitionSupport ? 'Web Speech API active' : 'Recognition unavailable in this browser'}
          </p>
        </div>

        {/* Live Audio / Recognized Transcript Review Box */}
        {(interimTranscript || finalTranscript) && (
          <div className="w-full max-w-xl bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 text-left space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                Recognized Speech (Review or Edit Before Asking):
              </span>
              {voiceState === 'listening' && (
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Stream
                </span>
              )}
            </div>

            {/* Editable transcript textarea */}
            <textarea
              rows={2}
              value={finalTranscript || interimTranscript}
              onChange={(e) => setFinalTranscript(e.target.value)}
              placeholder="Your speech transcript will appear here..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setFinalTranscript('');
                  setInterimTranscript('');
                }}
                className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer"
              >
                Discard
              </button>

              <div className="flex items-center gap-2">
                {voiceState === 'listening' && (
                  <button
                    onClick={stopListeningCleanly}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Done Speaking
                  </button>
                )}
                <button
                  onClick={() => handleSubmitQuery()}
                  disabled={voiceState === 'processing'}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>Ask Campus AI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Voice Prompt / Command Pills */}
        <div className="w-full max-w-2xl pt-2">
          <p className="text-[11px] text-slate-400 mb-2 font-medium">Try saying these voice questions or commands:</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {quickPromptQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmitQuery(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs transition-colors cursor-pointer text-left truncate max-w-[280px] sm:max-w-none"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Conversation History Stream */}
      <div className="bg-[#131F37] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Voice Session Transcript & Verified Answers ({messages.length})
            </h2>
          </div>
          {messages.length > 1 && (
            <button
              onClick={handleClearConversation}
              className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            const isSpeakingThis = activeSpeakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  <span>{isBot ? 'CampusMind AI' : 'You (Voice/Text)'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.isVoiceInput && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[9px] flex items-center gap-0.5">
                      <Mic className="w-2.5 h-2.5" /> Voice
                    </span>
                  )}
                  {msg.isCommand && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[9px]">
                      Command: {msg.commandLabel}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-3xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                    isBot
                      ? 'bg-slate-900 border border-slate-800 text-slate-100'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium'
                  }`}
                >
                  {isBot ? (
                    <MathMarkdown content={msg.text} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Official Citation Badge for Bot Answers */}
                  {isBot && msg.sourceDocTitle && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-[11px] font-semibold">
                          Official Source: <strong className="text-white">{msg.sourceDocTitle}</strong>
                        </span>
                      </div>

                      {msg.sourceDocId && (
                        <button
                          onClick={() => {
                            const foundDoc = documents.find((d) => d.id === msg.sourceDocId);
                            if (foundDoc) onViewDocument(foundDoc);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
                        >
                          <span>Open Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Controls on Bot Message: Play Answer & Copy */}
                  {isBot && msg.id !== 'voice-welcome' && (
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        {hasSynthesisSupport && (
                          <button
                            onClick={() => speakResponse(msg.id, msg.text)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSpeakingThis
                                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                            }`}
                            title={isSpeakingThis ? 'Stop speaking this answer' : 'Listen to this answer'}
                          >
                            {isSpeakingThis ? (
                              <>
                                <Square className="w-3 h-3 fill-current text-white animate-pulse" />
                                <span>Stop Speaking</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-cyan-400" />
                                <span>Play Answer</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {msg.engineUsed || (status.hasGeminiKey ? 'Gemini 3.8 Flash' : 'Local RAG')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Fallback Input Bar */}
        <div className="pt-3 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitQuery(textFallbackInput);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={textInputRef}
                type="text"
                value={textFallbackInput}
                onChange={(e) => setTextFallbackInput(e.target.value)}
                placeholder="Or type your question here (fallback if microphone unavailable)..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!textFallbackInput.trim() || voiceState === 'processing'}
              className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                textFallbackInput.trim() && voiceState !== 'processing'
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          {/* Privacy & Browser Speech Notice */}
          <div className="mt-2.5 flex items-start gap-1.5 text-[10px] text-slate-400 leading-normal">
            <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Speech recognition uses your browser's native Web Speech API and requires an active internet connection. Audio is processed by the browser vendor; no raw microphone recordings or voice audio files are stored by CampusMind AI.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
