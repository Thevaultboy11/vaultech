import { Dumbbell, History, Plus, Trophy } from 'lucide-react';
import { useState } from 'react';
import { DOW, TODAY, diffDays, dow, fmtDay, fmtShort, relDay, weekDays } from '../lib/dates';
import { useApp } from '../store';
import { Button, Card, CardHeader, EmptyState, Field, Modal, PageHeader, Segmented, cx } from './ui';
import { Tip } from './Tutorial';

const fmtSets = (sets) => {
  const same = sets.every((s) => s.reps === sets[0].reps && s.weight === sets[0].weight);
  if (same) return `${sets.length} × ${sets[0].reps} @ ${sets[0].weight}kg`;
  return sets.map((s) => `${s.weight}×${s.reps}`).join(' · ');
};

function lastFor(workouts, name) {
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name === name);
    if (ex) return ex;
  }
  return null;
}

function LogWorkoutModal({ initial, onClose }) {
  const { templates, workouts, addWorkout } = useApp();
  const [template, setTemplate] = useState(initial);
  const build = (tpl) =>
    templates[tpl].map((name) => {
      const last = lastFor(workouts, name);
      const top = last ? last.sets[0] : { reps: 8, weight: 20 };
      return { name, reps: top.reps, weight: top.weight, sets: last ? last.sets.length : 3, prev: last ? `${top.weight} × ${top.reps}` : '—' };
    });
  const [rows, setRows] = useState(build(initial));
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState('');
  const setRow = (i, k, v) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <Modal
      open
      onClose={onClose}
      title="Log workout"
      sub={fmtDay(TODAY)}
      width="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              addWorkout({
                template,
                durationMin: duration,
                exercises: rows.map((r) => ({
                  name: r.name,
                  prev: r.prev,
                  sets: Array.from({ length: r.sets }, () => ({ reps: Number(r.reps), weight: Number(r.weight) })),
                })),
                previousSessionNote: note.trim(),
              });
              onClose();
            }}
          >
            Save workout
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={template}
          onChange={(t) => {
            setTemplate(t);
            setRows(build(t));
          }}
          options={Object.keys(templates)}
        />
        <label className="flex items-center gap-2 text-xs text-ink3">
          Duration
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input h-8 w-16 py-0 text-center" />
          min
        </label>
      </div>
      <div className="grid grid-cols-[1fr_52px_52px_64px] gap-2 px-1 pb-2 text-[10px] uppercase tracking-wider text-ink3">
        <span>Exercise</span>
        <span className="text-center">Sets</span>
        <span className="text-center">Reps</span>
        <span className="text-center">kg</span>
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.name} className="grid grid-cols-[1fr_52px_52px_64px] items-center gap-2 rounded-xl bg-bg/60 px-2 py-2">
            <div className="min-w-0">
              <div className="truncate text-[13px]">{r.name}</div>
              <div className="text-[10.5px] text-ink3">last: {r.prev}</div>
            </div>
            {['sets', 'reps', 'weight'].map((k) => (
              <input
                key={k}
                type="number"
                step={k === 'weight' ? 2.5 : 1}
                value={r[k]}
                onChange={(e) => setRow(i, k, e.target.value)}
                className="input h-8 px-1 py-0 text-center tabular-nums"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Field label="Note for next time">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bench moved well — try 62.5 next push day" />
        </Field>
      </div>
    </Modal>
  );
}

export default function Gym() {
  const { workouts, prs, templates, settings, timeBlocks, deleteWorkout } = useApp();
  const [logging, setLogging] = useState(null);
  const days = weekDays(TODAY, settings.weekStartsOn);
  const thisWeek = workouts.filter((w) => days.includes(w.date));
  const last = workouts[0];
  const plannedGym = new Set(timeBlocks.filter((b) => b.type === 'gym').map((b) => b.start.slice(0, 10)));
  const nextTemplate = { Push: 'Pull', Pull: 'Legs', Legs: 'Push' }[last?.template] || 'Push';

  return (
    <div>
      <PageHeader
        title="Gym"
        sub={`${thisWeek.length} of ${settings.gymTarget} this week · ${last ? `next up: ${nextTemplate}` : 'log your first session'}`}
        actions={
          <Button icon={Plus} onClick={() => setLogging(nextTemplate)}>
            Log workout
          </Button>
        }
      />

      <Tip id="gym" />

      <Card className="mb-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold">This week</span>
          <span className="text-xs tabular-nums text-ink3">
            {thisWeek.length}/{settings.gymTarget} visits
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const w = workouts.find((x) => x.date === d);
            const planned = !w && plannedGym.has(d) && d >= TODAY;
            const isToday = d === TODAY;
            return (
              <div
                key={d}
                className={cx(
                  'flex flex-col items-center gap-2 rounded-xl border py-3',
                  w ? 'border-accent/30 bg-accent/[0.08]' : planned ? 'border-dashed border-line' : 'border-line/60',
                  isToday && 'ring-1 ring-ink3/40'
                )}
              >
                <span className={cx('text-[10px] uppercase tracking-wider', isToday ? 'text-ink' : 'text-ink3')}>{DOW[dow(d)]}</span>
                <span className={cx('flex h-8 w-8 items-center justify-center rounded-full', w ? 'bg-accent text-bg' : 'bg-white/[0.03] text-ink3')}>
                  <Dumbbell size={14} />
                </span>
                <span className="text-[10px] text-ink3">{w ? w.template : planned ? 'planned' : '—'}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {!last ? (
          <Card>
            <EmptyState icon={Dumbbell} title="No workouts logged yet" text="Pick a template and log what you lifted. Next time, your numbers prefill so you can beat them." cta="Log first workout" onCta={() => setLogging('Push')} />
          </Card>
        ) : (
        <Card accent>
          <CardHeader
            action={
              <button onClick={() => deleteWorkout(last.id)} className="text-[11px] text-ink3 hover:text-danger">
                Delete
              </button>
            }
            title={`Last session · ${last.template} day`}
            icon={History}
            sub={`${relDay(last.date)}, ${fmtShort(last.date)} · ${last.durationMin} min`}
          />
          <div className="divide-y divide-line">
            {last.exercises.map((e) => (
              <div key={e.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[13.5px]">{e.name}</span>
                <span className="text-right">
                  <span className="block text-[13px] tabular-nums text-ink">{fmtSets(e.sets)}</span>
                  {e.prev && <span className="text-[11px] tabular-nums text-ink3">prev {e.prev}</span>}
                </span>
              </div>
            ))}
          </div>
          {last.previousSessionNote && (
            <p className="mt-4 rounded-xl bg-bg/70 px-3 py-2.5 text-xs text-ink2">“{last.previousSessionNote}”</p>
          )}
        </Card>
        )}

        <div className="space-y-4">
          <Card>
            <CardHeader title="Personal records" icon={Trophy} />
            <div className="space-y-3">
              {prs.map((p) => (
                <div key={p.lift} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px]">{p.lift}</div>
                    <div className="text-[11px] text-ink3">{p.date ? fmtShort(p.date) : 'not logged yet'}</div>
                  </div>
                  {p.weight != null ? (
                    <div className={cx('text-right text-lg font-semibold tabular-nums tracking-tight', p.date === TODAY && 'text-success')}>
                      {p.weight}
                      <span className="text-xs font-normal text-ink3"> kg × {p.reps}</span>
                    </div>
                  ) : (
                    <span className="text-lg text-ink3">—</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Templates" />
            <div className="space-y-2">
              {Object.entries(templates).map(([name, list]) => (
                <button
                  key={name}
                  onClick={() => setLogging(name)}
                  className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-left transition hover:border-accent/30"
                >
                  <span>
                    <span className="block text-[13px] font-medium">
                      {name}
                      {name === nextTemplate && <span className="ml-2 rounded-full bg-accent/12 px-1.5 py-0.5 text-[10px] text-accent">next</span>}
                    </span>
                    <span className="block text-[11px] text-ink3">{list.slice(0, 3).join(' · ')} +{list.length - 3}</span>
                  </span>
                  <Plus size={14} className="text-ink3" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {logging && <LogWorkoutModal initial={logging} onClose={() => setLogging(null)} />}
    </div>
  );
}
