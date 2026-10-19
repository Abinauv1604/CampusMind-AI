import React from 'react';
import { X, Calendar, MapPin, Building2, ExternalLink, MessageSquare, FileText, Share2, Check, ShieldCheck, Download, Hash } from 'lucide-react';
import { CollegeNotice, CollegeDocument } from '../types';

interface NoticeDetailModalProps {
  notice: CollegeNotice | null;
  onClose: () => void;
  onAskAboutNotice: (notice: CollegeNotice) => void;
  documents: CollegeDocument[];
  onViewDocument: (doc: CollegeDocument) => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  notice,
  onClose,
  onAskAboutNotice,
  documents,
  onViewDocument
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!notice) return null;

  const handleShare = () => {
    const textToShare = `${notice.title}\nDate: ${notice.date}\nSource: ${notice.sourceWebsite || notice.department}\n${notice.originalUrl ? `Official Link: ${notice.originalUrl}\n` : ''}\n${notice.description}`;
    navigator.clipboard.writeText(textToShare);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const relatedDoc = notice.documentRefId 
    ? documents.find((d) => d.id === notice.documentRefId) 
    : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131F37] border border-cyan-500/30 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-[#0B132B] rounded-t-2xl gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                notice.priority === 'urgent'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : notice.priority === 'important'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {notice.priority}
              </span>
              <span className="text-xs font-semibold text-cyan-400">
                {notice.category}
              </span>
              {notice.isOfficial ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Official SIST Verified
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  Demonstration Record
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">
              {notice.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Metadata pill grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[10px] uppercase">Published Date</span>
              <span className="text-white font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {notice.date}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[10px] uppercase">Department</span>
              <span className="text-white font-medium flex items-center gap-1 truncate" title={notice.department}>
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {notice.department}
              </span>
            </div>

            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase">Source Portal</span>
              <span className="text-white font-medium flex items-center gap-1 truncate" title={notice.sourceWebsite || 'Sathyabama Portal'}>
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {notice.sourceWebsite || 'Sathyabama Official Portal'}
              </span>
            </div>
          </div>

          {/* Verification & Canonical Source Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verification Status: <strong className="text-emerald-400 uppercase">{notice.verificationStatus || 'VERIFIED'}</strong>
              </span>
              {notice.lastVerified && (
                <span className="text-[10px]">Last verified: {new Date(notice.lastVerified).toLocaleDateString()}</span>
              )}
            </div>

            {notice.contentHash && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <Hash className="w-3 h-3 text-cyan-400" />
                <span>Canonical Hash: {notice.contentHash}</span>
              </div>
            )}

            {/* Direct Official Link & PDF Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {notice.originalUrl && (
                <a
                  href={notice.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Official Notice Page</span>
                </a>
              )}

              {notice.pdfUrl && (
                <a
                  href={notice.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official PDF {notice.fileSize ? `(${notice.fileSize})` : ''}</span>
                </a>
              )}
            </div>
          </div>

          {/* Full description */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Official Announcement Details</h4>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
              {notice.fullDetails || notice.description}
            </div>
          </div>

          {/* Related Document Reference */}
          {relatedDoc && (
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-slate-300 font-medium">Related Policy Document:</span>
                  <p className="text-white font-semibold text-xs">{relatedDoc.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onViewDocument(relatedDoc);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-semibold text-[11px] shrink-0 cursor-pointer"
              >
                Inspect
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B132B] rounded-b-2xl flex items-center justify-between text-xs">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share Notice'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onAskAboutNotice(notice);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI About This Notice</span>
          </button>
        </div>

      </div>
    </div>
  );
};
