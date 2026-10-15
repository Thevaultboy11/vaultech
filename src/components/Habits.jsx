import { BookOpen, Check, Dumbbell, Flame, Info, Moon, PenTool, Plus, Trash2, Droplets, Brain, Footprints } from 'lucide-react';
import { useState } from 'react';
import { TODAY, addDays, diffDays, fmtShort, startOfWeek } from '../lib/dates';
import { habitDone, habitHistory, habitStreak, habitStrength, habitWeekCount, useApp } from '../store';
import { Tip } from './Tutorial';
import { Button, Callout, Card, EmptyState, Field, Modal, PageHeader, Ring, cx } from './ui';

export const HABIT_ICONS = { check: Check, dumbbell: Dumbbell, book: BookOpen, pen: PenTool, moon: Moon, water: Droplets, brain: Brain, walk: Footprints, flame: Flame };

// GitHub-style grid: rows = weekdays, columns = weeks
function Heatmap({ history, weekStartsOn }) {
  const first = addDays(TODAY, -(history.length - 1));
  const gridStart = startOfWeek(first, weekStartsOn);
  const weeks = Math.ceil((diffDays(TODAY, gridStart) + 1) / 7);
  const rowLabels = Array.from({ length: 7 }, (_, i) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][(weekStartsOn + i) % 7]);
  return (
    <div className="flex gap-1.5">
      <div className="grid grid-rows-7 gap-1 pr-0.5">
        {rowLabels.map((l, i) => (
          <span key={i} className="flex h-3.5 items-center text-[9px] text-ink3">
            {i % 2 === 0 ? l : ''}
          </span>
        ))}
      </div>
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} className="grid grid-rows-7 gap-1">
          {Array.from({ length: 7 }, (_, r) => {
            const date = addDays(gridStart, w * 7 + r);
            const idx = diffDays(date, first);
            const inRange = idx >= 0 && idx < history.length;
            const done = inRange && history[idx];
            return (
              <span
                key={r}
                title={inRange ? `${fmtShort(date)} · ${done ? 'done' : 'not done'}` : ''}
                className={cx(
                  'h-3.5 w-3.5 rounded-[4px]',
                  !inRange ? 'bg-transparent' : done ? 'bg-accent' : 'bg-line',
                  date === TODAY && 'ring-1 ring-ink2 ring-offset-1 ring-offset-surface'
                )}
                style={done ? { opacity: 0.55 + 0.45 * (idx / history.length) } : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AddHabitModal({ onClose }) {
  const { addHabit, habits } = useApp();
  const [f, setF] = useState({ name: '', frequencyPerWeek: 4, icon: 'check', kind: '' });
  const kindTaken = (k) => habits.some((h) => h.kind === k);
  return (
    <Modal
      open
      onClose={onClose}
      title="New habit"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!f.name.trim()}
            onClick={() => {
              addHabit({ name: f.name.trim(), frequencyPerWeek: Number(f.frequencyPerWeek), icon: f.icon, kind: f.kind || null });
              onClose();
            }}
          >
            Add habit
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <input autoFocus className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Gym, Reading, Creative block…" />
        </Field>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink2">Times per week</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setF({ ...f, frequencyPerWeek: n })}
                className={cx('h-8 w-9 rounded-full border text-xs tabular-nums', f.frequencyPerWeek === n ? 'border-accent/50 bg-accent/12 text-accent' : 'border-line text-ink2')}
              >
                {n === 7 ? 'Daily' : n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink2">Icon</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(HABIT_ICONS).map(([k, Icon]) => (
              <button
                key={k}
                onClick={() => setF({ ...f, icon: k })}
                className={cx('flex h-9 w-9 items-center justify-center rounded-xl border', f.icon === k ? 'border-accent/50 bg-accent/12 text-accent' : 'border-line text-ink3')}
                aria-label={k}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Auto-tick from" hint="Logging a workout or pages will tick this habit for you.">
          <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="">Nothing — I’ll tick it myself</option>
            <option value="gym" disabled={kindTaken('gym')}>
              Gym workouts{kindTaken('gym') ? ' (already linked)' : ''}
            </option>
            <option value="reading" disabled={kindTaken('reading')}>
              Reading pages{kindTaken('reading') ? ' (already linked)' : ''}
            </option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function HabitCard({ habit }) {
  const { setHabitToday, deleteHabit, settings } = useApp();
  const [confirm, setConfirm] = useState(false);
  const Icon = HABIT_ICONS[habit.icon] || Check;
  const doneToday = habitDone(habit);
  const target = habit.frequencyPerWeek;
  const wk = habitWeekCount(habit, settings.weekStartsOn);
  const streak = habitStreak(habit);
  const history = habitHistory(habit, 28);
  const strength = habitStrength(habit);

  return (
    <Card className="group flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-ink2">
              <Icon size={14} />
            </span>
            <h3 className="truncate text-[15px] font-semibold">{habit.name}</h3>
          </div>
          <p className="mt-1.5 text-xs text-ink3">
            {target === 7 ? 'Daily' : `${target}× a week`} · strength
            {habit.kind && <span className="ml-1 text-ink3/80">· auto from {habit.kind === 'gym' ? 'workouts' : 'pages'}</span>}
          </p>
        </div>
        <Ring value={strength / 100} size={64} stroke={5}>
          <div className="text-sm font-semibold tabular-nums">{strength}%</div>
        </Ring>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {Array.from({ length: target }, (_, i) => (
          <span key={i} className={cx('h-2 flex-1 rounded-full transition', i < wk ? 'bg-accent' : 'bg-line')} />
        ))}
        <span className="ml-2 text-[11px] tabular-nums text-ink3">
          {wk}/{target}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Heatmap history={history} weekStartsOn={settings.weekStartsOn} />
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-ink3">
        <span>
          <b className="font-semibold tabular-nums text-ink2">{streak}</b> day streak
        </span>
        <span>
          <b className="font-semibold tabular-nums text-ink2">{history.filter(Boolean).length}</b>/28 days
        </span>
        {confirm ? (
          <span className="ml-auto flex items-center gap-2">
            <button className="text-danger" onClick={() => deleteHabit(habit.id)}>
              Delete
            </button>
            <button onClick={() => setConfirm(false)}>Keep</button>
          </span>
        ) : (
          <button onClick={() => setConfirm(true)} className="ml-auto opacity-0 transition hover:text-danger group-hover:opacity-100" aria-label="Delete habit">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <button
        onClick={() => setHabitToday(habit.id)}
        className={cx(
          'mt-5 flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition active:scale-[0.98]',
          doneToday ? 'bg-accent/12 text-accent hover:bg-accent/20' : 'bg-accent text-bg hover:bg-accentHover'
        )}
      >
        <Check size={15} strokeWidth={2.5} />
        {doneToday ? 'Done today · tap to undo' : 'Complete today'}
      </button>
    </Card>
  );
}

export default function Habits() {
  const { habits } = useApp();
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <PageHeader
        title="Habits"
        sub="Consistency, not perfection."
        actions={
          <Button icon={Plus} onClick={() => setAdding(true)}>
            New habit
          </Button>
        }
      />
      <Tip id="habits" />
      <Callout icon={Info} className="mb-6">
        Strength is a rolling score. Missing a day eases it down a little — it never drops back to zero. One bad day doesn’t erase a good month.
      </Callout>
      {habits.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Flame} title="No habits yet" text="Start with two or three. Gym 4× a week, reading daily, a protected creative block…" cta="Add your first habit" onCta={() => setAdding(true)} />
      )}
      {adding && <AddHabitModal onClose={() => setAdding(false)} />}
    </div>
  );
}
