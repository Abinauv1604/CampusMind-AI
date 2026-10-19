import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  Building2, 
  Tag, 
  ExternalLink, 
  MessageSquare, 
  CheckCircle,
  Eye,
  Plus,
  X,
  Upload,
  Sparkles
} from 'lucide-react';
import { CollegeDocument } from '../types';

interface DocumentLibraryProps {
  documents: CollegeDocument[];
  onAskAboutDocument: (doc: CollegeDocument) => void;
  onViewDocument: (doc: CollegeDocument) => void;
  onAddDocument: (doc: CollegeDocument) => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  onAskAboutDocument,
  onViewDocument,
  onAddDocument
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New document form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Academic Policies');
  const [newDepartment, setNewDepartment] = useState('Office of Academic Affairs');
  const [newDate, setNewDate] = useState('2026-10-18');
  const [newTags, setNewTags] = useState('regulations, syllabus, grading');
  const [newContent, setNewContent] = useState('');

  const categories = [
    'All', 
    'Academic Policies', 
    'Exam Schedules', 
    'Events & Hackathons', 
    'Campus Facilities', 
    'Deadlines'
  ];

  const filtered = documents.filter((doc) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q) ||
      doc.department.toLowerCase().includes(q) ||
      doc.tags.some((t) => t.toLowerCase().includes(q));

    const matchesCategory = 
      selectedCategory === 'All' || 
      doc.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 1);

    const doc: CollegeDocument = {
      id: `doc-custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      lastUpdated: newDate,
      department: newDepartment.trim(),
      content: newContent.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['custom', 'policy'],
      isDemonstration: true
    };

    onAddDocument(doc);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-[#131F37] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">Institutional Knowledge Base</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} of {documents.length} Verified Documents
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Official institutional source documents referenced by the Campus AI Chatbot and Notice Finder. Shared single source of truth.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Upload Document</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across verified documents by topic, department, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#131F37] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No documents found matching "{search}"</h3>
          <p className="text-xs text-slate-400">Try adjusting your keywords or clearing the category filter.</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#131F37] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-md space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {doc.category}
                    </span>
                    {doc.isDemonstration && (
                      <span className="text-[10px] font-mono font-medium text-amber-300/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                        Demo Record
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {doc.lastUpdated}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {doc.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.department}</span>
                </div>

                {/* Snippet */}
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                  {doc.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => onViewDocument(doc)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Read Full Document</span>
                </button>

                <button
                  onClick={() => onAskAboutDocument(doc)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI About This</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131F37] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Upload className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-white text-base">Add Document to Knowledge Base</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sathyabama Hostel Leave & Curfew Guidelines 2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="Academic Policies">Academic Policies</option>
                    <option value="Exam Schedules">Exam Schedules</option>
                    <option value="Events & Hackathons">Events & Hackathons</option>
                    <option value="Deadlines">Deadlines</option>
                    <option value="Campus Facilities">Campus Facilities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Department / Issuing Authority</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. Directorate of Student Welfare"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. hostel, curfew, rules, outing pass"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Content * (Full text for AI Grounding)</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste official policy text, circular clauses, or regulations..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 outline-none resize-none font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
