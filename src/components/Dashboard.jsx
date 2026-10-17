import { ArrowUpRight, BookOpen, Flame, GraduationCap, Plus, Smartphone, Target, Timer, TrendingDown, X } from 'lucide-react';
import { useState } from 'react';
import { DOW, TODAY, addDays, diffDays, dow, fmtDur, fmtLong } from '../lib/dates';
import { gapLabel } from '../lib/courses';
import { habitDone, habitStrength, habitStreak, habitWeekCount, readingPace, useApp } from '../store';
import { BarList, Sparkline } from './charts';
import TaskRow from './tasks/TaskRow';
import { GettingStarted, Tip } from './Tutorial';
import { Button, Card, CardHeader, EmptyState, Progress, Ring, cx } from './ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function GapCard({ course }) {
  const { go } = useApp();
  const gap = course.gapCount;
  const tone = gap > 0 ? 'text-warning' : gap < 0 ? 'text-success' : 'text-ink';
  const daysTo = course.milestone?.date ? diffDays(course.milestone.date, TODAY) : null;
  return (
    <Card onClick={() => go('courses', { courseId: course.id })} className="group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: course.color }} />
            <span className="truncate text-sm font-semibold">{course.short || course.name}</span>
            {course.code && <span className="truncate text-[11px] text-ink3">{course.code}</span>}
          </div>
          <div className={cx('mt-3 text-2xl font-semibold tracking-tight tabular-nums', tone)}>{course.topics.length ? gapLabel(gap) : 'No topics yet'}</div>
          <div className="mt-1 text-xs text-ink3">
            {!course.topics.length
              ? 'Add the syllabus to start tracking'
              : course.hoursToCatchUp > 0
                ? `~${course.hoursToCatchUp}h to catch up`
                : gap < 0
                  ? 'Ahead of class — nice'
                  : 'Matching class pace'}
          </div>
        </div>
        <Ring value={course.coverage} size={54} stroke={5} color={course.color}>
          <span className="text-[11px] font-semibold tabular-nums">{Math.round(course.coverage * 100)}%</span>
        </Ring>
      </div>
      {course.milestone?.date && daysTo >= 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px]">
          <span className="text-ink3">{course.milestone.label}</span>
          <span className={daysTo <= 6 && gap > 0 ? 'text-warning' : 'text-ink2'}>{daysTo === 0 ? 'today' : daysTo === 1 ? 'tomorrow' : `in ${daysTo} days`}</span>
        </div>
      )}
      <ArrowUpRight size={14} className="absolute right-3 top-3 text-ink3 opacity-0 transition group-hover:opacity-100" />
    </Card>
  );
}

