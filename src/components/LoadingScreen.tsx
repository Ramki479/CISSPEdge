import { motion } from 'framer-motion';

/* ─── Easing tokens ─────────────────────────────────────────────────────── */
const EASE_OUT = [0.25, 1, 0.5, 1] as const;

/* ─── Variants ────────────────────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const pulseDot = {
  hidden: { scale: 0.6, opacity: 0.2 },
  visible: (i: number) => ({
    scale: [0.6, 1, 0.6],
    opacity: [0.2, 1, 0.2],
    transition: {
      delay: i * 0.15,
      duration: 1.4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

/* ─── LoadingScreen ──────────────────────────────────────────────────────── */

interface LoadingScreenProps {
  /** Number of shimmer blocks to render. Default 3. */
  count?: number;
  /** Optional label shown below the dots. */
  label?: string;
  /** Optional top-level className. */
  className?: string;
}

export function LoadingScreen({
  count = 3,
  label,
  className = '',
}: LoadingScreenProps) {
  return (
    <motion.div
      className={`max-w-6xl mx-auto relative ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Cyber-grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,254,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,254,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Animated status dots */}
        <div className="flex items-center justify-center gap-2 py-8">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              custom={i}
              variants={pulseDot}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-[#00f2fe] to-[#ff007f]"
            />
          ))}
        </div>

        {label && (
          <p className="text-center text-[11px] text-white/70 font-mono tracking-wide -mt-2 mb-4">
            {label}
          </p>
        )}

        {/* Shimmer cards */}
        {Array.from({ length: count }).map((_, blockIdx) => (
          <motion.div
            key={blockIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + blockIdx * 0.08, duration: 0.35, ease: EASE_OUT }}
            className="tw-card overflow-hidden"
          >
            {/* Accent line */}
            <div className="h-[2px] bg-gradient-to-r from-[#00f2fe]/20 via-[#ff007f]/10 to-transparent" />

            <div className="p-5 space-y-3">
              {/* Title bar shimmer */}
              <div className="flex items-center gap-3">
                <div className="shimmer w-8 h-8 rounded-lg" />
                <div className="shimmer h-4 w-40 rounded" />
                <div className="shimmer h-3 w-16 rounded ml-auto" />
              </div>

              {/* Content lines shimmer */}
              <div className="space-y-2 pl-11">
                <div className="shimmer h-3 w-full rounded" />
                <div className="shimmer h-3 w-3/4 rounded" />
              </div>

              {/* Bar shimmer */}
              <div className="shimmer h-2 w-full rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
