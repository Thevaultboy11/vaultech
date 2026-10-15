import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, GraduationCap, Lightbulb, X } from 'lucide-react';
import { useApp } from '../store';
import { Button, Progress, cx } from './ui';

// Short how-to for every page, shown while Tutorial mode is on (Settings).
export const TIPS = {
  dashboard: {
    title: 'Your home base',
    steps: [
      'Everything here fills in as you add data on the other pages.',
      'Gap cards show how far behind (or ahead of) class each course is.',
      'Top 3 comes from the stars you give tasks on Today.',
    ],
  },
  today: {
    title: 'Plan the day you have left',
    steps: [
      'Tasks land here when their do date is today (or slipped from earlier).',
      'Star up to three — that’s your Top 3 on the Dashboard.',
      'The bar compares planned hours with the free time left before 11 PM.',
      'At night, run Evening shutdown to sort every leftover task.',
    ],
  },
  tasks: {
    title: 'Every task in one place',
    steps: [
      'Type in the top bar: “Essay draft fri 2h p1 #school”. Days, times, “every Mon”, p1–p4, #area and durations are understood.',
      'Mention a course by its short name (e.g. “CSO”) and the task links to it.',
      'Click a task to open its details: checklist, dates, estimate, recurrence, notes.',
      'Switch to Board to move tasks between To do, Doing and Done.',
    ],
  },
  calendar: {
    title: 'Block out your week',
    steps: [
      'Click an empty slot to add a block. Use “Repeat weekly” for classes.',
      'Creative blocks are protected — Auto-Plan never overwrites them.',
      'Pick an unscheduled task on the right, then click a slot to place it.',
      'Auto-Plan fills free hours with your highest-priority unscheduled tasks.',
    ],
  },
  courses: {
    title: 'Track your baseline gap',
    steps: [
      'Add a course, then add its syllabus topics with the date each is taught.',
      'Gap = topics already taught that you haven’t started, minus topics you covered early.',
      'Mark topics Studied → Practiced → Mastered as you go. Aim for 0, then go negative.',
      'Add a milestone (midterm, problem set) to get warnings as it gets close.',
    ],
  },
  focus: {
    title: 'One block, one thing',
    steps: [
      'Pick a course or task, then Start. 25 or 50 minutes.',
      'Finish to grow a tree. Abandon and the sapling withers (minutes still logged).',
      'Weekly minutes per course show up on the Dashboard.',
    ],
  },
  habits: {
    title: 'Consistency, not perfection',
    steps: [
      'Add a habit with how many times a week you want it.',
      'Tap Complete today to tick it. Strength is a rolling score — a miss eases it down, never to zero.',
      'Link a habit to Gym or Reading and it ticks itself when you log a workout or pages.',
    ],
  },
  reading: {
    title: 'A book every two weeks',
    steps: [
      'Add books to Want, then press Start to begin one.',
      'Log pages after each session — the pages-per-day you need updates live.',
      'Change the target days and yearly goal in Settings.',
    ],
  },
  gym: {
    title: 'Progressive overload, tracked',
    steps: [
      'Log workout opens a Push, Pull or Legs template.',
      'Numbers prefill from your last session of each exercise so you can beat them.',
      'Bench, squat and deadlift PRs update automatically.',
    ],
  },
  screen: {
    title: 'Notice where the hours go',
    steps: [
      'Log time by category. The ring turns red when you pass your daily limit.',
      'This only logs — real blocking needs an app like Opal or one sec.',
    ],
  },
  job: {
    title: 'Your sales pipeline',
    steps: [
      'Add leads and move them Idea → Outreach → Meeting → Proposal → Closed.',
      'Use “…” on a card to jump to any stage or delete it.',
      'The commission helper shows how much needs to close to hit an income target.',
    ],
  },
  arbitrage: {
    title: 'Flip with numbers, not vibes',
    steps: [
      'New deal asks for buy, sell and fees — margin is calculated for you.',
      'Green ≥ 20% of buy price, amber 10–20%, red below 10%.',
    ],
  },
  settings: {
    title: 'Make it yours',
    steps: [
      'Add your name and job so greetings and labels fit.',
      'Your data saves automatically in this browser. Export a JSON backup now and then.',
      'Turn Tutorial mode off here once you know your way around.',
    ],
  },
};