function Goals() {
  const { derived, addGoal, updateGoal, deleteGoal } = useApp();
  const [text, setText] = useState('');
  return (
    <Card>
      <CardHeader title="This week" icon={Target} sub="Click a bar to set progress." />
      <div className="space-y-4">
        {derived.goals.map((g) => (
          <div key={g.id} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-ink2">{g.text}</span>
              <span className="flex items-center gap-1.5 text-[11px] tabular-nums text-ink3">
                {g.progress}%
                <button onClick={() => deleteGoal(g.id)} className="opacity-0 transition hover:text-ink group-hover:opacity-100" aria-label="Delete goal">
                  <X size={11} />
                </button>
              </span>
            </div>
            <div
              className="cursor-pointer py-1"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                updateGoal(g.id, { progress: Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 10) * 10 });
              }}
            >
              <Progress value={g.progress / 100} height={4} color={g.progress >= 100 ? '#4ADE80' : undefined} />
            </div>
          </div>
        ))}
        {!derived.goals.length && <p className="text-xs text-ink3">No goals for this week yet. What would make it a good one?</p>}
        <form
          className="flex items-center gap-2 border-t border-line pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            addGoal(text.trim());
            setText('');
          }}
        >
          <Plus size={14} className="text-ink3" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a goal for this week" className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink3" />
        </form>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { profile, courses, tasks, top3, habits, books, derived, screenTimeLogs, settings, go, setHabitToday } = useApp();
  const topTasks = top3.map((id) => tasks.find((t) => t.id === id)).filter(Boolean);
  const reading = books.find((b) => b.status === 'reading');
  const pace = reading ? readingPace(reading, settings.readingDays) : null;
  const doneToday = tasks.filter((t) => t.status === 'done' && t.doDate === TODAY).length;
  const openToday = derived.openToday.length;
  const nextMilestone = courses
    .filter((c) => c.milestone?.date && c.milestone.date >= TODAY)
    .sort((a, b) => a.milestone.date.localeCompare(b.milestone.date))[0];
  const week = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6));
  const screenByDay = week.map((d) => screenTimeLogs.find((l) => l.date === d)?.totalMin || 0);
  const todayScreen = screenByDay[6];
  const yesterdayScreen = screenByDay[5];
  const hasScreen = screenTimeLogs.length > 0;
  const focusTotal = derived.focusByCourse.reduce((s, f) => s + f.min, 0);
  const first = profile.name.trim().split(/\s+/)[0];

  const summary = [
    nextMilestone && `${nextMilestone.short || nextMilestone.name} ${nextMilestone.milestone.label || 'milestone'} in ${diffDays(nextMilestone.milestone.date, TODAY)} days`,
    `${openToday} open for today`,
    `${doneToday} done`,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink3">{fmtLong(TODAY)}</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">
            {greeting()}
            {first ? `, ${first}` : ''}.
          </h1>
          <p className="mt-1.5 text-sm text-ink2">{summary.join(' · ')}</p>
        </div>
        <Button variant="soft" icon={Target} onClick={() => go('today')}>
          Plan today
        </Button>
      </div>

      <Tip id="dashboard" spaced={false} />
      <GettingStarted />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Baseline gap</span>
          <span className="hidden text-[11px] text-ink3 sm:inline">Gap is how many syllabus topics you're behind today's class.</span>
        </div>
        {courses.length ? (
          <div className={cx('grid gap-4', courses.length === 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : courses.length === 2 ? 'sm:grid-cols-2' : courses.length === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3')}>
            {courses.map((c) => (
              <GapCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon={GraduationCap} title="No courses yet" text="Add a course and its syllabus to see how far ahead or behind class you are." cta="Add a course" onCta={() => go('courses')} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" accent>
          <CardHeader
            title="Today’s top 3"
            sub="If only these get done, today counts."
            action={
              <Button variant="ghost" size="sm" onClick={() => go('today')}>
                Open Today
              </Button>
            }
          />
          {topTasks.length ? (
            <div className="-mx-3 space-y-0.5">
              {topTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No top 3 picked"
              text={tasks.length ? 'Star three tasks on Today.' : 'Add tasks from the top bar, then star three on Today.'}
              cta="Pick top 3"
              onCta={() => go('today')}
              compact
            />
          )}
        </Card>

        <Card onClick={reading ? () => go('reading') : undefined}>
          <CardHeader title="Reading pace" icon={BookOpen} />
          {reading && pace ? (
            <>
              <div className="text-sm font-medium leading-snug">{reading.title}</div>
              <div className="text-xs text-ink3">{reading.author}</div>
              <Progress value={reading.pagesRead / reading.totalPages} className="mt-4" />
              <div className="mt-2 flex justify-between text-[11px] tabular-nums text-ink3">
                <span>
                  {reading.pagesRead}/{reading.totalPages} pages
                </span>
                <span>
                  day {pace.day} of {settings.readingDays}
                </span>
              </div>
              <div className={cx('mt-4 rounded-xl px-3 py-2.5 text-xs', pace.behind ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
                Need <b className="tabular-nums">{pace.needed} pages/day</b> to finish on time
                {pace.behind && <span className="text-warning/80"> · averaging {pace.recentPace} lately</span>}
              </div>
            </>
          ) : (
            <EmptyState title="Nothing on the go" text="Add a book and press Start." cta="Pick a book" onCta={() => go('reading')} compact />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Habits"
            icon={Flame}
            sub={habits.length ? 'Tap a ring to tick today.' : undefined}
            action={
              <Button variant="ghost" size="sm" onClick={() => go('habits')}>
                All habits
              </Button>
            }
          />
          {habits.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {habits.slice(0, 6).map((h) => {
                const done = habitDone(h);
                const strength = habitStrength(h);
                return (
                  <button
                    key={h.id}
                    onClick={() => setHabitToday(h.id)}
                    className={cx('flex flex-col items-center gap-2 rounded-xl border px-2 py-4 transition', done ? 'border-accent/30 bg-accent/[0.06]' : 'border-line hover:border-ink3/30')}
                  >
                    <Ring value={strength / 100} size={58} stroke={5}>
                      <span className="text-xs font-semibold tabular-nums">{strength}%</span>
                    </Ring>
                    <span className="max-w-full truncate px-1 text-[13px] font-medium">{h.name}</span>
                    <span className="text-[11px] tabular-nums text-ink3">
                      {habitWeekCount(h, settings.weekStartsOn)}/{h.frequencyPerWeek} this week
                      {habitStreak(h) > 1 ? ` · ${habitStreak(h)}d streak` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No habits yet" text="Gym, reading, a creative block — start with one or two." cta="Add a habit" onCta={() => go('habits')} compact />
          )}
        </Card>

        <Goals />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" onClick={focusTotal ? () => go('focus') : undefined}>
          <CardHeader title="Focus this week" icon={Timer} sub={focusTotal ? `${fmtDur(focusTotal)} grown` : undefined} />
          {focusTotal ? (
            <BarList items={derived.focusByCourse.filter((f) => f.min || f.id !== 'other').map((f) => ({ label: f.label, value: f.min, color: f.color }))} />
          ) : (
            <EmptyState title="No focus sessions this week" text="Start a 25-minute block and grow your first tree." cta="Start focusing" onCta={() => go('focus')} compact />
          )}
        </Card>

        <Card onClick={() => go('screen')}>
          <CardHeader
            title="Screen time"
            icon={Smartphone}
            action={
              yesterdayScreen > settings.screenLimitMin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] text-danger">
                  <TrendingDown size={11} className="rotate-180" /> over yesterday
                </span>
              )
            }
          />
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{fmtDur(todayScreen)}</span>
            <span className="text-xs text-ink3">today · limit {fmtDur(settings.screenLimitMin)}</span>
          </div>
          {hasScreen ? (
            <div className="mt-3">
              <Sparkline values={screenByDay} limit={settings.screenLimitMin} labels={week.map((d) => DOW[dow(d)][0])} />
            </div>
          ) : (
            <p className="mt-3 text-xs text-ink3">Nothing logged yet. Tap to log today’s time.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
