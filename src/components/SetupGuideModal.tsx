import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Key, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Cpu, 
  Terminal, 
  ShieldCheck,
  Award,
  Layers
} from 'lucide-react';
import { SystemStatus } from '../types';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  status
}) => {
  const [activeTab, setActiveTab] = useState<'ai_setup' | 'publish' | 'hackathon_pitch' | 'notice_aggregator'>('ai_setup');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131F37] border border-cyan-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0B132B] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base sm:text-lg">
                  CampusMind AI Setup & Deployment Guide
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Beginner Friendly
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Step-by-step instructions to connect Gemini API, notice aggregator cron, and publish your app.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-800 bg-[#0E172A] px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ai_setup')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'ai_setup'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1. Connect Gemini API</span>
          </button>

          <button
            onClick={() => setActiveTab('notice_aggregator')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'notice_aggregator'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Notice Aggregator & Cron</span>
          </button>

          <button
            onClick={() => setActiveTab('publish')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'publish'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3. Publish Live Website</span>
          </button>

          <button
            onClick={() => setActiveTab('hackathon_pitch')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'hackathon_pitch'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. Hackathon Demo Tips</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300">
          
          {/* TAB 1: AI Setup */}
          {activeTab === 'ai_setup' && (
            <div className="space-y-5">
              
              {/* Current Status Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.hasGeminiKey ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <div>
                    <span className="font-semibold text-white">Current Active Engine: </span>
                    <span className="text-cyan-300 font-mono">
                      {status.hasGeminiKey ? 'Google Gemini 3.8 Flash (Active)' : 'Local Extractive RAG (Zero-Cost Free Tier)'}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {status.hasGeminiKey ? 'Production AI Ready' : 'Offline / Standalone Ready'}
                </span>
              </div>

              {/* Step by Step instructions */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                  Get a Free Google Gemini API Key
                </h4>

                <div className="pl-8 space-y-3">
                  <p>
                    Google provides a generous <strong>100% Free Tier</strong> for developers through Google AI Studio without requiring a credit card or subscription:
                  </p>
                  
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                    <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold inline-flex items-center gap-1">Google AI Studio API Keys <ExternalLink className="w-3 h-3" /></a></li>
                    <li>Sign in with your Google Account.</li>
                    <li>Click <strong>"Create API key"</strong> and copy your key.</li>
                  </ol>
                </div>

                <h4 className="font-bold text-white text-base flex items-center gap-2 pt-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">2</span>
                  Add the Key to your Environment File
                </h4>

                <div className="pl-8 space-y-2">
                  <p>
                    Open your project's root folder and add this line inside your <code className="text-cyan-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">.env</code> file (or AI Studio Secrets):
                  </p>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs flex items-center justify-between">
                    <span className="text-cyan-300">GEMINI_API_KEY="AIzaSyYourActualKeyHere..."</span>
                    <button
                      onClick={() => handleCopy('env-key', 'GEMINI_API_KEY="YOUR_KEY_HERE"')}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Copy syntax"
                    >
                      {copiedKey === 'env-key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    🔒 <strong>Security Guarantee:</strong> The API key is ONLY read on the backend server (<code className="text-slate-300 font-mono">server.ts</code>) and is NEVER exposed to the frontend browser bundle.
                  </p>
                </div>

                <h4 className="font-bold text-white text-base flex items-center gap-2 pt-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">3</span>
                  How the Dual-Engine Works
                </h4>

                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-cyan-300">What happens if no API key is provided?</div>
                    <p className="text-slate-400">
                      The app uses its built-in <strong>Local Extractive RAG</strong> algorithm. It parses the verified sample college documents, matches keywords and n-grams, extracts accurate answers, and clearly rejects missing queries without crashing or pretending to have an AI connected.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Notice Aggregator & Cron */}
          {activeTab === 'notice_aggregator' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Official Notice Aggregation Engine
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Live Scraper Active
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  CampusMind AI is configured with an automated multi-source ingestion service that monitors 5 official Sathyabama Institute of Science and Technology web sources without manual data entry.
                </p>
              </div>

              {/* 5 Monitored Sources */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  5 Official Sources Monitored
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {[
                    { name: '1. University Portal (News & Results)', url: 'https://www.sathyabama.ac.in/' },
                    { name: '2. Research Announcements (Ph.D Circulars)', url: 'https://www.sathyabama.ac.in/research/announcements' },
                    { name: '3. Examination Timetables (COE)', url: 'https://www.sathyabama.ac.in/academics/time_table' },
                    { name: '4. Curriculum & Academic Regulations', url: 'https://www.sathyabama.ac.in/academics/curriculum-syllabus' },
                    { name: '5. SIST Server Notification Directory (CAE)', url: 'https://sist.sathyabama.ac.in/website/Notification/' }
                  ].map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-white font-sans text-xs">{s.name}</span>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]">
                        <span>{s.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Scheduler & External Cron */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  Scheduler & External Cron Configuration
                </h4>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-white">A. Built-in Background Timer (Default)</div>
                  <p className="text-slate-300">
                    While the Node.js server is online, it runs an automatic timer every 60 minutes (<code className="text-cyan-300 font-mono">SYNC_INTERVAL_MINUTES=60</code>). Deduplication is performed using canonical URLs and SHA-256 hashes, with records saved atomically to <code className="text-cyan-300 font-mono">data/notices_db.json</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-white">B. External Cron Job / Webhook Endpoint</div>
                  <p className="text-slate-300">
                    If hosting in a serverless or scale-to-zero environment (e.g. Google Cloud Run, Vercel, Render Free), configure a free cron service (like <strong>cron-job.org</strong> or <strong>Google Cloud Scheduler</strong>) to send a periodic HTTP POST request:
                  </p>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300 flex items-center justify-between gap-2 overflow-x-auto">
                    <code>curl -X POST https://YOUR_APP_URL/api/notices/sync -H "x-admin-token: YOUR_SECRET_KEY"</code>
                    <button
                      onClick={() => handleCopy('curl-sync', 'curl -X POST https://YOUR_APP_URL/api/notices/sync -H "x-admin-token: YOUR_SECRET_KEY"')}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white shrink-0"
                    >
                      {copiedKey === 'curl-sync' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-white">C. Security & Abuse Prevention</div>
                  <p className="text-slate-300">
                    Protect the synchronization endpoint against unauthorized spam by setting <code className="text-cyan-300 font-mono">SYNC_ADMIN_KEY="your_secure_password"</code> in your environment variables. The server also enforces a 10-second minimum cooldown on manual triggers.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Publish Website */}
          {activeTab === 'publish' && (
            <div className="space-y-5">
              <h4 className="font-bold text-white text-base">
                How to Host & Publish CampusMind AI 100% Free
              </h4>

              <div className="grid gap-4">
                
                {/* Method 1: Google Cloud Run */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Option A: Google Cloud Run (Recommended for AI Studio)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Zero Cost Free Tier
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    AI Studio automatically packages this applet as a container running Node.js and Express. You can directly share the public URL or click <strong>Deploy</strong> in the AI Studio header.
                  </p>
                </div>

                {/* Method 2: Render or Railway */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Option B: Render.com / Railway
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      Free Web Service
                    </span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-300">
                    <li>Push code to a GitHub repository: <code className="text-cyan-300 font-mono">git push origin main</code></li>
                    <li>Connect GitHub to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Render.com</a> and create a <strong>Web Service</strong>.</li>
                    <li>Build command: <code className="text-cyan-300 font-mono">npm run build</code></li>
                    <li>Start command: <code className="text-cyan-300 font-mono">npm run start</code></li>
                    <li>Add Environment Variable: <code className="text-cyan-300 font-mono">GEMINI_API_KEY</code></li>
                  </ol>
                </div>

                {/* Method 3: Vercel Static with Serverless */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Option C: Vercel
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      1-Click Deploy
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Import your repo into Vercel. Vite SPA is auto-detected. The client-side fallback ensures all search and study features work seamlessly even in static serverless deployments.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Hackathon Demo Pitch Tips */}
          {activeTab === 'hackathon_pitch' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-base">
                Hackathon Presentation & Demo Script
              </h4>

              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-blue-950/30 border border-cyan-800/40 space-y-2">
                <span className="font-bold text-cyan-300 uppercase tracking-wider text-xs">The 30-Second Elevator Pitch:</span>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed italic">
                  "College students struggle with fragmented notice boards, buried exam PDFs, and conflicting WhatsApp circulars. CampusMind AI is a unified academic assistant that lets students query campus policies with verified source citations, summarize notes into practice quizzes, and track urgent deadlines — all with zero risk of AI hallucination."
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-white text-xs">3 Tests to Impress the Judges:</span>
                
                <div className="grid gap-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <strong className="text-cyan-300">Test 1 (Policy Verification):</strong>
                    <p className="text-slate-400 mt-0.5">Ask: <em>"What is the minimum attendance requirement for exams?"</em> — Point out how the bot cites <strong>Academic Policy 2026</strong> as the official source.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <strong className="text-cyan-300">Test 2 (Strict Anti-Hallucination):</strong>
                    <p className="text-slate-400 mt-0.5">Ask: <em>"Is there free parking on campus for freshmen?"</em> — Show that the bot explicitly admits information could not be found, rather than making up a rule!</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <strong className="text-cyan-300">Test 3 (Active Learning Assistant):</strong>
                    <p className="text-slate-400 mt-0.5">Go to Study Assistant, click <em>"Generate 5 Questions"</em>, and take the interactive practice quiz live on screen.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B132B] rounded-b-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Built for College Hackathons • Clean, Beginner-Friendly Codebase</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors"
          >
            Got it, Let's Build!
          </button>
        </div>

      </div>
    </div>
  );
};
