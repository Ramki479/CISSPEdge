import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUserProgress, updateUserProgress, db } from '../data';
import { ErrorState } from '../components/ui/ErrorState';
import { NotificationSettingRow } from '../components/ui/NotificationSettingRow';
import { useTheme } from '../components/ThemeProvider';
import type { PreparationLevel, UserProgress } from '../types';

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
   SETTINGS
   ═══════════════════════════════════════════════════════════════════════════ */
export function Settings() {

  const [progress, setProgress] = useState<UserProgress | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [showReset, setShowReset] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'confirming' | 'resetting' | 'done' | 'error'>('idle');
  const [resetError, setResetError] = useState<string | null>(null);

  const resetAllData = async () => {
    try {
      setResetStatus('resetting');
      setResetError(null);

      // Clear all IndexedDB tables
      await Promise.all([
        db.progress.clear(),
        db.testSessions.clear(),
        db.answers.clear(),
        db.flashcards.clear(),
        db.notes.clear(),
        db.studyPlans.clear(),
        db.dailyChallenges.clear(),
        db.questions.clear(),
      ]);

      // Clear all localStorage keys
      const lsKeys = [
        'cissp-skill-assessments',
        'cissp-notifications',
        'cissp-backup',
        'cissp-theme',
        'answers_migrated_v1',
      ];
      for (const key of lsKeys) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
      }

      setResetStatus('done');

      // Show success briefly, then navigate
      setTimeout(() => {
        navigate('/onboarding');
      }, 1200);
    } catch (err) {
      setResetStatus('error');
      setResetError(err instanceof Error ? err.message : 'Failed to reset data');
    }
  };
  const [showBackup, setShowBackup] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminder: true,
    streakAlerts: true,
    flashcardReview: true,
    studyGoalAlerts: true,
  });
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const p = await getUserProgress();
      setProgress(p);
      // Load notification settings from localStorage
      try {
        const saved = localStorage.getItem('cissp-notifications');
        if (saved) setNotificationSettings(JSON.parse(saved));
      } catch {}
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const changeLevel = async (level: PreparationLevel) => {
    await updateUserProgress({ level });
    setProgress(prev => prev ? { ...prev, level } : prev);
  };

  const backupData = async () => {
    try {
      setBackupStatus('Creating backup...');
      const data: Record<string, any> = {};
      data.progress = await db.progress.toArray();
      data.testSessions = await db.testSessions.toArray();
      data.flashcards = await db.flashcards.toArray();
      data.notes = await db.notes.toArray();
      data.studyPlans = await db.studyPlans.toArray();
      data.skillAssessments = localStorage.getItem('cissp-skill-assessments');
      data.notifications = localStorage.getItem('cissp-notifications');
      data.version = 1;
      data.backedUpAt = new Date().toISOString();
      
      const json = JSON.stringify(data, null, 2);
      localStorage.setItem('cissp-backup', json);
      
      // Also trigger download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cissp-edge-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setBackupStatus('Backup complete! File downloaded.');
      setTimeout(() => setBackupStatus(null), 3000);
    } catch (err) {
      setBackupStatus('Backup failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const restoreData = async () => {
    try {
      setRestoreStatus('Select a backup file...');
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) { setRestoreStatus(null); return; }
        setRestoreStatus('Restoring data...');
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.progress) {
          await db.progress.clear();
          await db.progress.bulkAdd(data.progress);
        }
        if (data.testSessions) {
          await db.testSessions.clear();
          await db.testSessions.bulkAdd(data.testSessions);
        }
        if (data.flashcards) {
          await db.flashcards.clear();
          await db.flashcards.bulkAdd(data.flashcards);
        }
        if (data.notes) {
          await db.notes.clear();
          await db.notes.bulkAdd(data.notes);
        }
        if (data.studyPlans) {
          await db.studyPlans.clear();
          await db.studyPlans.bulkAdd(data.studyPlans);
        }
        if (data.skillAssessments) {
          localStorage.setItem('cissp-skill-assessments', data.skillAssessments);
        }
        if (data.notifications) {
          localStorage.setItem('cissp-notifications', data.notifications);
        }
        
        setRestoreStatus('Data restored! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      };
      input.click();
    } catch (err) {
      setRestoreStatus('Restore failed: ' + (err instanceof Error ? err.message : 'Invalid backup file'));
    }
  };

  const updateNotificationSetting = async (key: string, value: boolean) => {
    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);
    try {
      localStorage.setItem('cissp-notifications', JSON.stringify(updated));
    } catch {}
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const LEVELS: PreparationLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  if (loadError) {
    return <ErrorState message={loadError.message} onRetry={() => { setLoadError(null); loadData(); }} />;
  }

  return (
    <div className="max-w-3xl mx-auto pb-8 relative">
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#4a5168] to-transparent rounded-full blur-3xl animate-float-delayed" />
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4a5168] to-[#2a3654] rounded-xl opacity-20 blur-md animate-breathe" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#4a5168] to-[#2a3654] rounded-xl opacity-40 flex items-center justify-center">
                  <span className="text-sm font-bold text-white font-mono">⚙</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold tw-text-primary tracking-tight">Settings</h1>
                <p className="text-[11px] text-white/70 mt-0.5 font-mono tracking-wide">
                  <span className="text-[#00f2fe]">$</span> settings <span className="text-white/70">--config</span> <span className="text-[#00f2fe]">--profile</span> <span className="text-white/70">--theme</span> <span className="text-[#ffb800]">{theme}</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* ═══ PROFILE SECTION ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-5 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#00f2fe] rounded-full" />
                <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Profile</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-white/70 font-mono mb-2 tracking-wider uppercase">Preparation Level</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LEVELS.map(level => (
                      <motion.button
                        key={level}
                        whileHover={{ scale: 1.03 }}
                        whileTap={SPRING_TAP}
                        onClick={() => changeLevel(level)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono capitalize transition-all flex-shrink-0 ${
                          progress?.level === level
                            ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_8px_rgba(0,242,254,0.08)]'
                            : 'bg-[#080b14] text-white/70 border border-[#1e2840]/60 hover:border-[#2a3654]'
                        }`}>
                        {level === 'intermediate' ? 'intermediate' : level}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {[
                    { label: 'XP', value: `${progress?.totalXp || 0}`, color: '#00f2fe' },
                    { label: 'Streak', value: `${progress?.streak || 0}d`, color: '#ffb800' },
                    { label: 'Badges', value: `${progress?.badges.length || 0}`, color: '#10b981' },
                    { label: 'Started', value: formatDate(progress?.onboardingDate), color: '#8892a9' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-lg bg-[#080b14]/80 border border-[#1e2840]/60">
                      <p className="text-[10px] text-white/70 font-mono mb-0.5">{s.label}</p>
                      <p className="text-sm font-bold font-mono tabular-nums" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ APPEARANCE SECTION ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-5 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ffb800] to-[#ff6b00] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#ffb800] rounded-full" />
                <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Appearance</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-mono">Theme</p>
                  <p className="text-[10px] text-white/70 font-mono mt-0.5">Dark / Light mode toggle</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={SPRING_TAP}
                  onClick={toggleTheme}
                  className={`relative group px-5 py-2.5 rounded-xl text-xs font-mono font-medium overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-[#0d1222]/80 border border-[#1e2840]/80'
                      : 'bg-[#ffb800]/10 border border-[#ffb800]/20'
                  }`}
                >
                  <div className={`absolute inset-0 transition-opacity ${
                    theme === 'dark' ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-20' : 'bg-gradient-to-r from-[#ffb800] to-[#ff6b00] opacity-30'
                  }`} />
                  <span className={`relative z-10 flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-[#00f2fe]' : 'text-[#ffb800]'
                  }`}>
                    {theme === 'dark' ? '◉ Light' : '◉ Dark'}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ═══ AUDIO SECTION ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-5 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10b981] to-[#00f2fe] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#10b981] rounded-full" />
                <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide">Audio</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-mono">Sound Effects</p>
                  <p className="text-[10px] text-white/70 font-mono mt-0.5">Card flip, correct answer, note save tones</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={SPRING_TAP}
                  onClick={async () => {
                    const newValue = progress?.soundEnabled === false;
                    await updateUserProgress({ soundEnabled: newValue });
                    setProgress(prev => prev ? { ...prev, soundEnabled: newValue } : prev);
                  }}
                  className={`relative px-5 py-2.5 rounded-xl text-xs font-mono font-medium overflow-hidden transition-all ${
                    progress?.soundEnabled !== false
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 shadow-[0_0_8px_rgba(16,185,129,0.08)]'
                      : 'bg-[#080b14] text-white/70 border border-[#1e2840]/80 hover:border-[#2a3654]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {progress?.soundEnabled !== false ? (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5H4a1 1 0 00-1 1v5a1 1 0 001 1h2.5l4 4V4.5l-4 4z" />
                      </svg> On</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg> Off</>
                    )}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ═══ BACKUP & RESTORE SECTION ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-5 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10b981] to-[#00f2fe] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#10b981] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Backup & Restore</h2>
              </div>
              <p className="text-[10px] text-white/70 font-mono mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Export your data as a JSON file or restore from a previous backup.
              </p>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 8px rgba(16,185,129,0.15)' }}
                  whileTap={SPRING_TAP}
                  onClick={backupData}
                  className="relative group px-4 py-2 rounded-lg text-[10px] font-mono font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#10b981] to-[#00f2fe] opacity-80 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-white flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Backup
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(0,242,254,0.3)' }}
                  whileTap={SPRING_TAP}
                  onClick={restoreData}
                  className="px-4 py-2 bg-[#080b14] text-[#8892a9] border border-[#1e2840]/80 rounded-lg text-[10px] font-mono hover:text-white hover:border-[#2a3654] transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Restore Backup
                  </span>
                </motion.button>
              </div>
              {backupStatus && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-[#10b981] font-mono mt-2"
                >
                  ◆ {backupStatus}
                </motion.p>
              )}
              {restoreStatus && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-[#ffb800] font-mono mt-2"
                >
                  ◈ {restoreStatus}
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* ═══ NOTIFICATIONS SECTION ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-5 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ffb800] to-[#ff6b00] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#ffb800] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Notifications</h2>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'dailyReminder', label: 'Daily Practice Reminder', desc: 'Get reminded to practice daily' },
                  { key: 'streakAlerts', label: 'Streak Alerts', desc: 'Warn when you are about to lose your streak' },
                  { key: 'flashcardReview', label: 'Flashcard Review', desc: 'Remind you of due flashcards' },
                  { key: 'studyGoalAlerts', label: 'Study Goal Alerts', desc: 'Track progress against your study plan' },
                ].map(({ key, label, desc }) => (
                  <NotificationSettingRow
                    key={key}
                    label={label}
                    description={desc}
                    enabled={notificationSettings[key as keyof typeof notificationSettings]}
                    onToggle={() => updateNotificationSetting(key, !notificationSettings[key as keyof typeof notificationSettings])}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ═══ SECURITY & PRIVACY SECTION ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-5 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#6366F1] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Security & Privacy</h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#080b14]/80 border border-[#1e2840]/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white font-mono">Local-Only Storage</p>
                      <p className="text-[10px] text-white/70 font-mono mt-0.5">All data stored locally via IndexedDB. No data leaves this device.</p>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                      <span className="text-[10px] text-[#10b981]">✓</span>
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#080b14]/80 border border-[#1e2840]/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white font-mono">No Telemetry</p>
                      <p className="text-[10px] text-white/70 font-mono mt-0.5">No usage tracking, analytics, or data collection of any kind.</p>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                      <span className="text-[10px] text-[#10b981]">✓</span>
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#080b14]/80 border border-[#1e2840]/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white font-mono">Privacy Policy</p>
                      <p className="text-[10px] text-white/70 font-mono mt-0.5">CISSP Edge is fully offline. No data processed by external servers.</p>
                    </div>
                    <span className="text-[10px] text-[#00f2fe] font-mono">◆ Private</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ DATA SECTION (Reset) ═══ */}
          <motion.div variants={itemSlide}>
            <div className="tw-card p-5 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(0,242,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff6b6b] to-[#ff007f] opacity-30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#ff6b6b] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">Danger Zone</h2>
              </div>
              <p className="text-[10px] text-white/70 font-mono mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b]" />
                Irreversible actions. Backup your data first.
              </p>
              {resetStatus === 'done' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30"
                >
                  <span className="text-sm text-[#10b981]">✓</span>
                  <p className="text-[10px] text-[#10b981] font-mono">All data reset successfully. Redirecting to onboarding...</p>
                </motion.div>
              ) : resetStatus === 'error' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-2 p-3 rounded-lg bg-[#ff6b6b]/10 border border-[#ff6b6b]/30"
                >
                  <p className="text-[10px] text-[#ff6b6b] font-mono flex items-center gap-1.5">
                    <span className="text-xs">⚠</span>
                    Reset failed: {resetError || 'Unknown error'}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={SPRING_TAP}
                    onClick={() => { setResetStatus('idle'); setShowReset(false); }}
                    className="px-3 py-1.5 bg-[#080b14] text-[#8892a9] border border-[#1e2840]/80 rounded-lg text-[10px] font-mono hover:text-white"
                  >
                    Dismiss
                  </motion.button>
                </motion.div>
              ) : resetStatus === 'resetting' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#ffb800]/10 border border-[#ffb800]/30"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-sm text-[#ffb800]"
                  >◈</motion.span>
                  <p className="text-[10px] text-[#ffb800] font-mono">Clearing all data...</p>
                </motion.div>
              ) : !showReset ? (
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,107,107,0.3)' }}
                  whileTap={SPRING_TAP}
                  onClick={() => setShowReset(true)}
                  className="px-4 py-2 bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/30 rounded-lg text-[10px] font-mono hover:bg-[#ff6b6b]/20 transition-all"
                >
                  Reset All Data
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 p-3 rounded-lg bg-[#ff6b6b]/5 border border-[#ff6b6b]/20"
                >
                  <p className="text-[10px] text-[#ff6b6b] font-mono flex items-center gap-1.5">
                    <span className="text-xs">⚠</span>
                    This will permanently delete all progress. Cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={SPRING_TAP}
                      onClick={() => setShowReset(false)}
                      className="px-4 py-2 bg-[#080b14] text-[#8892a9] border border-[#1e2840]/80 rounded-lg text-[10px] font-mono hover:text-white hover:border-[#2a3654] transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={SPRING_TAP}
                      onClick={resetAllData}
                      className="px-4 py-2 bg-[#ff6b6b] text-white rounded-lg text-[10px] font-mono hover:bg-[#ff6b6b]/90 transition-all shadow-[0_0_10px_rgba(255,107,107,0.2)]"
                    >
                      Reset Everything
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ═══ ABOUT SECTION ═══ */}
          <motion.div variants={itemSlide}>
            <div className="bg-[#0d1222]/90 backdrop-blur-sm rounded-xl border border-[#1e2840]/80 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#ff007f] opacity-15" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#4a5168] rounded-full" />
                <h2 className="text-sm font-semibold text-white font-mono tracking-wide">About</h2>
              </div>
              <div className="space-y-1 text-[10px] text-white/70 font-mono leading-relaxed">
                <p className="text-white/70">CISSP Edge <span className="text-[#00f2fe]">v2.0</span></p>
                <p>Offline CISSP Preparation Platform</p>
                <p>Built for security professionals by security professionals</p>
                <p>React + TypeScript + Tailwind CSS + Framer Motion</p>
                <p className="mt-2 text-[#00f2fe]/60">Fully offline · IndexedDB · Zero telemetry</p>
                <p className="text-[10px] text-[#1e2840] mt-1">◉ 21 skill areas · 400+ questions · SM-2 spaced repetition</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Settings;
