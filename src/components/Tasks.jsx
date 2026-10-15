import { ChevronLeft, ChevronRight, Columns3, Inbox, List, Plus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { fmtDur, relDay } from '../lib/dates';
import { useApp } from '../store';
import TaskRow, { CourseTag, AreaTag, PriorityFlag } from './tasks/TaskRow';
import { AREA, Button, Card, Check3, EmptyState, PageHeader, Segmented, cx } from './ui';
import { Tip } from './Tutorial';

const STATUSES = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
];

function BoardCard({ task }) {
  const { setOpenTaskId, updateTask, toggleTask } = useApp();
  const idx = STATUSES.findIndex((s) => s.id === task.status);
  const move = (d) => updateTask(task.id, { status: STATUSES[idx + d].id });
  return (
    <div
      onClick={() => setOpenTaskId(task.id)}
      className="group cursor-pointer rounded-xl border border-line bg-bg/70 p-3 transition hover:border-ink3/30"
    >
      <div className="flex items-start gap-2.5">
        <div className="pt-0.5">
          <Check3 checked={task.status === 'done'} onChange={() => toggleTask(task.id)} size={16} />
        </div>
        <span className={cx('flex-1 text-[13px] leading-snug', task.status === 'done' && 'text-ink3 line-through')}>{task.title}</span>
        <PriorityFlag p={task.priority} />
      </div>
      <div className="mt-2.5 flex items-center justify-between pl-[26px]">
        <div className="flex items-center gap-3">
          {task.courseId ? <CourseTag courseId={task.courseId} /> : <AreaTag area={task.area} />}
          {task.dueDate && <span className="text-[11px] text-ink3">due {relDay(task.dueDate).toLowerCase()}</span>}
        </div>
        <div className="flex opacity-60 transition group-hover:opacity-100">
          <button
            disabled={idx === 0}
            onClick={(e) => {
              e.stopPropagation();
              move(-1);
            }}
            className="rounded p-0.5 text-ink3 hover:text-ink disabled:opacity-20"
            aria-label="Move left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            disabled={idx === 2}
            onClick={(e) => {
              e.stopPropagation();
              move(1);
            }}
            className="rounded p-0.5 text-ink3 hover:text-ink disabled:opacity-20"
            aria-label="Move right"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { tasks, courses, addTask, setOpenTaskId } = useApp();
  const [mode, setMode] = useState('list');
  const [f, setF] = useState({ area: 'all', course: 'all', priority: 'all', status: 'open' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const filtered = tasks.filter(
    (t) =>
      (f.area === 'all' || t.area === f.area) &&
      (f.course === 'all' || t.courseId === f.course) &&
      (f.priority === 'all' || t.priority === Number(f.priority)) &&
      (f.status === 'all' || (f.status === 'open' ? t.status !== 'done' : t.status === f.status))
  );
  const anyFilter = f.area !== 'all' || f.course !== 'all' || f.priority !== 'all' || f.status !== 'open';
  const reset = () => setF({ area: 'all', course: 'all', priority: 'all', status: 'open' });

  // List mode: group by area, nest subtasks under parents
  const ids = new Set(filtered.map((t) => t.id));
  const groups = Object.keys(AREA)
    .map((area) => {
      const inArea = filtered.filter((t) => t.area === area);
      const roots = inArea.filter((t) => !t.parentId || !ids.has(t.parentId));
      return { area, roots, count: inArea.length, est: inArea.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estMin, 0) };
    })
    .filter((g) => g.count);

  // Board ignores the status filter — the columns are the status.
  const boardSource = tasks.filter(
    (t) =>
      (f.area === 'all' || t.area === f.area) &&
      (f.course === 'all' || t.courseId === f.course) &&
      (f.priority === 'all' || t.priority === Number(f.priority))
  );
  const newTask = () => {
    const t = addTask({ title: 'New task', area: f.area !== 'all' ? f.area : 'misc' }, { silent: true });
    setOpenTaskId(t.id);
  };

  return (
    <div>
      <PageHeader
        title="All tasks"
        sub={`${tasks.filter((t) => t.status !== 'done').length} open · ${fmtDur(tasks.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estMin, 0))} estimated`}
        actions={
          <>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'list', label: 'List', icon: List },
                { value: 'board', label: 'Board', icon: Columns3 },
              ]}
            />
            <Button icon={Plus} onClick={newTask}>
              New
            </Button>
          </>
        }
      />

      <Tip id="tasks" />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select className="select" value={f.area} onChange={set('area')} aria-label="Area">
          <option value="all">All areas</option>
          {Object.entries(AREA).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="select" value={f.course} onChange={set('course')} aria-label="Course">
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.short || c.name}</option>
          ))}
        </select>
        <select className="select" value={f.priority} onChange={set('priority')} aria-label="Priority">
          <option value="all">Any priority</option>
          {[1, 2, 3, 4].map((p) => (
            <option key={p} value={p}>P{p}</option>
          ))}
        </select>
        {mode === 'list' && (
          <select className="select" value={f.status} onChange={set('status')} aria-label="Status">
            <option value="open">Open</option>
            <option value="all">Any status</option>
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        )}
        {anyFilter && (
          <button onClick={reset} className="text-xs text-accent hover:text-accentHover">
            Clear
          </button>
        )}
        <span className="ml-auto hidden text-[11px] text-ink3 sm:block">Tip: type in the top bar to add — it parses dates, p1–p4 and #area.</span>
      </div>

      {mode === 'list' ? (
        groups.length ? (
          <div className="space-y-4">
            {groups.map((g) => (
              <Card key={g.area} className="px-2 py-3 sm:px-2">
                <div className="mb-1 flex items-center gap-2 px-3 py-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: AREA[g.area].color }} />
                  <span className="text-[13px] font-semibold">{AREA[g.area].label}</span>
                  <span className="text-[11px] tabular-nums text-ink3">{g.count}</span>
                  {g.est > 0 && <span className="ml-auto text-[11px] tabular-nums text-ink3">{fmtDur(g.est)}</span>}
                </div>
                <div className="space-y-0.5">
                  {g.roots.map((t) => (
                    <div key={t.id}>
                      <TaskRow task={t} />
                      {filtered
                        .filter((c) => c.parentId === t.id)
                        .map((c) => (
                          <TaskRow key={c.id} task={c} indent />
                        ))}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={anyFilter ? SearchX : Inbox}
            title={anyFilter ? 'Nothing matches these filters' : 'Inbox zero'}
            text={anyFilter ? 'Loosen a filter or two.' : 'Add something from the top bar.'}
            cta={anyFilter ? 'Clear filters' : 'Add a task'}
            onCta={anyFilter ? reset : newTask}
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {STATUSES.map((s) => {
            const col = boardSource.filter((t) => t.status === s.id);
            return (
              <div key={s.id} className="rounded-card border border-line bg-surface/60 p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span
                    className={cx('h-2 w-2 rounded-full', s.id === 'done' ? 'bg-success' : s.id === 'doing' ? 'bg-accent' : 'bg-ink3')}
                  />
                  <span className="text-[13px] font-semibold">{s.label}</span>
                  <span className="text-[11px] tabular-nums text-ink3">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((t) => (
                    <BoardCard key={t.id} task={t} />
                  ))}
                  {!col.length && <EmptyState title="Empty" text="Move a card here with the arrows." compact />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
