import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CornerDownLeft, Plus, Sparkles, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { parseQuickAdd } from '../../lib/parse';
import { useApp } from '../../store';
import { cx } from '../ui';
import { Logo } from './Sidebar';
import { titleFor } from './nav';
import SyncBadge from './SyncBadge';

const EXAMPLES = [
  'Calc pset every Mon 9am p1 #school',
  'Flashcards tomorrow 45m p2',
  'Email the client fri #job',
  'Check comps tonight #arbitrage',
];

export default function TopBar() {
  const { activeView, addTask, notifications, markNotifs, go, courses, profile, focusTimer } = useApp();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const inputRef = useRef(null);
  const parsed = useMemo(() => (q.trim() ? parseQuickAdd(q, courses) : null), [q, courses]);
  const unread = notifications.filter((n) => !n.read).length;
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onFocus = () => inputRef.current?.focus();
    window.addEventListener('keydown', onKey);
    window.addEventListener('vti:focus-quickadd', onFocus);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('vti:focus-quickadd', onFocus);
    };
  }, []);

  const submit = () => {
    if (!parsed?.task.title) return;
    addTask(parsed.task);
    setQ('');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 md:px-8">
        <div className="md:hidden">
          <Logo collapsed />
        </div>
        <h1 className="hidden shrink-0 text-[15px] font-semibold tracking-tight sm:block">{titleFor(activeView, profile)}</h1>

        <div className="relative ml-auto w-full max-w-[460px] flex-1 md:ml-6">
          <div
            className={cx(
              'flex h-9 items-center gap-2 rounded-full border bg-surface px-3 transition',
              focused ? 'border-accent/50 ring-2 ring-accent/10' : 'border-line'
            )}
          >
            <Plus size={15} className={focused ? 'text-accent' : 'text-ink3'} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') {
                  setQ('');
                  inputRef.current?.blur();
                }
              }}
              placeholder="Calc pset every Mon 9am p1 #school"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink3"
            />
            <kbd className="hidden shrink-0 rounded-md border border-line bg-bg px-1.5 py-0.5 font-sans text-[10px] text-ink3 sm:block">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </div>

          <AnimatePresence>
            {focused && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 right-0 top-11 z-40 rounded-2xl border border-line bg-surface p-3 shadow-2xl"
              >
                {parsed?.task.title ? (
                  <div>
                    <div className="label mb-2 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-accent" /> Parsed
                    </div>
                    <div className="mb-2 text-sm font-medium">{parsed.task.title}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.chips.map((c) => (
                        <span key={c.k + c.v} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-ink2">
                          <span className="text-ink3">{c.k}</span> {c.v}
                        </span>
                      ))}
                      {!parsed.chips.length && <span className="text-[11px] text-ink3">No date — goes to Inbox</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink3">
                      <CornerDownLeft size={11} /> Enter to add
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="label mb-2">Try</div>
                    <div className="space-y-0.5">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setQ(ex);
                          }}
                          className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-ink2 hover:bg-white/[0.04] hover:text-ink"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 px-2 text-[11px] text-ink3">
                      Understands days, times, “every …”, p1–p4, #area, and durations like 45m.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {focusTimer.status !== 'idle' && activeView !== 'focus' && (
          <button
            onClick={() => go('focus')}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs tabular-nums text-ink2 transition hover:bg-white/[0.05] hover:text-ink"
            aria-label="Focus timer"
          >
            <Timer size={14} className={focusTimer.status === 'running' ? 'text-success' : 'text-ink3'} />
            {String(Math.floor(Math.ceil(focusTimer.left / 1000) / 60)).padStart(2, '0')}:
            {String(Math.ceil(focusTimer.left / 1000) % 60).padStart(2, '0')}
          </button>
        )}
        <SyncBadge />
        <div className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink3 transition hover:bg-white/[0.05] hover:text-ink"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />}
          </button>
          <AnimatePresence>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-11 z-40 w-[320px] rounded-2xl border border-line bg-surface shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button
                      className="text-xs text-accent hover:text-accentHover"
                      onClick={() => markNotifs(notifications.map((n) => n.id))}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto py-1">
                    {!notifications.length && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-ink2">You’re all caught up</p>
                        <p className="mt-1 text-xs text-ink3">Alerts show up here: overdue tasks, close milestones, reading pace, follow-ups.</p>
                      </div>
                    )}
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markNotifs([n.id]);
                          go(n.view, { courseId: n.courseId });
                          setBellOpen(false);
                        }}
                        className="flex w-full gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03]"
                      >
                        <span className={cx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} />
                        <span className="flex-1">
                          <span className={cx('block text-[13px]', n.read ? 'text-ink2' : 'text-ink')}>{n.text}</span>
                          <span className="text-[11px] text-ink3">{n.time}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
