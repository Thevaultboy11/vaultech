import { FastForward, Pause, Play, Sprout, TreePine, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DOW, TODAY, dow, fmtDur, weekDays } from '../lib/dates';
import { useApp } from '../store';
import { BarList } from './charts';
import { Button, Card, CardHeader, EmptyState, PageHeader, Ring, Segmented, cx } from './ui';
import { Tip } from './Tutorial';

const PRESETS = [25, 50];

export default function Focus() {
  const { courses, tasks, focusSessions, addFocusSession, toast, derived, settings } = useApp();
  const [length, setLength] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [state, setState] = useState('idle'); // idle | running | paused
  const [courseId, setCourseId] = useState('');
  const [taskId, setTaskId] = useState('');
  const tick = useRef(null);

  const total = length * 60;
  const elapsedMin = Math.round((total - left) / 60);

  useEffect(() => {
    if (state !== 'running') return;
    tick.current = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick.current);
  }, [state]);

  useEffect(() => {
    if (state === 'running' && left === 0) {
      addFocusSession({ courseId: courseId || null, taskId: taskId || null, minutes: length, completed: true });
      toast('Tree grown', { sub: `${length} min of ${courses.find((c) => c.id === courseId)?.short || 'focus'}`, tone: 'success' });
      setState('idle');
      setLeft(length * 60);
    }
  }, [left, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = (min = length) => {
    setState('idle');
    setLeft(min * 60);
  };

  const abandon = () => {
    if (elapsedMin > 0) addFocusSession({ courseId: courseId || null, taskId: taskId || null, minutes: elapsedMin, completed: false });
    toast('Session abandoned', { sub: `${elapsedMin} min logged · the sapling withered`, tone: 'muted' });
    reset();
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const course = courses.find((c) => c.id === courseId);
  const courseTasks = tasks.filter((t) => t.status !== 'done' && (!courseId || t.courseId === courseId));
  const days = weekDays(TODAY, settings.weekStartsOn);
  const weekSessions = focusSessions.filter((f) => days.includes(f.date));
  const grown = weekSessions.filter((f) => f.completed).length;

  return (
    <div>
      <PageHeader title="Focus" sub="One block. One thing. Phone face down." />
      <Tip id="focus" />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="flex flex-col items-center py-10">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <select
              className="select"
              value={courseId}
              disabled={state !== 'idle'}
              onChange={(e) => {
                setCourseId(e.target.value);
                setTaskId('');
              }}
              aria-label="Course"
            >
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.short || c.name}
                </option>
              ))}
            </select>
            <select className="select max-w-[240px]" value={taskId} disabled={state !== 'idle'} onChange={(e) => setTaskId(e.target.value)} aria-label="Task">
              <option value="">No task</option>
              {courseTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <Segmented
              size="sm"
              value={length}
              onChange={(v) => {
                if (state !== 'idle') return;
                setLength(v);
                reset(v);
              }}
              options={PRESETS.map((p) => ({ value: p, label: `${p}m` }))}
            />
          </div>

          <Ring value={(total - left) / total} size={256} stroke={10} color={course?.color || 'rgb(var(--accent))'}>
            <div className="text-center">
              <div className="text-[64px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                {mm}:{ss}
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink3">
                {state === 'running' ? (
                  <>
                    <Sprout size={13} className="text-success" /> growing
                  </>
                ) : state === 'paused' ? (
                  'paused'
                ) : (
                  'ready'
                )}
              </div>
            </div>
          </Ring>

          <div className="mt-10 flex items-center gap-3">
            {state === 'running' ? (
              <Button size="lg" variant="outline" icon={Pause} onClick={() => setState('paused')}>
                Pause
              </Button>
            ) : (
              <Button size="lg" icon={Play} onClick={() => setState('running')}>
                {state === 'paused' ? 'Resume' : 'Start'}
              </Button>
            )}
            {state !== 'idle' && (
              <Button size="lg" variant="danger" icon={X} onClick={abandon}>
                Abandon
              </Button>
            )}
          </div>
          {state !== 'idle' && (
            <button onClick={() => setLeft(3)} className="mt-4 inline-flex items-center gap-1 text-[11px] text-ink3 hover:text-ink2">
              <FastForward size={11} /> skip to end (demo)
            </button>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="This week’s forest" sub={`${grown} grown · ${weekSessions.length - grown} withered`} />
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => {
                const list = weekSessions.filter((f) => f.date === d);
                return (
                  <div key={d} className="flex flex-col items-center gap-1.5">
                    <span className={cx('text-[10px] uppercase', d === TODAY ? 'text-ink' : 'text-ink3')}>{DOW[dow(d)][0]}</span>
                    <div className={cx('flex min-h-[96px] w-full flex-col-reverse items-center gap-1 rounded-lg py-1.5', d === TODAY ? 'bg-white/[0.04]' : 'bg-white/[0.02]')}>
                      {list.map((f) => {
                        const c = courses.find((x) => x.id === f.courseId);
                        return f.completed ? (
                          <TreePine key={f.id} size={f.minutes >= 50 ? 20 : 16} style={{ color: c?.color || '#A1A1AA' }} aria-label={`${f.minutes} min`} />
                        ) : (
                          <Sprout key={f.id} size={13} className="text-ink3/50" aria-label="abandoned" />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-ink3">
              <span className="inline-flex items-center gap-1">
                <TreePine size={11} /> completed
              </span>
              <span className="inline-flex items-center gap-1">
                <Sprout size={11} /> abandoned
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Minutes by course" sub={fmtDur(derived.focusByCourse.reduce((s, f) => s + f.min, 0)) + ' this week'} />
            {derived.focusByCourse.some((f) => f.min) ? (
              <BarList items={derived.focusByCourse.filter((f) => f.min || f.id !== 'other').map((f) => ({ label: f.label, value: f.min, color: f.color }))} />
            ) : (
              <p className="text-xs text-ink3">Finished sessions add up here.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
