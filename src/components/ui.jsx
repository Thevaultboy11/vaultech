import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect } from 'react';

export const cx = (...c) => c.filter(Boolean).join(' ');

export function Card({ className, children, accent, onClick, as: As = 'div', ...rest }) {
  return (
    <As
      onClick={onClick}
      className={cx(
        'card relative',
        accent && 'before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[2px] before:rounded-full before:bg-accent',
        onClick && 'cursor-pointer transition hover:border-ink3/30 hover:bg-surface2/60',
        className
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

export function CardHeader({ title, icon: Icon, action, sub }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-ink3" />}
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>
        {sub && <p className="mt-0.5 text-xs text-ink3">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', className, icon: Icon, children, ...rest }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap';
  const sizes = { sm: 'h-7 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-sm' };
  const variants = {
    primary: 'bg-accent text-[#0B0B0F] hover:bg-accentHover shadow-[0_6px_20px_-8px_rgb(var(--accent)/0.6)]',
    soft: 'bg-accent/12 text-accent hover:bg-accent/20',
    ghost: 'text-ink2 hover:text-ink hover:bg-white/[0.05]',
    outline: 'border border-line text-ink2 hover:text-ink hover:border-ink3/40 bg-surface',
    danger: 'bg-danger/10 text-danger hover:bg-danger/20',
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, className, label, size = 16, ...rest }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-full text-ink3 transition hover:bg-white/[0.06] hover:text-ink',
        className
      )}
      {...rest}
    >
      <Icon size={size} />
    </button>
  );
}

export function Pill({ children, color, className, active, onClick }) {
  const style = color ? { color, backgroundColor: `${color}1A` } : undefined;
  return (
    <span
      onClick={onClick}
      style={style}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        !color && (active ? 'bg-accent/12 text-accent' : 'bg-white/[0.05] text-ink2'),
        onClick && 'cursor-pointer select-none',
        className
      )}
    >
      {children}
    </span>
  );
}

export function FilterChip({ active, children, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition',
        active ? 'border-accent/40 bg-accent/12 text-accent' : 'border-line text-ink2 hover:border-ink3/40 hover:text-ink'
      )}
    >
      {children}
      {count != null && <span className={cx('text-[10px]', active ? 'text-accent/80' : 'text-ink3')}>{count}</span>}
    </button>
  );
}

export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-bg p-0.5">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const Icon = o.icon;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full font-medium transition',
              size === 'sm' ? 'h-6 px-2.5 text-[11px]' : 'h-7 px-3 text-xs',
              value === v ? 'bg-surface2 text-ink shadow-soft' : 'text-ink3 hover:text-ink2'
            )}
          >
            {Icon && <Icon size={13} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Ring({ value = 0, size = 56, stroke = 5, color = 'rgb(var(--accent))', track = '#1F1F28', children, className }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cx('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

export function Progress({ value = 0, color, className, height = 6 }) {
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-line', className)} style={{ height }}>
      <div
        className={cx('h-full rounded-full', !color && 'bg-accent')}
        style={{
          width: `${Math.max(0, Math.min(100, value * 100))}%`,
          background: color,
          transition: 'width 500ms cubic-bezier(.2,.8,.2,1)',
        }}
      />
    </div>
  );
}

export function Check3({ checked, onChange, size = 18, label }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!checked);
      }}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition',
        checked ? 'border-accent bg-accent/20 text-accent' : 'border-ink3/50 text-transparent hover:border-accent/70 hover:bg-accent/10'
      )}
      style={{ width: size, height: size }}
    >
      <Check size={size - 7} strokeWidth={3} />
    </button>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx('relative h-5 w-9 rounded-full transition', checked ? 'bg-accent' : 'bg-line')}
    >
      <span
        className={cx(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
          checked ? 'left-[18px]' : 'left-0.5'
        )}
      />
    </button>
  );
}

export function Modal({ open, onClose, title, sub, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cx(
              'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl',
              width
            )}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">{title}</h2>
                {sub && <p className="mt-0.5 text-xs text-ink3">{sub}</p>}
              </div>
              <IconButton icon={X} label="Close" onClick={onClose} />
            </div>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="label">{title}</span>
              <IconButton icon={X} label="Close" onClick={onClose} />
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({ icon: Icon, title, text, cta, onCta, compact }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-xl border border-dashed border-line text-center', compact ? 'px-3 py-5' : 'px-6 py-10')}>
      {Icon && (
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent/12 text-accent">
          <Icon size={16} />
        </div>
      )}
      <p className="text-sm font-medium text-ink2">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-ink3">{text}</p>}
      {cta && (
        <Button size="sm" className="mt-4" onClick={onCta}>
          {cta}
        </Button>
      )}
    </div>
  );
}

export function Callout({ icon: Icon, children, tone = 'accent', className }) {
  const tones = {
    accent: 'border-accent/20 bg-accent/[0.06] text-ink2 [&_svg]:text-accent',
    warning: 'border-warning/20 bg-warning/[0.06] text-ink2 [&_svg]:text-warning',
    danger: 'border-danger/20 bg-danger/[0.06] text-ink2 [&_svg]:text-danger',
  };
  return (
    <div className={cx('flex gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed', tones[tone], className)}>
      {Icon && <Icon size={15} className="mt-0.5 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink3">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, sub, tone }) {
  const tones = { success: 'text-success', warning: 'text-warning', danger: 'text-danger', accent: 'text-accent' };
  return (
    <div>
      <div className="label">{label}</div>
      <div className={cx('mt-1 text-xl font-semibold tracking-tightish tabular-nums', tones[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink3">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink3">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export const PRIORITY = {
  1: { label: 'P1', color: '#F87171' },
  2: { label: 'P2', color: '#FBBF24' },
  3: { label: 'P3', color: 'rgb(var(--accent))' },
  4: { label: 'P4', color: '#71717A' },
};

export const AREA = {
  school: { label: 'School', color: '#7EC8E3' },
  job: { label: 'Job', color: '#F5A97F' },
  arbitrage: { label: 'Arbitrage', color: '#86EFAC' },
  misc: { label: 'Misc', color: '#A1A1AA' },
};
