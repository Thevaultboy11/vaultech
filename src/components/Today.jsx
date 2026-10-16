import { AlertTriangle, ArrowRight, Check, Moon, MoonStar, Star, Sun, Sunrise } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TODAY, addDays, fmtDur, fmtLong, fmtTime, nowHHMM, nowMin, relDay, toMin } from '../lib/dates';
import { focusQuickAdd, Tip } from './Tutorial';
import { useApp } from '../store';
import TaskRow from './tasks/TaskRow';
import { Button, Card, Check3, EmptyState, Modal, PageHeader, Progress, cx } from './ui';

const TONIGHT_FROM = 18 * 60;
const DAY_END = 23 * 60;

function Section({ icon: Icon, title, tasks, tone, hint, empty, starrable = true }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 px-3">
        <Icon size={14} className={tone || 'text-ink3'} />
        <span className={cx('text-[13px] font-semibold', tone)}>{title}</span>
        <span className="text-[11px] tabular-nums text-ink3">{tasks.length}</span>
        {hint && <span className="ml-auto text-[11px] text-ink3">{hint}</span>}
      </div>
      {tasks.length ? (
        <div className="space-y-0.5">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} starrable={starrable && t.status !== 'done'} showDo={false} />
          ))}
        </div>
      ) : (
        <p className="px-3 py-2 text-xs text-ink3">{empty}</p>
      )}
    </div>
  );
}

