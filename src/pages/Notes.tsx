import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/database';
import { domains } from '../data/questionBank';
import type { StudyNote } from '../types';

export function Notes() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<StudyNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [domainId, setDomainId] = useState(1);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const all = await db.notes.toArray();
    setNotes(all.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const filteredNotes = selectedDomain === 'all'
    ? notes
    : notes.filter(n => n.domainId === selectedDomain);

  const openNewNote = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTags('');
    setDomainId(1);
    setShowEditor(true);
  };

  const openEditNote = (note: StudyNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(', '));
    setDomainId(note.domainId);
    setShowEditor(true);
  };

  const saveNote = async () => {
    if (!title.trim() || !content.trim()) return;
    const now = Date.now();
    if (editingNote) {
      await db.notes.update(editingNote.id, {
        title: title.trim(),
        content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        domainId,
        updatedAt: now,
      });
    } else {
      const newNote: StudyNote = {
        id: uuidv4(),
        domainId,
        title: title.trim(),
        content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: now,
        updatedAt: now,
        isRevision: false,
      };
      await db.notes.add(newNote);
    }
    setShowEditor(false);
    loadNotes();
  };

  const deleteNote = async (id: string) => {
    await db.notes.delete(id);
    loadNotes();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Notes</h1>
        <button
          onClick={openNewNote}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
        >
          + New Note
        </button>
      </div>

      {/* Domain filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedDomain('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedDomain === 'all' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-surface-card text-text-muted border border-border hover:border-border-hover'
          }`}
        >
          All
        </button>
        {domains.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDomain(d.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedDomain === d.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
            }`}
          >
            D{d.id}
          </button>
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card rounded-2xl border border-border p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingNote ? 'Edit Note' : 'New Note'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Note title..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Domain</label>
                <select
                  value={domainId}
                  onChange={e => setDomainId(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>Domain {d.id}: {d.shortName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={8}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Write your notes here..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Tags (comma separated)</label>
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., cryptography, risk management"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditor(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredNotes.map(note => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-card rounded-xl border border-border p-5 cursor-pointer hover:border-border-hover transition-all"
            onClick={() => openEditNote(note)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white">{note.title}</h3>
                <span className="text-xs text-indigo-400">Domain {note.domainId}</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                className="text-gray-500 hover:text-red-400 transition-all"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-400 line-clamp-3 mt-2">{note.content}</p>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {note.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">#{t}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3">
              {new Date(note.updatedAt).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
        {filteredNotes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No notes yet. Create your first study note!
          </div>
        )}
      </div>
    </div>
  );
}
