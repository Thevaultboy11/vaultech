import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { fmtDur } from '../../lib/dates';
import { useApp } from '../../store';
import { AREA, Button, Check3, Drawer, Field, PRIORITY, Segmented, cx } from '../ui';
import { CourseTag } from './TaskRow';

export default function TaskDrawer() {
  const { tasks, openTaskId, setOpenTaskId, updateTask, toggleTask, deleteTask, courses, toast } = useApp();
  const task = tasks.find((t) => t.id === openTaskId);
  const [newItem, setNewItem] = useState('');
  const close = () => setOpenTaskId(null);

  const parent = task?.parentId ? tasks.find((t) => t.id === task.parentId) : null;
  const children = task ? tasks.filter((t) => t.parentId === task.id) : [];

  const setItem = (id, patch) =>
    updateTask(task.id, { checklist: task.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <Drawer open={!!task} onClose={close} title="Task">
      {task && (
        <div className="space-y-6 p-5">
          <div className="flex items-start gap-3">
            <div className="pt-1.5">
              <Check3 checked={task.status === 'done'} onChange={() => toggleTask(task.id)} size={20} />
            </div>
            <textarea
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              rows={2}
              className="w-full resize-none bg-transparent text-lg font-semibold leading-snug tracking-tight text-ink outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-ink3">
            {task.courseId && <CourseTag courseId={task.courseId} />}
            <span>{task.project}</span>
            {parent && (
              <button onClick={() => setOpenTaskId(parent.id)} className="text-accent hover:underline">
                ↑ {parent.title}
              </button>
            )}
          </div>

          <Segmented
            options={[
              { value: 'todo', label: 'To do' },
              { value: 'doing', label: 'Doing' },
              { value: 'done', label: 'Done' },
            ]}
            value={task.status}
            onChange={(v) => updateTask(task.id, { status: v })}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label">Checklist</span>
              <span className="text-[11px] tabular-nums text-ink3">
                {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
              </span>
            </div>
            <div className="space-y-1">
              {task.checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
                  <Check3 checked={c.done} onChange={(v) => setItem(c.id, { done: v })} size={16} />
                  <span className={cx('text-[13px]', c.done ? 'text-ink3 line-through' : 'text-ink2')}>{c.text}</span>
                </div>
              ))}
              <form
                className="flex items-center gap-2 px-1 pt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newItem.trim()) return;
                  updateTask(task.id, { checklist: [...task.checklist, { id: `c${Date.now()}`, text: newItem.trim(), done: false }] });
                  setNewItem('');
                }}
              >
                <Plus size={14} className="text-ink3" />
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add a step"
                  className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink3"
                />
              </form>
            </div>
          </div>

          {children.length > 0 && (
            <div>
              <span className="label">Subtasks</span>
              <div className="mt-2 space-y-1">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setOpenTaskId(c.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink2 hover:bg-white/[0.04]"
                  >
                    <span className={cx('h-1.5 w-1.5 rounded-full', c.status === 'done' ? 'bg-success' : c.status === 'doing' ? 'bg-accent' : 'bg-ink3')} />
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Do date">
              <input type="date" className="input" value={task.doDate || ''} onChange={(e) => updateTask(task.id, { doDate: e.target.value || null })} />
            </Field>
            <Field label="Due date">
              <input type="date" className="input" value={task.dueDate || ''} onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })} />
            </Field>
            <Field label={`Estimate · ${fmtDur(task.estMin)}`}>
              <input
                type="range"
                min={10}
                max={240}
                step={5}
                value={task.estMin}
                onChange={(e) => updateTask(task.id, { estMin: Number(e.target.value) })}
                className="w-full accent-[rgb(var(--accent))]"
              />
            </Field>
            <Field label="Recurrence">
              <select className="input" value={task.recurrence || ''} onChange={(e) => updateTask(task.id, { recurrence: e.target.value || null })}>
                <option value="">None</option>
                <option>Daily</option>
                <option>Weekdays</option>
                <option>Weekly · Mon</option>
                <option>Weekly · Thu</option>
                <option>Weekly</option>
              </select>
            </Field>
            <Field label="Area">
              <select className="input" value={task.area} onChange={(e) => updateTask(task.id, { area: e.target.value })}>
                {Object.entries(AREA).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Course">
              <select className="input" value={task.courseId || ''} onChange={(e) => updateTask(task.id, { courseId: e.target.value || null })}>
                <option value="">—</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.short || c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <span className="label">Priority</span>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  onClick={() => updateTask(task.id, { priority: p })}
                  className={cx(
                    'h-7 rounded-full border px-3 text-xs font-medium transition',
                    task.priority === p ? 'border-transparent' : 'border-line text-ink3 hover:text-ink2'
                  )}
                  style={task.priority === p ? { color: PRIORITY[p].color, background: 'rgba(255,255,255,0.06)' } : undefined}
                >
                  {PRIORITY[p].label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Notes">
            <textarea
              rows={4}
              value={task.notes || ''}
              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
              placeholder="Anything future-you should know"
              className="input resize-none"
            />
          </Field>

          <div className="flex justify-between border-t border-line pt-4">
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => {
                deleteTask(task.id);
                close();
                toast('Task deleted', { tone: 'muted' });
              }}
            >
              Delete
            </Button>
            <Button size="sm" onClick={close}>
              Done editing
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
