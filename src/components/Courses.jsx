import { CalendarDays, Clock, GraduationCap, Info, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import { COURSE_COLORS } from '../data/defaults';
import { STATUS_LABEL, TOPIC_STATUSES, gapLabel } from '../lib/courses';
import { TODAY, addDays, diffDays, fmtDur, fmtShort } from '../lib/dates';
import { useApp } from '../store';
import { Tip } from './Tutorial';
import { Button, Callout, Card, EmptyState, Field, FilterChip, Modal, PageHeader, Ring, cx } from './ui';

const STATUS_STYLE = {
  not_started: 'bg-white/[0.05] text-ink3',
  studied: 'bg-accent/12 text-accent',
  practiced: 'bg-[#A78BFA]/15 text-[#C4B5FD]',
  mastered: 'bg-success/12 text-success',
};

function StatusPicker({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-bg p-0.5">
      {TOPIC_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          title={STATUS_LABEL[s]}
          className={cx('h-6 rounded-full px-2 text-[10.5px] font-medium transition', value === s ? STATUS_STYLE[s] : 'text-ink3 hover:text-ink2')}
        >
          {s === 'not_started' ? '—' : STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

function TopicRow({ topic, onChange, onDelete }) {
  const taught = topic.classDate <= TODAY;
  const behind = taught && topic.status === 'not_started';
  const ahead = !taught && topic.status !== 'not_started';
  return (
    <div className={cx('group relative flex flex-col gap-2 rounded-xl px-3 py-2.5 transition sm:flex-row sm:items-center sm:gap-4', behind ? 'bg-danger/[0.05]' : 'hover:bg-white/[0.025]')}>
      {behind && <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-danger" />}
      {ahead && <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-success" />}
      <div className="min-w-0 flex-1">
        <div className={cx('text-[13.5px]', topic.status === 'mastered' ? 'text-ink2' : 'text-ink')}>{topic.title}</div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink3">
          <span>
            {taught ? 'Taught' : 'Class'} {fmtShort(topic.classDate)}
          </span>
          <span>{fmtDur(topic.estMin)}</span>
          {behind && <span className="text-danger">behind</span>}
          {ahead && <span className="text-success">ahead</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusPicker value={topic.status} onChange={onChange} />
        <button onClick={onDelete} className="text-ink3 opacity-0 transition hover:text-danger group-hover:opacity-100" aria-label="Delete topic">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function CourseModal({ course, onClose }) {
  const { addCourse, updateCourse, courses } = useApp();
  const [f, setF] = useState(
    course
      ? { ...course, milestoneLabel: course.milestone?.label || '', milestoneDate: course.milestone?.date || '' }
      : { short: '', name: '', code: '', professor: '', schedule: '', color: COURSE_COLORS[courses.length % COURSE_COLORS.length], milestoneLabel: '', milestoneDate: '' }
  );
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = () => {
    const data = {
      short: f.short.trim(),
      name: f.name.trim() || f.short.trim(),
      code: f.code.trim(),
      professor: f.professor.trim() || null,
      schedule: f.schedule.trim(),
      color: f.color,
      milestone: f.milestoneDate ? { label: f.milestoneLabel.trim() || 'Milestone', date: f.milestoneDate } : null,
    };
    if (course) updateCourse(course.id, data);
    else addCourse(data);
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={course ? 'Edit course' : 'Add course'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!f.short.trim() && !f.name.trim()} onClick={save}>
            {course ? 'Save' : 'Add course'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <Field label="Short name" hint="Used in quick-add">
            <input autoFocus className="input" value={f.short} onChange={set('short')} placeholder="CSO" />
          </Field>
          <Field label="Full name">
            <input className="input" value={f.name} onChange={set('name')} placeholder="Computer Systems Organization" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course code">
            <input className="input" value={f.code} onChange={set('code')} placeholder="CS-UH 2010" />
          </Field>
          <Field label="Professor">
            <input className="input" value={f.professor || ''} onChange={set('professor')} placeholder="Prof. …" />
          </Field>
        </div>
        <Field label="Schedule">
          <input className="input" value={f.schedule} onChange={set('schedule')} placeholder="Mon/Wed 11:20 · Recitation Fri 10:00" />
        </Field>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink2">Color</span>
          <div className="flex gap-2">
            {COURSE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setF((x) => ({ ...x, color: c }))}
                className={cx('h-7 w-7 rounded-full ring-offset-2 ring-offset-surface', f.color === c && 'ring-2 ring-ink2')}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Next milestone (optional)">
            <input className="input" value={f.milestoneLabel} onChange={set('milestoneLabel')} placeholder="Midterm" />
          </Field>
          <Field label="Milestone date">
            <input type="date" className="input" value={f.milestoneDate} onChange={set('milestoneDate')} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function AddTopicForm({ course }) {
  const { addTopic } = useApp();
  const last = course.topics[course.topics.length - 1];
  const [f, setF] = useState({ title: '', classDate: last ? addDays(last.classDate, 2) : TODAY, estMin: 45 });
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button variant="outline" size="sm" icon={Plus} onClick={() => setOpen(true)}>
        Add topic
      </Button>
    );
  return (
    <form
      className="flex flex-col gap-2 rounded-xl border border-line bg-bg/60 p-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.title.trim()) return;
        addTopic(course.id, { title: f.title.trim(), classDate: f.classDate, estMin: Number(f.estMin) || 45 });
        setF({ title: '', classDate: addDays(f.classDate, 2), estMin: f.estMin });
      }}
    >
      <Field label="Topic">
        <input autoFocus className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Pipelining & hazards" />
      </Field>
      <Field label="Taught on">
        <input type="date" className="input" value={f.classDate} onChange={(e) => setF({ ...f, classDate: e.target.value })} />
      </Field>
      <Field label="Est. min">
        <input type="number" min={5} step={5} className="input w-24" value={f.estMin} onChange={(e) => setF({ ...f, estMin: e.target.value })} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Add</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Done
        </Button>
      </div>
    </form>
  );
}

const FILTERS = [{ id: 'all', label: 'All' }, { id: 'behind', label: 'Behind' }, ...TOPIC_STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] }))];

export default function Courses() {
  const { courses, selectedCourseId, setSelectedCourseId, setTopicStatus, deleteTopic, deleteCourse } = useApp();
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'new' | course
  const [confirmDelete, setConfirmDelete] = useState(false);
  const course = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const header = (
    <PageHeader
      title="Baseline gap tracker"
      sub="Catch up to class, then stay a step ahead."
      actions={
        <Button icon={Plus} onClick={() => setModal('new')}>
          Add course
        </Button>
      }
    />
  );

  if (!course)
    return (
      <div>
        {header}
        <Tip id="courses" />
        <EmptyState icon={GraduationCap} title="No courses yet" text="Add each class you’re taking. Then add its syllabus topics with the dates they’re taught." cta="Add your first course" onCta={() => setModal('new')} />
        {modal && <CourseModal course={modal === 'new' ? null : modal} onClose={() => setModal(null)} />}
      </div>
    );

  const match = (t) => {
    if (filter === 'all') return true;
    if (filter === 'behind') return t.classDate <= TODAY && t.status === 'not_started';
    return t.status === filter;
  };
  const past = course.topics.filter((t) => t.classDate <= TODAY && match(t));
  const future = course.topics.filter((t) => t.classDate > TODAY && match(t));
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, course.topics.filter((t) => (f.id === 'all' ? true : f.id === 'behind' ? t.classDate <= TODAY && t.status === 'not_started' : t.status === f.id)).length])
  );
  const gap = course.gapCount;
  const daysTo = course.milestone?.date ? diffDays(course.milestone.date, TODAY) : null;

  return (
    <div>
      {header}
      <Tip id="courses" />

      <Callout icon={Info} className="mb-6">
        <b className="text-ink">Gap</b> = syllabus topics already taught that you haven’t touched yet, minus topics you’ve covered before class. Goal: get every course to{' '}
        <b className="text-ink">0</b>, then go negative (ahead).
      </Callout>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {courses.map((c) => {
            const active = c.id === course.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCourseId(c.id);
                  setFilter('all');
                  setConfirmDelete(false);
                }}
                className={cx(
                  'relative flex min-w-[220px] items-center gap-3 rounded-card border p-4 text-left transition lg:min-w-0',
                  active ? 'border-accent/30 bg-surface shadow-glow' : 'border-line bg-surface hover:border-ink3/30'
                )}
              >
                <Ring value={c.coverage} size={44} stroke={4} color={c.color}>
                  <span className="text-[10px] font-semibold tabular-nums">{Math.round(c.coverage * 100)}</span>
                </Ring>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.short || c.name}</div>
                  <div className="truncate text-[11px] text-ink3">{c.code || `${c.topics.length} topics`}</div>
                </div>
                <div className={cx('text-right text-xs font-medium tabular-nums', c.gapCount > 0 ? 'text-warning' : c.gapCount < 0 ? 'text-success' : 'text-ink2')}>
                  {c.topics.length ? gapLabel(c.gapCount) : '—'}
                  {c.hoursToCatchUp > 0 && <div className="text-[10px] font-normal text-ink3">~{c.hoursToCatchUp}h</div>}
                </div>
              </button>
            );
          })}
        </div>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: course.color }} />
                <h2 className="text-lg font-semibold tracking-tight">{course.name}</h2>
                <button onClick={() => setModal(course)} className="text-ink3 hover:text-ink" aria-label="Edit course">
                  <Pencil size={13} />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink3">
                {course.code && <span>{course.code}</span>}
                <span className="inline-flex items-center gap-1">
                  <User size={11} /> {course.professor || 'Professor not set'}
                </span>
                {course.schedule && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={11} /> {course.schedule}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="label">Gap</div>
                <div className={cx('mt-1 text-xl font-semibold tabular-nums', gap > 0 ? 'text-warning' : gap < 0 ? 'text-success' : '')}>{gap > 0 ? `+${gap}` : gap}</div>
              </div>
              <div>
                <div className="label">To catch up</div>
                <div className="mt-1 flex items-center gap-1 text-xl font-semibold tabular-nums">
                  <Clock size={14} className="text-ink3" />
                  {course.hoursToCatchUp}h
                </div>
              </div>
              {course.milestone?.date && daysTo >= 0 && (
                <div>
                  <div className="label">{course.milestone.label}</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">{daysTo === 0 ? 'Today' : `${daysTo}d`}</div>
                </div>
              )}
            </div>
          </div>

          {course.topics.length > 0 && (
            <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1">
              {FILTERS.map((f) => (
                <FilterChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} count={counts[f.id]}>
                  {f.label}
                </FilterChip>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-1">
            {!course.topics.length && (
              <EmptyState title="No syllabus topics yet" text="Add each topic with the date it’s taught in class. Past dates you haven’t started count toward your gap." compact />
            )}
            {course.topics.length > 0 && past.length + future.length === 0 && (
              <EmptyState title="Nothing here" text="No topics match this filter." cta="Show all" onCta={() => setFilter('all')} compact />
            )}
            {past.map((t) => (
              <TopicRow key={t.id} topic={t} onChange={(s) => setTopicStatus(course.id, t.id, s)} onDelete={() => deleteTopic(course.id, t.id)} />
            ))}

            {course.topics.length > 0 && (
              <div className="relative my-3 flex items-center gap-3 px-3">
                <span className="h-px flex-1 bg-accent/40" />
                <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-[10.5px] font-medium text-accent">Class baseline · today</span>
                <span className="h-px flex-1 bg-accent/40" />
              </div>
            )}

            {future.map((t) => (
              <TopicRow key={t.id} topic={t} onChange={(s) => setTopicStatus(course.id, t.id, s)} onDelete={() => deleteTopic(course.id, t.id)} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
            <AddTopicForm key={course.id} course={course} />
            {confirmDelete ? (
              <span className="flex items-center gap-2 text-xs text-ink3">
                Delete {course.short || course.name} and its topics?
                <Button size="sm" variant="danger" onClick={() => deleteCourse(course.id)}>
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                Delete course
              </Button>
            )}
          </div>
        </Card>
      </div>

      {modal && <CourseModal course={modal === 'new' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
