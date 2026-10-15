import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { useApp } from '../../store';

const ICONS = {
  accent: { icon: Sparkles, cls: 'text-accent' },
  success: { icon: CheckCircle2, cls: 'text-success' },
  warning: { icon: AlertTriangle, cls: 'text-warning' },
  muted: { icon: Info, cls: 'text-ink3' },
};

export default function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-6 md:right-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, cls } = ICONS[t.tone] || ICONS.accent;
          return (
            <motion.button
              layout
              key={t.id}
              onClick={() => dismissToast(t.id)}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-surface2/95 px-4 py-3 text-left shadow-2xl backdrop-blur"
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${cls}`} />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-ink">{t.text}</span>
                {t.sub && <span className="block truncate text-xs text-ink3">{t.sub}</span>}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
