import { CalendarClock, Flag, Repeat, Star } from 'lucide-react';
import { TODAY, fmtDur, fmtTime, relDay } from '../../lib/dates';
import { useApp } from '../../store';
import { AREA, Check3, PRIORITY, cx } from '../ui';

export function PriorityFlag({ p }) {
  return <Flag size={12} style={{ color: PRIORITY[p].color }} fill={p <= 2 ? PRIORITY[p].color : 'none'} />;
}

export function CourseTag({ courseId }) {
  const { courses } = useApp();
  const c = courses.find((x) => x.id === courseId);
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-ink2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {c.short || c.name}
    </span>
  );
}

export function AreaTag({ area }) {
  const a = AREA[area];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-ink3">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.color, opacity: 0.8 }} />
      {a.label}
    </span>
  );
}

export default function TaskRow({ task, starrable, showDo = true, indent, compact }) {
  const { toggleTask, setOpenTaskId, top3, toggleTop3 } = useApp();
  const done = task.status === 'done';
  const overdue = !done && task.dueDate && task.dueDate < TODAY;
  const dueSoon = !done && task.dueDate && task.dueDate <= TODAY;
  const checklistDone = task.checklist?.filter((c) => c.done).length || 0;
  const starred = top3.includes(task.id);

  return (
    <div
      onClick={() => setOpenTaskId(task.id)}
      className={cx(
        'group flex cursor-pointer items-center gap-3 rounded-xl px-3 transition hover:bg-white/[0.03]',
        compact ? 'py-2' : 'py-2.5',
        indent && 'ml-7 border-l border-line pl-4 rounded-l-none'
      )}
    >
      <Check3 checked={done} onChange={() => toggleTask(task.id)} label={`Complete ${task.title}`} />
      <div className="min-w-0 flex-1">
        <div className={cx('truncate text-[13.5px]', done ? 'text-ink3 line-through decoration-ink3/60' : 'text-ink')}>
          {task.title}
        </div>
        {!compact && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {task.courseId ? <CourseTag courseId={task.courseId} /> : <AreaTag area={task.area} />}
            {showDo && task.doDate && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink3">
                <CalendarClock size={11} />
                {relDay(task.doDate)}
                {task.doTime && ` · ${fmtTime(task.doTime)}`}
              </span>
            )}
            {task.dueDate && (
              <span className={cx('text-[11px]', overdue ? 'text-danger' : dueSoon ? 'text-warning' : 'text-ink3')}>
                due {relDay(task.dueDate).toLowerCase()}
              </span>
            )}
            {task.recurrence && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink3">
                <Repeat size={10} />
                {task.recurrence}
              </span>
            )}
            {task.checklist?.length > 0 && (
              <span className="text-[11px] text-ink3 tabular-nums">
                {checklistDone}/{task.checklist.length}
              </span>
            )}
          </div>
        )}
      </div>
      <span className="hidden text-[11px] tabular-nums text-ink3 sm:inline">{fmtDur(task.estMin)}</span>
      <PriorityFlag p={task.priority} />
      {starrable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTop3(task.id);
          }}
          aria-label={starred ? 'Remove from top 3' : 'Add to top 3'}
          className={cx('transition', starred ? 'text-accent' : 'text-ink3/40 hover:text-ink2')}
        >
          <Star size={15} fill={starred ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}