export function Tip({ id, spaced = true }) {
  const { settings, tutorialDone, dismissTip, setSettings } = useApp();
  const tip = TIPS[id];
  const show = tip && settings.tutorial && !tutorialDone.includes(id);
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className={cx('relative rounded-card border border-accent/25 bg-accent/[0.05] p-4 pl-5', spaced && 'mb-6')}>
            <span className="absolute bottom-4 left-0 top-4 w-[2px] rounded-full bg-accent" />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Lightbulb size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="label text-accent/80">Tutorial</span>
                  <span className="text-sm font-semibold">{tip.title}</span>
                </div>
                <ol className="mt-2 space-y-1.5">
                  {tip.steps.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink2">
                      <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-semibold tabular-nums text-ink2">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="soft" icon={Check} onClick={() => dismissTip(id)}>
                    Got it
                  </Button>
                  <button className="text-xs text-ink3 hover:text-ink2" onClick={() => setSettings((s) => ({ ...s, tutorial: false }))}>
                    Turn off tutorial mode
                  </button>
                </div>
              </div>
              <button onClick={() => dismissTip(id)} className="text-ink3 hover:text-ink" aria-label="Dismiss tip">
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const focusQuickAdd = () => window.dispatchEvent(new Event('vti:focus-quickadd'));

export function GettingStarted() {
  const { settings, tutorialDone, dismissTip, profile, courses, tasks, timeBlocks, habits, books, focusSessions, go } = useApp();
  if (!settings.tutorial || tutorialDone.includes('getting-started')) return null;
  const steps = [
    { id: 'profile', label: 'Add your name in Settings', done: !!profile.name.trim(), go: () => go('settings') },
    { id: 'course', label: 'Add your first course', done: courses.length > 0, go: () => go('courses') },
    { id: 'topics', label: 'Add syllabus topics to a course', done: courses.some((c) => c.topics.length > 0), go: () => go('courses') },
    { id: 'task', label: 'Add a task from the top bar', done: tasks.length > 0, go: focusQuickAdd },
    { id: 'block', label: 'Put a block on your calendar', done: timeBlocks.length > 0, go: () => go('calendar') },
    { id: 'habit', label: 'Start a habit', done: habits.length > 0, go: () => go('habits') },
    { id: 'book', label: 'Add a book you’re reading', done: books.length > 0, go: () => go('reading') },
    { id: 'focus', label: 'Finish one focus session', done: focusSessions.some((f) => f.completed), go: () => go('focus') },
  ];
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="card relative">
      <span className="absolute bottom-4 left-0 top-4 w-[2px] rounded-full bg-accent" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap size={15} className="text-accent" />
            <h3 className="text-sm font-semibold">Getting started</h3>
          </div>
          <p className="mt-0.5 text-xs text-ink3">
            {done === steps.length ? 'All set — you can hide this now.' : 'Eight small steps and the whole app comes alive.'}
          </p>
        </div>
        <span className="text-xs tabular-nums text-ink3">
          {done}/{steps.length}
        </span>
      </div>
      <Progress value={done / steps.length} height={4} className="mb-4" />
      <div className="grid gap-1 sm:grid-cols-2">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={s.go}
            disabled={s.done}
            className={cx(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition',
              s.done ? 'text-ink3' : 'text-ink2 hover:bg-white/[0.04] hover:text-ink'
            )}
          >
            <span
              className={cx(
                'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border',
                s.done ? 'border-accent bg-accent/20 text-accent' : 'border-ink3/50 text-transparent'
              )}
            >
              <Check size={11} strokeWidth={3} />
            </span>
            <span className={cx('flex-1', s.done && 'line-through decoration-ink3/50')}>{s.label}</span>
            {!s.done && <ArrowRight size={13} className="text-ink3 opacity-0 transition group-hover:opacity-100" />}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <button className="text-xs text-ink3 hover:text-ink2" onClick={() => dismissTip('getting-started')}>
          Hide checklist
        </button>
      </div>
    </div>
  );
}
