import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotesSkeleton } from '../components/ui/SkeletonCard';
import { ErrorState } from '../components/ui/ErrorState';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/database';
import { playSave } from '../utils/sounds';
import { domains } from '../data/questionBank';
import type { StudyNote } from '../types';

/* ─── Easing ─────────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const itemSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   NOTES
   ═══════════════════════════════════════════════════════════════════════════ */
export function Notes() {

  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<StudyNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [domainId, setDomainId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const all = await db.notes.toArray();
      setNotes(all.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = (selectedDomain === 'all' ? notes : notes.filter(n => n.domainId === selectedDomain))
    .filter(n => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q));
    });

  const openNewNote = () => {
    setEditingNote(null); setTitle(''); setContent(''); setTags(''); setDomainId(1); setShowEditor(true);
  };

  const openEditNote = (note: StudyNote) => {
    setEditingNote(note); setTitle(note.title); setContent(note.content);
    setTags(note.tags.join(', ')); setDomainId(note.domainId); setShowEditor(true);
  };

  const saveNote = async () => {
    if (!title.trim() || !content.trim()) return;
    const now = Date.now();
    if (editingNote) {
      await db.notes.update(editingNote.id, {
        title: title.trim(), content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        domainId, updatedAt: now,
      });
    } else {
      await db.notes.add({
        id: uuidv4(), domainId, title: title.trim(), content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: now, updatedAt: now, isRevision: false,
      } as StudyNote);
    }
    await playSave();
    setShowEditor(false);
    loadNotes();
  };

  const deleteNote = async (id: string) => {
    await db.notes.delete(id);
    loadNotes();
  };

  if (loading) return <NotesSkeleton />;
  if (loadError) return <ErrorState message={loadError.message} onRetry={loadNotes} />;

  return (
    <div className="max-w-4xl mx-auto pb-8 relative">
      {/* Cyber-grid background */}
<div className="relative z-10">
        <motion.div
          className="space-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ═══ HUD HEADER ═══ */}
          <motion.div variants={itemSlide} className="relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 opacity-[0.06] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 relative">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#4facfe] rounded-xl opacity-20 blur-md animate-breathe" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#4facfe] rounded-xl opacity-40 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">◇</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tw-text-primary tracking-tight">Notes</h1>
                  <p className="text-[11px] text-white/70 mt-0.5 font-mono tracking-wide">
                    <span className="text-[#00f2fe]">$</span> notes <span className="text-white/70">--count</span> <span className="text-[#ffb800]">{filteredNotes.length}</span>
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0,242,254,0.1)' }}
                whileTap={SPRING_TAP}
                onClick={openNewNote}
                className="relative group px-4 py-2.5 rounded-xl text-xs font-mono font-medium overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 text-white flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Note
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* ═══ SEARCH + DOMAIN FILTERS ═══ */}
          <motion.div variants={itemSlide} className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/70 font-mono">◇</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-[#0d1222]/90 backdrop-blur-sm border border-[#1e2840]/80 text-[#8892a9] rounded-lg pl-7 pr-3 py-1.5 text-[11px] font-mono focus:outline-none focus:border-[#00f2fe]/50 placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={SPRING_TAP}
              onClick={() => setSelectedDomain('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all ${
                selectedDomain === 'all' ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_8px_rgba(0,242,254,0.08)]' : 'bg-[#0d1222]/90 backdrop-blur-sm text-white/70 border border-[#1e2840]/80 hover:border-[#2a3654]'
              }`}>All</motion.button>
            {domains.map(d => (
              <motion.button
                key={d.id}
                whileHover={{ scale: 1.03 }}
                whileTap={SPRING_TAP}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-all ${
                  selectedDomain === d.id ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_8px_rgba(0,242,254,0.08)]' : 'bg-[#0d1222]/90 backdrop-blur-sm text-white/70 border border-[#1e2840]/80 hover:border-[#2a3654]'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: d.color }} />
                D{d.id}
              </motion.button>
            ))}
          </div>
          </motion.div>

          {/* ═══ NOTE CARDS GRID ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredNotes.map((note, idx) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                whileHover={{ y: -2, borderColor: 'rgba(0,242,254,0.2)' }}
                className="tw-card p-5 cursor-pointer relative overflow-hidden group"
                onClick={() => openEditNote(note)}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold tw-text-primary truncate">{note.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#00f2fe] font-mono">D{note.domainId}</span>
                        <span className="text-[10px] text-white/70 font-mono">·</span>
                        <span className="text-[10px] text-white/70 font-mono">{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, color: '#ff6b6b' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 opacity-0 group-hover:opacity-100 transition-all text-sm rounded hover:bg-[#ff6b6b]/10"
                    >
                      ✕
                    </motion.button>
                  </div>
                  <p className="text-xs text-[#8892a9] line-clamp-3 mt-2 leading-relaxed">{note.content}</p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {note.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#080b14] text-white/70 border border-[#1e2840]/60 font-mono">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="col-span-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="tw-card p-12 text-center"
                >
                  <div className="relative w-12 h-12 mx-auto mb-3">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#ff007f] rounded-full opacity-20 blur-md animate-breathe" />
                    <span className="relative text-2xl block text-center text-white/70">◇</span>
                  </div>
                  <p className="text-white/70 text-sm font-mono">
                    No notes yet.{' '}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={SPRING_TAP}
                      onClick={openNewNote}
                      className="text-[#00f2fe] hover:underline font-mono bg-transparent"
                    >
                      Create one?
                    </motion.button>
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══ EDITOR MODAL ═══ */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="tw-card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-5 bg-[#00f2fe] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors" placeholder="Note title..." />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Domain</label>
                  <select value={domainId} onChange={e => setDomainId(Number(e.target.value))}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors">
                    {domains.map(d => <option key={d.id} value={d.id}>D{d.id}: {d.shortName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Content</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} rows={8}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors resize-none" placeholder="Write your notes here..." />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 font-mono mb-1.5 block tracking-wider">Tags (comma separated)</label>
                  <input value={tags} onChange={e => setTags(e.target.value)}
                    className="w-full bg-[#080b14] border border-[#1e2840]/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 transition-colors" placeholder="e.g., cryptography, risk management" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1e2840]/80">
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(0,242,254,0.2)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2.5 bg-[#080b14] text-[#8892a9] border border-[#1e2840]/80 rounded-lg text-xs font-mono hover:text-white transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(0,242,254,0.1)' }}
                  whileTap={SPRING_TAP}
                  onClick={saveNote}
                  className="relative group px-5 py-2.5 rounded-lg text-xs font-mono font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-white flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Notes;
