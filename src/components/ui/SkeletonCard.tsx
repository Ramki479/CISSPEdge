import { motion } from 'framer-motion';
import { Skeleton } from './Skeleton';

/* ─── Helper: Shimmer Bar ────────────────────────────────────────────────── */
function Bar({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Skeleton
      className={className}
      width={style.width as string | number | undefined}
      height={style.height as string | number | undefined}
      style={style}
    />
  );
}

/* ─── Card wrapper ───────────────────────────────────────────────────────── */
function Card({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="tw-card overflow-hidden">
      {accent && <div className="h-[2px] bg-gradient-to-r from-[#00f2fe]/20 via-[#ff007f]/10 to-transparent" />}
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INDIVIDUAL SKELETON EXPORTS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Mimics the dashboard stat card layout (4-column grid). */
export function StatCardSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map(i => (
        <Card key={i} accent>
          <Bar className="mb-2" style={{ width: '60%', height: 10 }} />
          <Bar className="mb-1" style={{ width: '40%', height: 24 }} />
          <Bar style={{ width: '100%', height: 3, marginTop: 12 }} />
        </Card>
      ))}
    </div>
  );
}

/** Mimics a domain progress card with a title bar, progress bar, and badges. */
export function DomainCardSkeleton() {
  return (
    <Card accent>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Bar style={{ width: 10, height: 10, borderRadius: '50%' }} />
          <Bar style={{ width: 140, height: 14 }} />
        </div>
        <Bar style={{ width: 48, height: 14 }} />
      </div>
      <Bar className="mb-2.5" style={{ width: '100%', height: 3 }} />
      <div className="flex gap-2">
        <Bar style={{ width: 80, height: 20, borderRadius: 999 }} />
        <Bar style={{ width: 64, height: 20, borderRadius: 999 }} />
      </div>
    </Card>
  );
}

/** Mimics a table row with N rows of data. */
export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-2">
        <Bar style={{ flex: 2, height: 12 }} />
        <Bar style={{ flex: 1, height: 12 }} />
        <Bar style={{ flex: 1, height: 12 }} />
        <Bar style={{ flex: 1, height: 12 }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2" style={{ flex: 2 }}>
            <Bar style={{ width: 8, height: 8, borderRadius: '50%' }} />
            <Bar style={{ width: '60%', height: 10 }} />
          </div>
          <Bar style={{ flex: 1, height: 10 }} />
          <Bar style={{ flex: 1, height: 10 }} />
          <Bar style={{ flex: 1, height: 10 }} />
        </div>
      ))}
    </div>
  );
}

