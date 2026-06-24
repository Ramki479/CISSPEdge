import { motion } from 'framer-motion';

const SPRING_TAP = { scale: 0.97, transition: { duration: 0.12 } };

interface NotificationSettingRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

export function NotificationSettingRow({ label, description, enabled, onToggle }: NotificationSettingRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
      <div className="min-w-0 flex-1 mr-3">
        <p className="text-xs text-[var(--color-text-primary)] font-mono truncate">{label}</p>
        <p className="text-[10px] text-[var(--color-text-secondary)] font-mono mt-0.5 line-clamp-1">{description}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${
          enabled ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
        }`}
        aria-label={`Toggle ${label}`}
        role="switch"
        aria-checked={enabled}
      >
        <motion.div
          animate={{ x: enabled ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
        />
      </motion.button>
    </div>
  );
}
