import { motion } from 'framer-motion';

/* ─── Easing ─────────────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } };

/* ─── ErrorState ─────────────────────────────────────────────────────────── */
interface ErrorStateProps {
  /** Error message to display. */
  message?: string;
  /** Callback fired when the user clicks Retry. */
  onRetry?: () => void;
  /** Optional title override. Defaults to 'Error Loading Data'. */
  title?: string;
}

export function ErrorState({
  message = 'Something went wrong while loading this content.',
  onRetry,
  title = 'Error Loading Data',
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="max-w-lg mx-auto py-16 relative"
    >
      {/* Cyber-grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,254,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,254,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-[#ff007f] rounded-xl opacity-20 blur-md animate-breathe" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-[#ff007f] rounded-xl opacity-40 flex items-center justify-center">
            <span className="text-xl font-bold text-white font-mono">!</span>
          </div>
        </div>

        <h2 className="text-sm font-semibold tw-text-primary font-mono tracking-wide mb-2">
          {title}
        </h2>
        <p className="text-[11px] text-white/70 font-mono leading-relaxed mb-6">
          {message}
        </p>

        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0,242,254,0.15)' }}
            whileTap={SPRING_TAP}
            onClick={onRetry}
            className="relative group px-5 py-2.5 rounded-xl text-xs font-mono font-medium overflow-hidden inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 text-white flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