/** Mimics a flashcard front face. */
export function FlashcardSkeleton() {
  return (
    <div
      className="tw-card overflow-hidden relative"
      style={{ minHeight: 380 }}
    >
      <div className="h-[2px] bg-gradient-to-r from-[#00f2fe] via-[#ff007f] to-[#ffb800] opacity-40" />
      <div className="p-8 flex flex-col h-full min-h-[378px]">
        <div className="flex items-center gap-2 mb-4">
          <Bar style={{ width: 48, height: 18, borderRadius: 999 }} />
          <Bar style={{ width: 40, height: 18, borderRadius: 999 }} />
        </div>
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="space-y-3 w-full max-w-md">
            <Bar style={{ width: '90%', height: 14 }} />
            <Bar style={{ width: '75%', height: 14 }} />
            <Bar style={{ width: '60%', height: 14 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mimics a note list item. */
export function NoteRowSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <Bar style={{ width: '60%', height: 14 }} />
          <div className="flex items-center gap-1.5 mt-0.5">
            <Bar style={{ width: 32, height: 10 }} />
            <Bar style={{ width: 48, height: 10 }} />
          </div>
        </div>
      </div>
      <div className="space-y-1.5 mt-3">
        <Bar style={{ width: '100%', height: 10 }} />
        <Bar style={{ width: '85%', height: 10 }} />
      </div>
      <div className="flex gap-1 mt-3">
        <Bar style={{ width: 48, height: 16, borderRadius: 999 }} />
        <Bar style={{ width: 64, height: 16, borderRadius: 999 }} />
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE-LEVEL SKELETONS (composition of the above)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Dashboard page skeleton. */
export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto pb-8 relative"
    >
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bar style={{ width: 36, height: 36, borderRadius: 12 }} />
          <div>
            <Bar style={{ width: 160, height: 20 }} />
            <Bar className="mt-1" style={{ width: 120, height: 11 }} />
          </div>
          <div className="ml-auto flex gap-2">
            <Bar style={{ width: 100, height: 32, borderRadius: 12 }} />
            <Bar style={{ width: 80, height: 32, borderRadius: 12 }} />
          </div>
        </div>

        {/* Stat cards */}
        <StatCardSkeleton />

        {/* Quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <Card key={i}>
              <Bar style={{ width: 24, height: 24, borderRadius: 6 }} />
              <Bar className="mt-2" style={{ width: '70%', height: 14 }} />
              <Bar className="mt-1" style={{ width: '50%', height: 11 }} />
            </Card>
          ))}
        </div>

        {/* Domain cards */}
        {[0, 1, 2].map(i => (
          <DomainCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
}

/** Analytics page skeleton. */
export function AnalyticsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto pb-8 relative"
    >
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bar style={{ width: 36, height: 36, borderRadius: 12 }} />
          <div>
            <Bar style={{ width: 140, height: 20 }} />
            <Bar className="mt-1" style={{ width: 180, height: 11 }} />
          </div>
        </div>

        {/* Readiness card */}
        <Card accent>
          <div className="flex items-center justify-between">
            <div>
              <Bar style={{ width: 100, height: 10 }} />
              <Bar className="mt-1.5" style={{ width: 80, height: 32 }} />
            </div>
            <Bar style={{ width: 80, height: 80, borderRadius: '50%' }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1e2840]/80">
            {[0, 1, 2].map(i => (
              <div key={i} className="text-center">
                <Bar className="mx-auto mb-1" style={{ width: 48, height: 20 }} />
                <Bar className="mx-auto" style={{ width: 60, height: 11 }} />
              </div>
            ))}
          </div>
        </Card>

        {/* Domain list */}
        {[0, 1, 2, 3].map(i => (
          <DomainCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
}

/** Flashcards page skeleton. */
export function FlashcardsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto pb-8 relative"
    >
      <div className="relative z-10 space-y-5">
        {/* Header + stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-3">
            <Bar style={{ width: 36, height: 36, borderRadius: 12 }} />
            <div>
              <Bar style={{ width: 140, height: 20 }} />
              <Bar className="mt-1" style={{ width: 200, height: 11 }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <Bar key={i} style={{ width: 72, height: 28, borderRadius: 12 }} />
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Bar style={{ flex: 1, maxWidth: 200, height: 32, borderRadius: 8 }} />
          <Bar style={{ width: 120, height: 32, borderRadius: 8 }} />
          <Bar style={{ width: 80, height: 32, borderRadius: 8 }} />
          <Bar style={{ width: 80, height: 32, borderRadius: 8 }} />
        </div>

        {/* Flashcard */}
        <FlashcardSkeleton />
      </div>
    </motion.div>
  );
}

/** Notes page skeleton. */
export function NotesSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto pb-8 relative"
    >
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bar style={{ width: 36, height: 36, borderRadius: 12 }} />
            <div>
              <Bar style={{ width: 100, height: 20 }} />
              <Bar className="mt-1" style={{ width: 140, height: 11 }} />
            </div>
          </div>
          <Bar style={{ width: 100, height: 36, borderRadius: 12 }} />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Bar style={{ flex: 1, maxWidth: 200, height: 32, borderRadius: 8 }} />
          {[0, 1, 2, 3, 4].map(i => (
            <Bar key={i} style={{ width: 48, height: 32, borderRadius: 8 }} />
          ))}
        </div>

        {/* Note cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => (
            <NoteRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** StudyPlanner page skeleton. */
export function StudyPlannerSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto pb-8 relative"
    >
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bar style={{ width: 36, height: 36, borderRadius: 12 }} />
            <div>
              <Bar style={{ width: 160, height: 20 }} />
              <Bar className="mt-1" style={{ width: 180, height: 11 }} />
            </div>
          </div>
          <Bar style={{ width: 110, height: 36, borderRadius: 12 }} />
        </div>

        {/* Countdown hero */}
        <Card>
          <div className="text-center">
            <Bar className="mx-auto mb-2" style={{ width: 80, height: 48 }} />
            <Bar className="mx-auto mb-3" style={{ width: 120, height: 10 }} />
            <Bar className="mx-auto" style={{ width: 240, height: 14 }} />
          </div>
        </Card>

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card accent>
            <Bar style={{ width: 100, height: 14 }} />
            <div className="space-y-2 mt-4">
              {[0, 1, 2].map(i => (
                <Bar key={i} style={{ width: '100%', height: 60, borderRadius: 8 }} />
              ))}
            </div>
          </Card>
          <Card accent>
            <Bar style={{ width: 120, height: 14 }} />
            <div className="space-y-2 mt-4">
              {[0, 1, 2].map(i => (
                <Bar key={i} style={{ width: '100%', height: 56, borderRadius: 8 }} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

/** KnowledgeMap page skeleton. */
export function KnowledgeMapSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto pb-8 relative"
    >
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bar style={{ width: 36, height: 36, borderRadius: 12 }} />
          <div>
            <Bar style={{ width: 180, height: 20 }} />
            <Bar className="mt-1" style={{ width: 240, height: 11 }} />
          </div>
        </div>

        {/* Domain grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <DomainCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** QuestionReview page skeleton. */
export function QuestionReviewSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto pb-8 relative"
    >
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bar style={{ width: 36, height: 36, borderRadius: 12 }} />
          <div>
            <Bar style={{ width: 200, height: 20 }} />
            <Bar className="mt-1" style={{ width: 260, height: 11 }} />
          </div>
        </div>

        {/* Stat cards */}
        <StatCardSkeleton />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card accent>
              <Bar style={{ width: 100, height: 14 }} />
              <div className="space-y-1.5 mt-3">
                {[0, 1, 2, 3].map(i => (
                  <Bar key={i} style={{ width: '100%', height: 52, borderRadius: 8 }} />
                ))}
              </div>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-3">
            {[0, 1, 2].map(i => (
              <Card key={i} accent>
                <Bar className="mb-2" style={{ width: '100%', height: 14 }} />
                <Bar className="mb-3" style={{ width: '75%', height: 14 }} />
                <div className="space-y-1">
                  {[0, 1, 2, 3].map(j => (
                    <Bar key={j} style={{ width: '100%', height: 32, borderRadius: 8 }} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
