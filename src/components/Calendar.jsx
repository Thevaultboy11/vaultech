import { ChevronLeft, ChevronRight, Lock, MousePointerClick, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { DOW, TODAY, addDays, dow, fmtDur, fmtShort, fmtTime, fromMin, nowMin, relDay, toMin, weekDays } from '../lib/dates';
import { Tip } from './Tutorial';
import { useApp } from '../store';
import { Button, Card, Callout, EmptyState, Field, Modal, PageHeader, Toggle, cx } from './ui';
import { PriorityFlag } from './tasks/TaskRow';

export const BLOCK_TYPES = {
  class: { label: 'Class', color: '#7EC8E3' },
  study: { label: 'Study', color: '#A78BFA' },
  job: { label: 'Job', color: '#F5A97F' },
  gym: { label: 'Gym', color: '#4ADE80' },
  creative: { label: 'Creative', color: '#F472B6' },
  personal: { label: 'Personal', color: '#FBBF24' },
};

const START_H = 7;
const END_H = 23;
const HOUR = 46;
const HOURS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
const yOf = (min) => ((min - START_H * 60) / 60) * HOUR;

function AddBlockModal({ draft, onClose }) {
  const { addBlock, addRepeatingBlock, toast, tasks } = useApp();
  const [form, setForm] = useState({ repeat: false, until: addDays(draft.date, 7 * 14), ...draft });
  if (!draft) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === 'type' ? { protected: v === 'creative' } : {}) }));
  const save = () => {
    if (toMin(form.end) <= toMin(form.start)) return;
    const block = {
      title: form.title || BLOCK_TYPES[form.type].label,
      type: form.type,
      start: `${form.date}T${form.start}`,
      end: `${form.date}T${form.end}`,
      protected: form.protected,
      linkedTaskId: form.linkedTaskId || null,
    };
    if (form.repeat) {
      const made = addRepeatingBlock(block, form.until);
      toast(`Added ${made.length} weekly blocks`, { sub: `${DOW[dow(form.date)]}s ${fmtTime(form.start)}–${fmtTime(form.end)} until ${fmtShort(form.until)}` });
    } else {
      addBlock(block);
      toast('Block added', { sub: `${relDay(form.date)} · ${fmtTime(form.start)}–${fmtTime(form.end)}` });
    }
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Add block"
      sub={`${DOW[dow(form.date)]}, ${fmtShort(form.date)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Add block</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <input autoFocus className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Caches deep-dive" />
        </Field>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink2">Type</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(BLOCK_TYPES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => set('type', k)}
                className={cx('inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition', form.type === k ? 'border-transparent text-ink' : 'border-line text-ink3')}
                style={form.type === k ? { background: `${v.color}26`, color: v.color } : undefined}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} />
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Start">
            <input type="time" step={900} className="input" value={form.start} onChange={(e) => set('start', e.target.value)} />
          </Field>
          <Field label="End">
            <input type="time" step={900} className="input" value={form.end} onChange={(e) => set('end', e.target.value)} />
          </Field>
        </div>
        <Field label="Link a task (optional)">
          <select className="input" value={form.linkedTaskId || ''} onChange={(e) => set('linkedTaskId', e.target.value)}>
            <option value="">—</option>
            {tasks
              .filter((t) => t.status !== 'done')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </Field>
        <div className="rounded-xl border border-line px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px]">Repeat weekly</div>
              <div className="text-[11px] text-ink3">Every {DOW[dow(form.date)]} — good for classes, gym, job shifts.</div>
            </div>
            <Toggle checked={form.repeat} onChange={(v) => set('repeat', v)} />
          </div>
          {form.repeat && (
            <div className="mt-3">
              <Field label="Until">
                <input type="date" className="input" min={form.date} value={form.until} onChange={(e) => set('until', e.target.value)} />
              </Field>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[13px]">
              <Lock size={12} className="text-ink3" /> Protected
            </div>
            <div className="text-[11px] text-ink3">Auto-Plan won’t move or overwrite it.</div>
          </div>
          <Toggle checked={form.protected} onChange={(v) => set('protected', v)} />
        </div>
      </div>
    </Modal>
  );
}

function BlockModal({ block, onClose }) {
  const { tasks, timeBlocks, removeBlock, removeSeries, setOpenTaskId, toast } = useApp();
  if (!block) return null;
  const t = BLOCK_TYPES[block.type];
  const task = tasks.find((x) => x.id === block.linkedTaskId);
  const date = block.start.slice(0, 10);
  return (
    <Modal
      open
      onClose={onClose}
      title={block.title}
      sub={`${relDay(date)} · ${fmtTime(block.start.slice(11))}–${fmtTime(block.end.slice(11))}`}
      footer={
        <>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => {
              removeBlock(block.id);
              toast('Block removed', { tone: 'muted' });
              onClose();
            }}
          >
            Remove
          </Button>
          {block.seriesId && (
            <Button
              variant="ghost"
              size="sm"
                onClick={() => {
                const n = timeBlocks.filter((b) => b.seriesId === block.seriesId).length;
                removeSeries(block.seriesId);
                toast(`Removed ${n} weekly blocks`, { tone: 'muted' });
                onClose();
              }}
            >
              Remove every week
            </Button>
          )}
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
          <span className="text-ink2">{t.label}</span>
          {block.protected && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-ink2">
              <Lock size={10} /> Protected
            </span>
          )}
          {block.auto && <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[11px] text-accent">Auto-planned</span>}
        </div>
        {block.protected && <p className="text-xs text-ink3">Protected — Auto-Plan won’t overwrite it. You can still remove it yourself.</p>}
        {task && (
          <button
            onClick={() => {
              onClose();
              setOpenTaskId(task.id);
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-left text-[13px] hover:border-ink3/40"
          >
            <PriorityFlag p={task.priority} />
            <span className="flex-1 truncate">{task.title}</span>
            <span className="text-[11px] text-ink3">open</span>
          </button>
        )}
      </div>
    </Modal>
  );
}

export default function Calendar() {
  const { timeBlocks, tasks, settings, autoPlan, addBlock, toast } = useApp();
  const [anchor, setAnchor] = useState(TODAY);
  const [draft, setDraft] = useState(null);
  const [openBlock, setOpenBlock] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const days = weekDays(anchor, settings.weekStartsOn);

  const linked = new Set(timeBlocks.map((b) => b.linkedTaskId).filter(Boolean));
  const parents = new Set(tasks.map((t) => t.parentId).filter(Boolean));
  const unscheduled = tasks.filter((t) => t.status !== 'done' && !linked.has(t.id) && !parents.has(t.id));
  const now = nowMin();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const onSlot = (date, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const min = START_H * 60 + Math.floor(((e.clientY - rect.top) / HOUR) * 2) * 30;
    const start = fromMin(Math.min(min, END_H * 60 - 30));
    if (selectedTask) {
      const dur = Math.max(30, Math.min(180, Math.round(selectedTask.estMin / 30) * 30));
      addBlock({
        title: selectedTask.title,
        type: selectedTask.area === 'job' ? 'job' : selectedTask.area === 'school' ? 'study' : 'personal',
        start: `${date}T${start}`,
        end: `${date}T${fromMin(Math.min(toMin(start) + dur, END_H * 60))}`,
        linkedTaskId: selectedTask.id,
      });
      toast('Scheduled', { sub: `${selectedTask.title} · ${relDay(date)} ${fmtTime(start)}` });
      setSelectedTaskId(null);
      return;
    }
    setDraft({ title: '', type: 'study', date, start, end: fromMin(Math.min(toMin(start) + 60, END_H * 60)), protected: false, linkedTaskId: '' });
  };

  return (
    <div>
      <PageHeader
        title={`${fmtShort(days[0])} – ${fmtShort(days[6])}`}
        sub="Click an empty slot to add a block."
        actions={
          <>
            <div className="flex items-center rounded-full border border-line bg-surface">
              <button className="p-2 text-ink3 hover:text-ink" onClick={() => setAnchor(addDays(anchor, -7))} aria-label="Previous week">
                <ChevronLeft size={15} />
              </button>
              <button className="px-2 text-xs text-ink2 hover:text-ink" onClick={() => setAnchor(TODAY)}>
                This week
              </button>
              <button className="p-2 text-ink3 hover:text-ink" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Next week">
                <ChevronRight size={15} />
              </button>
            </div>
            <Button icon={Wand2} onClick={autoPlan}>
              Auto-Plan
            </Button>
          </>
        }
      />

      <Tip id="calendar" />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {Object.entries(BLOCK_TYPES).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs text-ink2">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: v.color }} />
            {v.label}
            {k === 'creative' && <Lock size={11} className="text-ink3" />}
          </span>
        ))}
        <span className="text-[11px] text-ink3 sm:ml-auto">Creative blocks are protected — Auto-Plan won’t overwrite them.</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden p-0 sm:p-0" style={{ padding: 0 }}>
          {selectedTask && (
            <div className="flex items-center gap-2 border-b border-accent/20 bg-accent/[0.07] px-4 py-2.5 text-xs text-accent">
              <MousePointerClick size={13} />
              Click an empty slot to place “{selectedTask.title}”.
              <button className="ml-auto text-ink3 hover:text-ink" onClick={() => setSelectedTaskId(null)}>
                Cancel
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Day headers */}
              <div className="sticky top-0 z-10 grid grid-cols-[52px_repeat(7,1fr)] border-b border-line bg-surface">
                <div />
                {days.map((d) => {
                  const isToday = d === TODAY;
                  return (
                    <div key={d} className="border-l border-line px-2 py-2.5 text-center">
                      <div className={cx('text-[11px] uppercase tracking-wider', isToday ? 'text-accent' : 'text-ink3')}>{DOW[dow(d)]}</div>
                      <div
                        className={cx(
                          'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                          isToday ? 'bg-accent text-bg' : 'text-ink'
                        )}
                      >
                        {Number(d.slice(8))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="relative grid grid-cols-[52px_repeat(7,1fr)]" style={{ height: HOURS.length * HOUR }}>
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-ink3" style={{ top: (h - START_H) * HOUR }}>
                      {h === START_H ? '' : fmtTime(fromMin(h * 60)).replace(':00', '')}
                    </div>
                  ))}
                </div>
                {days.map((d) => {
                  const blocks = timeBlocks.filter((b) => b.start.startsWith(d));
                  const isToday = d === TODAY;
                  return (
                    <div
                      key={d}
                      onClick={(e) => onSlot(d, e)}
                      className={cx(
                        'relative cursor-cell border-l border-line',
                        isToday && 'bg-accent/[0.025]',
                        selectedTask && 'hover:bg-accent/[0.05]'
                      )}
                    >
                      {HOURS.map((h) => (
                        <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-line/60" style={{ top: (h - START_H) * HOUR }} />
                      ))}
                      {blocks.map((b) => {
                        const s = toMin(b.start.slice(11));
                        const e = toMin(b.end.slice(11));
                        const t = BLOCK_TYPES[b.type];
                        const h = Math.max(20, yOf(e) - yOf(s) - 2);
                        return (
                          <button
                            key={b.id}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setOpenBlock(b);
                            }}
                            className={cx(
                              'absolute left-1 right-1 overflow-hidden rounded-lg px-2 py-1 text-left transition hover:brightness-125',
                              b.auto && 'outline outline-1 outline-dashed outline-accent/50'
                            )}
                            style={{
                              top: yOf(s) + 1,
                              height: h,
                              background: `${t.color}1F`,
                              boxShadow: `inset 2px 0 0 ${t.color}`,
                            }}
                          >
                            <div className="flex items-center gap-1 text-[11px] font-medium leading-tight" style={{ color: t.color }}>
                              {b.protected && <Lock size={9} className="shrink-0" />}
                              {b.auto && <Sparkles size={9} className="shrink-0" />}
                              <span className="truncate">{b.title}</span>
                            </div>
                            {h > 34 && (
                              <div className="mt-0.5 text-[10px] tabular-nums text-ink3">
                                {fmtTime(b.start.slice(11))}–{fmtTime(b.end.slice(11))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                      {isToday && now >= START_H * 60 && now <= END_H * 60 && (
                        <div className="pointer-events-none absolute inset-x-0 z-[5] flex items-center" style={{ top: yOf(now) }}>
                          <span className="-ml-1 h-2 w-2 rounded-full bg-danger" />
                          <span className="h-px flex-1 bg-danger/70" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold">Unscheduled</span>
              <span className="text-[11px] tabular-nums text-ink3">{unscheduled.length}</span>
            </div>
            <p className="mb-3 text-[11px] text-ink3">Pick one, then click a slot. (Drag in the real thing.)</p>
            <div className="-mx-1 max-h-[520px] space-y-1 overflow-y-auto px-1">
              {unscheduled.length ? (
                unscheduled.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTaskId(selectedTaskId === t.id ? null : t.id)}
                    className={cx(
                      'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition',
                      selectedTaskId === t.id ? 'border-accent/50 bg-accent/[0.08]' : 'border-line hover:border-ink3/30'
                    )}
                  >
                    <PriorityFlag p={t.priority} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px]">{t.title}</span>
                      <span className="text-[10.5px] text-ink3">
                        {fmtDur(t.estMin)}
                        {t.dueDate && ` · due ${relDay(t.dueDate).toLowerCase()}`}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <EmptyState title={tasks.length ? 'Everything has a slot' : 'No tasks yet'} text={tasks.length ? 'Nice. Nothing floating.' : 'Tasks you add show up here to schedule.'} compact />
              )}
            </div>
          </Card>
          <Callout icon={Wand2}>
            <b className="text-ink">Auto-Plan</b> fills free hours with your highest-priority unscheduled tasks. It never touches protected blocks or classes.
          </Callout>
          <Button
            variant="outline"
            icon={Plus}
            className="w-full"
            onClick={() => setDraft({ title: '', type: 'study', date: TODAY, start: '21:00', end: '22:00', protected: false, linkedTaskId: '' })}
          >
            Add block
          </Button>
        </div>
      </div>

      {draft && <AddBlockModal draft={draft} onClose={() => setDraft(null)} />}
      {openBlock && <BlockModal block={openBlock} onClose={() => setOpenBlock(null)} />}
    </div>
  );
}