function ShutdownModal({ open, onClose, leftovers }) {
  const { updateTask, toast } = useApp();
  const [choice, setChoice] = useState({});
  const set = (id, v) => setChoice((c) => ({ ...c, [id]: v }));
  const decided = leftovers.filter((t) => choice[t.id]).length;

  const close = () => {
    leftovers.forEach((t) => {
      const c = choice[t.id];
      if (!c) return;
      if (c.kind === 'done') updateTask(t.id, { status: 'done' });
      if (c.kind === 'roll') updateTask(t.id, { doDate: addDays(TODAY, 1), doTime: null });
      if (c.kind === 'date') updateTask(t.id, { doDate: c.date, doTime: null });
    });
    toast('Day closed', { sub: `${decided} task${decided === 1 ? '' : 's'} sorted · laptop lid down`, tone: 'success' });
    setChoice({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Evening shutdown"
      sub="Decide where every leftover goes. Nothing stays in limbo overnight."
      width="max-w-xl"
      footer={
        <>
          <span className="mr-auto text-xs tabular-nums text-ink3">
            {decided}/{leftovers.length} decided
          </span>
          <Button variant="ghost" onClick={onClose}>
            Not yet
          </Button>
          <Button icon={MoonStar} onClick={close}>
            Close the day
          </Button>
        </>
      }
    >
      {leftovers.length === 0 ? (
        <EmptyState icon={Check} title="Clean slate" text="Nothing left over. Go rest." />
      ) : (
        <div className="space-y-2">
          {leftovers.map((t) => {
            const c = choice[t.id];
            const btn = (kind, label) => (
              <button
                onClick={() => set(t.id, { kind, date: c?.date || addDays(TODAY, 2) })}
                className={cx(
                  'h-7 rounded-full border px-3 text-xs transition',
                  c?.kind === kind ? 'border-accent/50 bg-accent/12 text-accent' : 'border-line text-ink2 hover:text-ink'
                )}
              >
                {label}
              </button>
            );
            return (
              <div key={t.id} className="rounded-xl border border-line bg-bg/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{t.title}</div>
                    <div className="text-[11px] text-ink3">
                      {fmtDur(t.estMin)}
                      {t.dueDate && ` · due ${relDay(t.dueDate).toLowerCase()}`}
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {btn('done', 'Mark done')}
                  {btn('roll', 'Roll to tomorrow')}
                  {btn('date', 'Reschedule')}
                  {c?.kind === 'date' && (
                    <input
                      type="date"
                      value={c.date}
                      min={addDays(TODAY, 1)}
                      onChange={(e) => set(t.id, { kind: 'date', date: e.target.value })}
                      className="input h-7 w-auto py-0 text-xs"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function Today() {
  const { tasks, top3, timeBlocks, gcal } = useApp();
  const now = nowMin();
  const [shutdown, setShutdown] = useState(false);

  const { overdue, today, tonight, candidates, plannedMin, availableMin } = useMemo(() => {
    const overdue = tasks.filter((t) => t.status !== 'done' && t.doDate && t.doDate < TODAY);
    const todays = tasks.filter((t) => t.doDate === TODAY);
    const tonight = todays.filter((t) => t.doTime && toMin(t.doTime) >= TONIGHT_FROM);
    const today = todays.filter((t) => !tonight.includes(t));
    const open = [...overdue, ...todays].filter((t) => t.status !== 'done');
    const plannedMin = open.reduce((s, t) => s + t.estMin, 0);
    // Free time left: now → 11 PM, minus today's non-study blocks (classes, job, gym, protected creative…)
    const start = Math.min(now, DAY_END);
    let busy = 0;
    const busyItems = [...timeBlocks.filter((b) => b.type !== 'study'), ...gcal.events.filter((ev) => !ev.allDay)];
    // merge overlaps so double-booked time isn't subtracted twice
    const spans = busyItems
      .filter((b) => b.start.startsWith(TODAY))
      .map((b) => [Math.max(start, toMin(b.start.slice(11))), Math.min(DAY_END, toMin(b.end.slice(11)))])
      .filter(([a, b]) => b > a)
      .sort((x, y) => x[0] - y[0]);
    let curS = -1;
    let curE = -1;
    for (const [a, b] of spans) {
      if (a > curE) {
        if (curE > curS) busy += curE - curS;
        curS = a;
        curE = b;
      } else curE = Math.max(curE, b);
    }
    if (curE > curS) busy += curE - curS;
    const availableMin = Math.max(0, DAY_END - start - busy);
    return { overdue, today, tonight, candidates: open, plannedMin, availableMin };
  }, [tasks, timeBlocks, gcal.events, now]);

  const over = plannedMin > availableMin;
  const empty = !overdue.length && !today.length && !tonight.length;
  const picked = top3.map((id) => tasks.find((t) => t.id === id)).filter(Boolean);

  return (
    <div>
      <PageHeader
        title={fmtLong(TODAY)}
        sub={`It's ${fmtTime(nowHHMM())}. Here's what's left.`}
        actions={
          <Button variant="outline" icon={Moon} onClick={() => setShutdown(true)}>
            Evening shutdown
          </Button>
        }
      />

      <Tip id="today" />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card className={cx(over && 'border-warning/30')}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="label">Planned vs available</div>
                <div className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                  <span className={over ? 'text-warning' : 'text-ink'}>{fmtDur(plannedMin)}</span>
                  <span className="text-ink3"> / {fmtDur(availableMin)}</span>
                </div>
              </div>
              {over ? (
                <div className="flex items-center gap-1.5 text-xs text-warning">
                  <AlertTriangle size={13} /> {fmtDur(plannedMin - availableMin)} more than fits. Roll something over.
                </div>
              ) : (
                <div className="text-xs text-success">Fits. Room for a walk.</div>
              )}
            </div>
            <Progress value={availableMin ? Math.min(1, plannedMin / availableMin) : plannedMin ? 1 : 0} className="mt-3" color={over ? '#FBBF24' : undefined} />
            <p className="mt-2 text-[11px] text-ink3">Free time counts from now until 11 PM, skipping classes, job, gym, protected blocks and Google Calendar events.</p>
          </Card>

          {empty ? (
            <EmptyState
              icon={Sunrise}
              title="Nothing planned for today"
              text="Add a task with “today” or “tonight” in the top bar, or set a do date in Tasks."
              cta="Add a task"
              onCta={focusQuickAdd}
            />
          ) : (
            <Card className="space-y-5 px-2 sm:px-2">
              <Section icon={AlertTriangle} title="Overdue" tasks={overdue} tone="text-danger" empty="Nothing overdue." />
              <Section icon={Sun} title="Today" tasks={today} empty="Nothing else for daytime." />
              <Section icon={Moon} title="Tonight" tasks={tonight} hint="after 6 PM" empty="Free evening." />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card accent>
            <div className="mb-3 flex items-center gap-2">
              <Star size={14} className="text-accent" />
              <span className="text-sm font-semibold">Pick top 3</span>
              <span className="ml-auto text-[11px] tabular-nums text-ink3">{picked.length}/3</span>
            </div>
            <div className="space-y-1.5">
              {[0, 1, 2].map((i) => {
                const t = picked[i];
                return t ? (
                  <div key={t.id} className="flex items-center gap-2.5 rounded-xl bg-bg/70 px-3 py-2.5">
                    <span className="w-3 text-xs font-semibold tabular-nums text-accent">{i + 1}</span>
                    <span className={cx('flex-1 truncate text-[13px]', t.status === 'done' && 'text-ink3 line-through')}>{t.title}</span>
                  </div>
                ) : (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl border border-dashed border-line px-3 py-2.5 text-[13px] text-ink3">
                    <span className="w-3 text-xs tabular-nums">{i + 1}</span>
                    Star a task
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-ink3">Star from the list. Three, not five.</p>
          </Card>

          <Card>
            <div className="label mb-3">Candidates</div>
            <div className="-mx-3">
              {candidates.length ? (
                candidates.map((t) => <TaskRow key={t.id} task={t} starrable compact />)
              ) : (
                <EmptyState icon={Sunrise} title="All clear" text="Pull something from Tasks." compact />
              )}
            </div>
          </Card>

          <button
            onClick={() => setShutdown(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-line bg-gradient-to-br from-surface to-bg px-4 py-4 text-left transition hover:border-accent/30"
          >
            <span>
              <span className="block text-sm font-medium">Ready to stop?</span>
              <span className="text-xs text-ink3">Run shutdown — 2 minutes.</span>
            </span>
            <ArrowRight size={16} className="text-accent" />
          </button>
        </div>
      </div>

      <ShutdownModal open={shutdown} onClose={() => setShutdown(false)} leftovers={candidates} />
    </div>
  );
}
