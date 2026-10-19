import React from 'react';
import { X, FileText, Calendar, Building2, MessageSquare, Download, Share2, Check } from 'lucide-react';
import { CollegeDocument } from '../types';

interface DocumentViewerModalProps {
  document: CollegeDocument | null;
  onClose: () => void;
  onAskAboutDoc: (doc: CollegeDocument) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onAskAboutDoc
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!document) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(`${document.title}\n\n${document.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131F37] border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-[#0B132B] rounded-t-2xl gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              {document.category}
            </span>
            <h2 className="text-lg font-bold text-white leading-snug">
              {document.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {document.department}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Last Updated: {document.lastUpdated}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
            {document.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B132B] rounded-b-2xl flex items-center justify-between text-xs">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share / Copy'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onAskAboutDoc(document);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI About This Document</span>
          </button>
        </div>

      </div>
    </div>
  );
};
