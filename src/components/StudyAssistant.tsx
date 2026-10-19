import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  ListOrdered, 
  HelpCircle, 
  Copy, 
  Check, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lightbulb,
  Cpu
} from 'lucide-react';
import { StudyQuestion, StudyResult, SystemStatus } from '../types';
import { SAMPLE_STUDY_NOTES } from '../data/sampleData';
import { processStudyNotes } from '../services/api';
import { MathMarkdown } from './MathMarkdown';

interface StudyAssistantProps {
  status: SystemStatus;
  openSetupGuide: () => void;
}

export const StudyAssistant: React.FC<StudyAssistantProps> = ({
  status,
  openSetupGuide
}) => {
  const [notesText, setNotesText] = useState(SAMPLE_STUDY_NOTES[0].content);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<'summarize' | 'extract_points' | 'quiz' | null>('summarize');
  const [result, setResult] = useState<StudyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Interactive Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  const handleRunAction = async (action: 'summarize' | 'extract_points' | 'quiz') => {
    if (!notesText.trim() || notesText.trim().length < 15) {
      setErrorMessage('Please enter or paste at least a few sentences of study notes to analyze.');
      return;
    }

    setActiveAction(action);
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedAnswers({});
    setShowExplanations({});

    try {
      const res = await processStudyNotes(notesText.trim(), action);
      setResult(res);
    } catch (err: any) {
      console.error('Study Assistant processing error:', err);
      setErrorMessage(err.message || 'Unable to process study notes. Please check the text and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    let contentToCopy = '';
    if (result.summary) contentToCopy = result.summary;
    else if (result.keyPoints) contentToCopy = result.keyPoints.join('\n\n');
    else if (result.questions) {
      contentToCopy = result.questions.map((q, idx) => 
        `Q${idx + 1}: ${q.question}\n${q.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}\nAnswer: ${q.options[q.correctAnswerIndex]}\nExplanation: ${q.explanation}`
      ).join('\n\n');
    }

    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = notesText.trim() ? notesText.trim().split(/\s+/).length : 0;
  const charCount = notesText.length;

  const score = result?.questions
    ? Object.entries(selectedAnswers).reduce((acc, [qIdx, ansIdx]) => {
        const question = result.questions![Number(qIdx)];
        return question && question.correctAnswerIndex === ansIdx ? acc + 1 : acc;
      }, 0)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131F37] border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Smart Study Assistant</h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              status.hasGeminiKey
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {status.hasGeminiKey ? '⚡ Gemini 3.8 Flash' : '🔍 Extractive Parser (Zero-Cost Free Tier)'}
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl">
            Paste any textbook excerpt or lecture notes. Use the buttons below to generate an executive summary, extract key study points, or test yourself with 5 practice questions.
          </p>
        </div>

        {/* Engine status indicator button */}
        <button
          onClick={openSetupGuide}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 shrink-0"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Setup Gemini API</span>
        </button>
      </div>

      {/* Main Grid: Notes Input on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Notes Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#131F37] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Pasted Study Notes</span>
              </label>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} chars</span>
              </div>
            </div>

            {/* Quick Preset Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Quick Load Sample Notes:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_STUDY_NOTES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNotesText(sample.content);
                      setResult(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Textarea */}
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Paste your lecture notes, textbook chapters, or revision material here..."
              rows={12}
              className="w-full p-3.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-normal leading-relaxed resize-none transition-all outline-none"
            />

            {/* Actions Bar */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                
                {/* Button 1: Summarize */}
                <button
                  onClick={() => handleRunAction('summarize')}
                  disabled={isLoading || !notesText.trim()}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    activeAction === 'summarize' && result
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Summarize Notes</span>
                </button>

                {/* Button 2: Extract Key Points */}
                <button
                  onClick={() => handleRunAction('extract_points')}
                  disabled={isLoading || !notesText.trim()}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    activeAction === 'extract_points' && result
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Extract Key Points</span>
                </button>

                {/* Button 3: Generate 5 Practice Questions */}
                <button
                  onClick={() => handleRunAction('quiz')}
                  disabled={isLoading || !notesText.trim()}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    activeAction === 'quiz' && result
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Generate 5 Questions</span>
                </button>
              </div>

              {/* Clear button */}
              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <span>Free-tier compliant • Fast local heuristics</span>
                <button
                  onClick={() => {
                    setNotesText('');
                    setResult(null);
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  Clear Notes
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Output / Result Panel */}
        <div className="lg:col-span-7">
          <div className="bg-[#131F37] border border-slate-800 rounded-2xl p-5 sm:p-6 min-h-[460px] flex flex-col justify-between shadow-xl">
            
            {/* Results Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">
                    {activeAction === 'summarize' && '📝 Study Summary'}
                    {activeAction === 'extract_points' && '💡 Essential Key Points'}
                    {activeAction === 'quiz' && '🎯 5 Practice Questions (Interactive)'}
                    {!activeAction && 'Output Preview'}
                  </h3>
                  {result && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {result.engineUsed === 'gemini-3.8-flash' ? '⚡ Gemini 3.8 Flash' : '🔍 Extractive Heuristics'}
                    </span>
                  )}
                </div>

                {result && (
                  <button
                    onClick={handleCopyResult}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700/80 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Output</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Engine Transparency Notice */}
              <div className="mb-4 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    {status.hasGeminiKey
                      ? 'AI Engine active: Generating generative responses using official Gemini 3.8 Flash model.'
                      : 'Free-tier heuristic engine active. To connect Google Gemini API, add GEMINI_API_KEY in .env.'}
                  </span>
                </div>
                {!status.hasGeminiKey && (
                  <button
                    onClick={openSetupGuide}
                    className="text-cyan-400 hover:underline font-semibold shrink-0"
                  >
                    How to connect →
                  </button>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-cyan-300 font-medium">
                    {activeAction === 'summarize' && 'Generating structured executive summary...'}
                    {activeAction === 'extract_points' && 'Extracting core concepts and definitions...'}
                    {activeAction === 'quiz' && 'Drafting 5 targeted practice questions...'}
                  </p>
                  <p className="text-xs text-slate-500">Processing input text against algorithmic heuristics</p>
                </div>
              )}

              {/* Error State */}
              {errorMessage && !isLoading && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/50 text-rose-200 text-xs sm:text-sm space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-rose-300">Request Error</h4>
                      <p className="text-slate-300">{errorMessage}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setErrorMessage(null)}
                      className="px-3 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-900 text-rose-200 text-xs font-semibold transition-colors"
                    >
                      Dismiss
                    </button>
                    {activeAction && (
                      <button
                        onClick={() => handleRunAction(activeAction)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Empty / Initial State */}
              {!isLoading && !result && !errorMessage && (
                <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-3 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">No output generated yet</h4>
                  <p className="text-xs max-w-sm text-slate-400">
                    Select one of the sample notes or paste your own, then click <strong>Summarize Notes</strong>, <strong>Extract Key Points</strong>, or <strong>Generate 5 Questions</strong>.
                  </p>
                  <button
                    onClick={() => handleRunAction('summarize')}
                    className="mt-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Run Summarize Now
                  </button>
                </div>
              )}

              {/* Result 1: Summary */}
              {!isLoading && result && result.action === 'summarize' && result.summary && (
                <div className="space-y-4">
                  <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 text-sm text-slate-200 leading-relaxed font-normal">
                    <MathMarkdown content={result.summary} />
                  </div>
                  {result.notice && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{result.notice}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Result 2: Key Points */}
              {!isLoading && result && result.action === 'extract_points' && result.keyPoints && (
                <div className="space-y-3">
                  <div className="grid gap-2.5">
                    {result.keyPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <MathMarkdown content={point} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result 3: Practice Questions (Interactive Quiz) */}
              {!isLoading && result && result.action === 'quiz' && result.questions && (
                <div className="space-y-5">
                  
                  {/* Quiz Score Tracker */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-300">
                      Answered: <strong>{Object.keys(selectedAnswers).length}</strong> of {result.questions.length} questions
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-cyan-400 font-mono">
                        Score: {score} / {result.questions.length}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedAnswers({});
                          setShowExplanations({});
                        }}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {result.questions.map((q, qIdx) => {
                      const selectedIdx = selectedAnswers[qIdx];
                      const hasAnswered = selectedIdx !== undefined;
                      const isCorrect = hasAnswered && selectedIdx === q.correctAnswerIndex;

                      return (
                        <div
                          key={qIdx}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-white leading-snug">
                              <span className="text-cyan-400 mr-1.5">Q{qIdx + 1}.</span>
                              {q.question}
                            </h4>
                            {hasAnswered && (
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                isCorrect
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}>
                                {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            )}
                          </div>

                          {/* Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selectedIdx === optIdx;
                              const isThisCorrect = optIdx === q.correctAnswerIndex;

                              let buttonStyle = 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700';

                              if (hasAnswered) {
                                if (isThisCorrect) {
                                  buttonStyle = 'bg-emerald-950/70 text-emerald-200 border-emerald-600';
                                } else if (isThisSelected && !isThisCorrect) {
                                  buttonStyle = 'bg-rose-950/70 text-rose-200 border-rose-600';
                                } else {
                                  buttonStyle = 'bg-slate-800/40 text-slate-500 border-slate-800';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={hasAnswered}
                                  onClick={() => {
                                    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                                    setShowExplanations((prev) => ({ ...prev, [qIdx]: true }));
                                  }}
                                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${buttonStyle}`}
                                >
                                  <span className="font-mono font-bold text-[11px] opacity-75 shrink-0">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span className="leading-snug">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Toggle / Accordion */}
                          {hasAnswered && (
                            <div className="pt-2 border-t border-slate-800/80">
                              <p className="text-xs text-slate-300">
                                <strong className="text-cyan-400">Explanation: </strong>
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Footer tips */}
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Ready for hackathon presentations</span>
              <span className="text-slate-500">Fast, reproducible, and offline-ready</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
