import { motion } from 'framer-motion';

/* ─── Skeleton ──────────────────────────────────────────────────────────────
 * A pulsing placeholder that mimics content while data loads.
 * ------------------------------------------------------------------------- */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
  /** Additional inline styles merged into the element. */
  style?: React.CSSProperties;
}

const pulse = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.2, 0.5],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
};

export function Skeleton({ width, height, rounded = 'rounded-lg', className = '', style }: SkeletonProps) {
  return (
    <motion.div
      variants={pulse}
      initial="initial"
      animate="animate"
      className={`bg-gradient-to-r from-[#1e2840]/80 via-[#2a3654]/60 to-[#1e2840]/80 ${rounded} ${className}`}
      style={{
        width: typeof width === 'number' ? width : width,
        height: typeof height === 'number' ? height : height,
        ...style,
      }}
    />
  );
}
