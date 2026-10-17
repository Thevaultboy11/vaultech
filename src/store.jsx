import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ACCENTS, DATA_VERSION, PR_LIFTS, defaultSettings, emptyData, workoutTemplates } from './data/defaults';
import { computeGap } from './lib/courses';
import { TODAY, addDays, diffDays, fmtShort, fromMin, nowMin, startOfWeek, toMin } from './lib/dates';
import { useCloudSync } from './lib/cloud/sync';
import { useGoogleCalendar } from './lib/useGoogleCalendar';
import { BUILT_IN_CALENDARS } from './googleConfig';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// Everything lives in one JSON object in localStorage under this key.
export const STORAGE_KEY = 'vault-tech-industries:data';

let uid = 0;
export const newId = (p) => `${p}${Date.now().toString(36)}${(++uid).toString(36)}`;

// ── Persistence ──────────────────────────────────────────────
function normalize(raw) {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base };
  for (const k of Object.keys(base)) {
    if (Array.isArray(base[k])) out[k] = Array.isArray(raw[k]) ? raw[k] : base[k];
  }
  out.profile = { ...base.profile, ...(raw.profile || {}) };
  out.settings = { ...defaultSettings, ...(raw.settings || {}) };
  out.courses = out.courses.map((c) => computeGap({ topics: [], ...c }));
  return out;
}

function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? normalize(JSON.parse(s)) : emptyData();
  } catch {
    return emptyData();
  }
}

// ── Habit helpers (habits store the dates they were completed) ──
export function habitDone(h, date = TODAY) {
  return h.completions.includes(date);
}

export function habitHistory(h, days = 28) {
  const set = new Set(h.completions);
  return Array.from({ length: days }, (_, i) => set.has(addDays(TODAY, i - days + 1)));
}

export function habitWeekCount(h, weekStartsOn = 1) {
  const start = startOfWeek(TODAY, weekStartsOn);
  return h.completions.filter((d) => d >= start && d <= TODAY).length;
}

export function habitStreak(h) {
  const set = new Set(h.completions);
  let n = 0;
  let d = set.has(TODAY) ? TODAY : addDays(TODAY, -1); // today not done yet doesn't break it
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// Rolling, recency-weighted score. A miss eases it down; it never resets to zero.
export function habitStrength(h) {
  const rate = Math.min(1, h.frequencyPerWeek / 7);
  const set = new Set(h.completions);
  const since = h.createdAt || TODAY;
  let num = 0;
  let den = rate * 2; // small prior so one tick isn't an instant 100%
  for (let i = 0; i < 42; i++) {
    const d = addDays(TODAY, -i);
    if (d < since && !set.has(d)) break;
    const w = Math.pow(0.93, i);
    if (set.has(d)) num += w;
    if (i > 0 || set.has(d)) den += w * rate; // today only counts once it's done
  }
  return den ? Math.min(100, Math.round((100 * num) / den)) : 0;
}

export function readingPace(book, targetDays = 14) {
  const day = Math.max(1, diffDays(TODAY, book.startDate || TODAY) + 1);
  const daysLeft = Math.max(1, targetDays - day + 1);
  const remaining = Math.max(0, book.totalPages - book.pagesRead);
  const needed = Math.ceil(remaining / daysLeft);
  const window = Math.min(3, day);
  const recent = book.log.filter((l) => diffDays(TODAY, l.date) < window && diffDays(TODAY, l.date) >= 0);
  const recentPace = Math.round(recent.reduce((s, l) => s + l.pages, 0) / window);
  const todayPages = book.log.filter((l) => l.date === TODAY).reduce((s, l) => s + l.pages, 0);
  return {
    day,
    daysLeft,
    remaining,
    needed,
    recentPace,
    todayPages,
    behind: remaining > 0 && day > 1 && recentPace < needed,
    finishDate: addDays(book.startDate || TODAY, targetDays - 1),
  };
}

export function AppProvider({ children }) {
  const initial = useRef(null);
  if (!initial.current) initial.current = loadData();
  const I = initial.current;

  const [activeView, setActiveView] = useState('dashboard');
  const [profile, setProfile] = useState(I.profile);
  const [tasks, setTasks] = useState(I.tasks);
  const [courses, setCourses] = useState(I.courses);
  const [habits, setHabits] = useState(I.habits);
  const [books, setBooks] = useState(I.books);
  const [workouts, setWorkouts] = useState(I.workouts);
  const [deals, setDeals] = useState(I.deals);
  const [jobLeads, setJobLeads] = useState(I.jobLeads);
  const [focusSessions, setFocusSessions] = useState(I.focusSessions);
  const [screenTimeLogs, setScreenTimeLogs] = useState(I.screenTimeLogs);
  const [timeBlocks, setTimeBlocks] = useState(I.timeBlocks);
  const [weeklyGoals, setWeeklyGoals] = useState(I.weeklyGoals);
  const [top3, setTop3] = useState(I.top3);
  const [notifRead, setNotifRead] = useState(I.notifRead);
  const [tutorialDone, setTutorialDone] = useState(I.tutorialDone);
  const [settings, setSettings] = useState(I.settings);
  const [toasts, setToasts] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(I.courses[0]?.id || null);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const timers = useRef({});

  // ── Save everything as one JSON object ──
  const snapshot = useMemo(
    () => ({
      version: DATA_VERSION,
      profile,
      courses: courses.map(({ gapCount, behindCount, aheadCount, hoursToCatchUp, coverage, ...c }) => c),
      tasks,
      habits,
      books,
      workouts,
      deals,
      jobLeads,
      focusSessions,
      screenTimeLogs,
      timeBlocks,
      weeklyGoals,
      top3,
      notifRead,
      tutorialDone,
      settings,
    }),
    [profile, courses, tasks, habits, books, workouts, deals, jobLeads, focusSessions, screenTimeLogs, timeBlocks, weeklyGoals, top3, notifRead, tutorialDone, settings]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [snapshot]);

  // Replace only the keys present in `part` (used by cloud sync for one section at a time)
  const applyPartial = (part) => {
    if (!part || typeof part !== 'object') return;
    const base = emptyData();
    const arr = (v) => (Array.isArray(v) ? v : []);
    const map = {
      profile: (v) => setProfile({ ...base.profile, ...(v || {}) }),
      settings: (v) => setSettings({ ...defaultSettings, ...(v || {}) }),
      courses: (v) => setCourses(arr(v).map((c) => computeGap(Array.isArray(c.topics) ? c : { ...c, topics: [] }))),
      tasks: (v) => setTasks(arr(v)),
      habits: (v) => setHabits(arr(v)),
      books: (v) => setBooks(arr(v)),
      workouts: (v) => setWorkouts(arr(v)),
      deals: (v) => setDeals(arr(v)),
      jobLeads: (v) => setJobLeads(arr(v)),
      focusSessions: (v) => setFocusSessions(arr(v)),
      screenTimeLogs: (v) => setScreenTimeLogs(arr(v)),
      timeBlocks: (v) => setTimeBlocks(arr(v)),
      weeklyGoals: (v) => setWeeklyGoals(arr(v)),
      top3: (v) => setTop3(arr(v)),
      notifRead: (v) => setNotifRead(arr(v)),
      tutorialDone: (v) => setTutorialDone(arr(v)),
    };
    for (const [k, v] of Object.entries(part)) map[k]?.(v);
    if ('courses' in part) setSelectedCourseId((cur) => (arr(part.courses).some((c) => c.id === cur) ? cur : arr(part.courses)[0]?.id || null));
  };

  const cloud = useCloudSync({ snapshot, applyAll: applyPartial });
  const gcal = useGoogleCalendar(settings.gcalCalendars || [], settings.weekStartsOn);

  // Add the built-in Google calendars once (afterwards your Settings choices win, also across devices)
  useEffect(() => {
    if (settings.gcalSeeded) return;
    setSettings((s) => {
      if (s.gcalSeeded) return s;
      const have = new Set((s.gcalCalendars || []).map((c) => c.id));
      const add = BUILT_IN_CALENDARS.filter((c) => !have.has(c.id)).map((c) => ({ ...c, enabled: true }));
      return { ...s, gcalCalendars: [...(s.gcalCalendars || []), ...add], gcalSeeded: true };
    });
  }, [settings.gcalSeeded]);

  const applyData = (raw) => {
    const d = normalize(raw);
    setProfile(d.profile);
    setCourses(d.courses);
    setTasks(d.tasks);
    setHabits(d.habits);
    setBooks(d.books);
    setWorkouts(d.workouts);
    setDeals(d.deals);
    setJobLeads(d.jobLeads);
    setFocusSessions(d.focusSessions);
    setScreenTimeLogs(d.screenTimeLogs);
    setTimeBlocks(d.timeBlocks);
    setWeeklyGoals(d.weeklyGoals);
    setTop3(d.top3);
    setNotifRead(d.notifRead);
    setTutorialDone(d.tutorialDone);
    setSettings(d.settings);
    setSelectedCourseId(d.courses[0]?.id || null);
  };

  // ── Toasts ──
  const toast = useCallback((text, opts = {}) => {
    const id = newId('toast');
    setToasts((ts) => [...ts, { id, text, sub: opts.sub, tone: opts.tone || 'accent' }]);
    timers.current[id] = setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), opts.ms || 3200);
  }, []);
  const dismissToast = (id) => {
    clearTimeout(timers.current[id]);
    setToasts((ts) => ts.filter((t) => t.id !== id));
  };

  const go = useCallback((view, opts = {}) => {
    if (opts.courseId) setSelectedCourseId(opts.courseId);
    setActiveView(view);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  // ── Tasks ──
  const updateTask = (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const toggleTask = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const done = t.status !== 'done';
    updateTask(id, { status: done ? 'done' : 'todo' });
    if (done) toast('Done', { sub: t.title, tone: 'success', ms: 2200 });
  };
  const addTask = (partial, { silent } = {}) => {
    const task = {
      id: newId('t'),
      project: partial.project || (partial.courseId ? courses.find((c) => c.id === partial.courseId)?.short : '') || 'Inbox',
      status: 'todo',
      checklist: [],
      notes: '',
      priority: 3,
      area: 'misc',
      estMin: 30,
      courseId: null,
      doDate: null,
      doTime: null,
      dueDate: null,
      recurrence: null,
      parentId: null,
      ...partial,
    };
    setTasks((ts) => [task, ...ts]);
    if (!silent) toast('Task added', { sub: task.title });
    return task;
  };
  const deleteTask = (id) => {
    setTasks((ts) => ts.filter((t) => t.id !== id).map((t) => (t.parentId === id ? { ...t, parentId: null } : t)));
    setTop3((cur) => cur.filter((x) => x !== id));
  };
  const toggleTop3 = (id) =>
    setTop3((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 3) {
        toast('Top 3 is full', { sub: 'Unstar one first — three is the point.', tone: 'warning' });
        return cur;
      }
      return [...cur, id];
    });

  // ── Courses ──
  const addCourse = (c) => {
    const course = computeGap({ id: newId('c'), topics: [], milestone: null, ...c });
    setCourses((cs) => [...cs, course]);
    setSelectedCourseId(course.id);
    toast('Course added', { sub: course.short || course.name });
    return course;
  };
  const updateCourse = (id, patch) => setCourses((cs) => cs.map((c) => (c.id === id ? computeGap({ ...c, ...patch }) : c)));
  const deleteCourse = (id) => {
    setCourses((cs) => {
      const next = cs.filter((c) => c.id !== id);
      setSelectedCourseId(next[0]?.id || null);
      return next;
    });
    setTasks((ts) => ts.map((t) => (t.courseId === id ? { ...t, courseId: null } : t)));
    toast('Course removed', { tone: 'muted' });
  };
  const addTopic = (courseId, topic) =>
    setCourses((cs) =>
      cs.map((c) => (c.id === courseId ? computeGap({ ...c, topics: [...c.topics, { id: newId('tp'), status: 'not_started', estMin: 45, ...topic }].sort((a, b) => a.classDate.localeCompare(b.classDate)) }) : c))
    );
  const deleteTopic = (courseId, topicId) =>
    setCourses((cs) => cs.map((c) => (c.id === courseId ? computeGap({ ...c, topics: c.topics.filter((t) => t.id !== topicId) }) : c)));
  const setTopicStatus = (courseId, topicId, status) =>
    setCourses((cs) =>
      cs.map((c) => (c.id === courseId ? computeGap({ ...c, topics: c.topics.map((t) => (t.id === topicId ? { ...t, status } : t)) }) : c))
    );

  // ── Habits ──
  const addHabit = (h) => {
    setHabits((hs) => [...hs, { id: newId('h'), icon: 'check', kind: null, frequencyPerWeek: 7, completions: [], createdAt: TODAY, ...h }]);
    toast('Habit added', { sub: h.name });
  };
  const deleteHabit = (id) => setHabits((hs) => hs.filter((h) => h.id !== id));
  const setHabitToday = (id, value, { silent } = {}) => {
    const h = habits.find((x) => x.id === id);
    if (!h) return;
    const cur = habitDone(h);
    const next = value ?? !cur;
    if (cur === next) return;
    const completions = next ? [...h.completions, TODAY] : h.completions.filter((d) => d !== TODAY);
    setHabits((hs) => hs.map((x) => (x.id === id ? { ...x, completions } : x)));
    if (silent) return;
    const after = habitStrength({ ...h, completions });
    if (next) toast(`${h.name} done for today`, { sub: `Strength ${after}%`, tone: 'success' });
    else toast(`${h.name} unmarked`, { sub: 'Strength eased a little — no reset.', tone: 'muted' });
  };
  const tickHabitKind = (kind) => {
    setHabits((hs) => hs.map((h) => (h.kind === kind && !h.completions.includes(TODAY) ? { ...h, completions: [...h.completions, TODAY] } : h)));
  };

  // ── Reading ──
  const addBook = (b) => {
    const book = {
      id: newId('b'),
      status: 'want',
      pagesRead: 0,
      startDate: null,
      tags: [],
      log: [],
      hue: Math.floor(Math.random() * 360),
      ...b,
    };
    if (book.status === 'reading' && !book.startDate) book.startDate = TODAY;
    if (book.status === 'read') {
      book.pagesRead = book.totalPages;
      book.finishedOn = TODAY;
    }
    setBooks((bs) => [...bs, book]);
    toast('Book added', { sub: book.title });
  };
  const deleteBook = (id) => setBooks((bs) => bs.filter((b) => b.id !== id));
  const logPages = (bookId, pages) => {
    const b = books.find((x) => x.id === bookId);
    if (!b || !pages) return;
    const pagesRead = Math.min(b.totalPages, b.pagesRead + pages);
    const finished = pagesRead >= b.totalPages;
    setBooks((bs) =>
      bs.map((x) =>
        x.id === bookId ? { ...x, pagesRead, status: finished ? 'read' : x.status, finishedOn: finished ? TODAY : x.finishedOn, log: [...x.log, { date: TODAY, pages }] } : x
      )
    );
    tickHabitKind('reading');
    toast(finished ? `Finished ${b.title}` : `Logged ${pages} pages`, {
      sub: finished ? `One more toward ${settings.readingYearGoal}.` : `${pagesRead} / ${b.totalPages}`,
      tone: 'success',
    });
  };
  const startBook = (bookId) => {
    const b = books.find((x) => x.id === bookId);
    setBooks((bs) => bs.map((x) => (x.id === bookId ? { ...x, status: 'reading', startDate: TODAY, pagesRead: 0, log: [] } : x)));
    toast('Started reading', { sub: `${b.title} · ${settings.readingDays}-day target` });
  };

  // ── Gym ──
  const addWorkout = (w) => {
    const workout = { id: newId('w'), date: TODAY, ...w };
    setWorkouts((ws) => [workout, ...ws].sort((a, b) => b.date.localeCompare(a.date)));
    tickHabitKind('gym');
    toast(`${workout.template} day logged`, { sub: habits.some((h) => h.kind === 'gym') ? 'Gym habit ticked for today' : 'Nice work', tone: 'success' });
  };
  const deleteWorkout = (id) => setWorkouts((ws) => ws.filter((w) => w.id !== id));

  // ── Deals & leads ──
  const addDeal = (d) => {
    const deal = { id: newId('d'), status: 'idea', notes: '', ...d };
    deal.margin = deal.sellPrice - deal.buyPrice - deal.fees;
    setDeals((ds) => [...ds, deal]);
    toast('Deal added', { sub: `${deal.item} · $${deal.margin} margin` });
  };
  const moveDeal = (id, status) => setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, status } : d)));
  const deleteDeal = (id) => setDeals((ds) => ds.filter((d) => d.id !== id));
  const addLead = (l) => {
    setJobLeads((ls) => [...ls, { id: newId('l'), stage: 'idea', ...l }]);
    toast('Lead added', { sub: l.company });
  };
  const moveLead = (id, stage) => setJobLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)));
  const deleteLead = (id) => setJobLeads((ls) => ls.filter((l) => l.id !== id));

  // ── Focus ──
  const addFocusSession = (s) => setFocusSessions((fs) => [...fs, { id: newId('f'), date: TODAY, ...s }]);

  // ── Screen time ──
  const logScreenTime = (category, min) =>
    setScreenTimeLogs((logs) => {
      const existing = logs.find((l) => l.date === TODAY);
      const base = existing || { id: newId('s'), date: TODAY, totalMin: 0, byCategory: ['Social', 'Entertainment', 'Study', 'Other'].map((name) => ({ name, min: 0 })) };
      const updated = {
        ...base,
        totalMin: Math.max(0, base.totalMin + min),
        byCategory: base.byCategory.map((c) => (c.name === category ? { ...c, min: Math.max(0, c.min + min) } : c)),
      };
      return existing ? logs.map((l) => (l.date === TODAY ? updated : l)) : [...logs, updated].sort((a, b) => a.date.localeCompare(b.date));
    });

  // ── Calendar ──
  const addBlock = (b) => {
    const block = { id: newId('blk'), protected: b.type === 'creative', linkedTaskId: null, ...b };
    setTimeBlocks((bs) => [...bs, block]);
    return block;
  };
  // Same block every week on the same weekday until `until` (inclusive)
  const addRepeatingBlock = (b, until) => {
    const date = b.start.slice(0, 10);
    const seriesId = newId('ser');
    const blocks = [];
    for (let d = date; d <= until && blocks.length < 60; d = addDays(d, 7)) {
      blocks.push({ id: newId('blk'), protected: b.type === 'creative', linkedTaskId: null, ...b, start: `${d}T${b.start.slice(11)}`, end: `${d}T${b.end.slice(11)}`, seriesId });
    }
    setTimeBlocks((bs) => [...bs, ...blocks]);
    return blocks;
  };
  const removeBlock = (id) => setTimeBlocks((bs) => bs.filter((b) => b.id !== id));
  const removeSeries = (seriesId) => setTimeBlocks((bs) => bs.filter((b) => b.seriesId !== seriesId));

  // Auto-Plan: drop unscheduled open tasks into free slots, never touching protected blocks.
  const autoPlan = () => {
    const linked = new Set(timeBlocks.map((b) => b.linkedTaskId).filter(Boolean));
    const parents = new Set(tasks.map((t) => t.parentId).filter(Boolean));
    const queue = tasks
      .filter((t) => t.status !== 'done' && !linked.has(t.id) && !parents.has(t.id))
      .sort((a, b) => a.priority - b.priority || (a.dueDate || '9').localeCompare(b.dueDate || '9'));
    if (!queue.length) {
      toast('Nothing to plan', { sub: 'Every open task already has a slot.', tone: 'muted' });
      return [];
    }
    const candidateStarts = ['08:30', '13:00', '16:00', '18:00', '19:00', '21:00'];
    const created = [];
    const all = [...timeBlocks, ...gcal.events.filter((ev) => !ev.allDay)]; // Google events count as busy
    const now = nowMin();
    for (let i = 0; i < 7 && created.length < 6 && queue.length; i++) {
      const date = addDays(TODAY, i);
      for (const st of candidateStarts) {
        if (created.length >= 6 || !queue.length) break;
        const s = toMin(st);
        if (i === 0 && s < now) continue;
        const task = queue[0];
        const dur = Math.max(30, Math.min(120, Math.round((task.estMin || 60) / 30) * 30));
        const e = s + dur;
        if (e > 23 * 60) continue;
        const clash = all.some((b) => {
          if (!b.start.startsWith(date)) return false;
          return s < toMin(b.end.slice(11)) && e > toMin(b.start.slice(11));
        });
        if (clash) continue;
        queue.shift();
        const block = {
          id: newId('blk'),
          title: task.title,
          type: task.area === 'job' ? 'job' : task.area === 'school' ? 'study' : 'personal',
          start: `${date}T${st}`,
          end: `${date}T${fromMin(e)}`,
          protected: false,
          linkedTaskId: task.id,
          auto: true,
        };
        all.push(block);
        created.push(block);
      }
    }
    setTimeBlocks((bs) => [...bs, ...created]);
    const atRisk = tasks.filter((t) => t.status !== 'done' && ((t.doDate && t.doDate < TODAY) || (t.dueDate && t.dueDate < TODAY))).length;
    toast(`Filled ${created.length} free slot${created.length === 1 ? '' : 's'} · ${atRisk} deadline${atRisk === 1 ? '' : 's'} at risk`, {
      sub: gcal.events.length ? 'Protected blocks and Google events stayed untouched.' : 'Protected blocks stayed untouched.',
      ms: 4200,
    });
    return created;
  };

  // ── Weekly goals ──
  const weekStart = startOfWeek(TODAY, settings.weekStartsOn);
  const addGoal = (text) => setWeeklyGoals((gs) => [...gs, { id: newId('g'), text, progress: 0, weekStart }]);
  const updateGoal = (id, patch) => setWeeklyGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const deleteGoal = (id) => setWeeklyGoals((gs) => gs.filter((g) => g.id !== id));

  // ── Tutorial ──
  const dismissTip = (id) => setTutorialDone((d) => (d.includes(id) ? d : [...d, id]));
  const restartTutorial = () => {
    setTutorialDone([]);
    setSettings((s) => ({ ...s, tutorial: true }));
    go('dashboard');
    toast('Tutorial restarted', { sub: 'Tips are back on every page.' });
  };

  // ── Data management ──
  const resetData = () => {
    applyData(emptyData());
    toast('All data cleared', { sub: 'Fresh start.', tone: 'muted' });
    go('dashboard');
  };
  const importData = (raw) => {
    applyData(raw);
    toast('Data imported', { tone: 'success' });
  };

  // ── Derived numbers shared by Dashboard & friends ──
  const prs = useMemo(
    () =>
      PR_LIFTS.map((lift) => {
        let best = null;
        for (const w of workouts) {
          const ex = w.exercises.find((e) => e.name === lift);
          if (!ex) continue;
          for (const s of ex.sets) if (!best || s.weight > best.weight) best = { lift, weight: s.weight, reps: s.reps, date: w.date };
        }
        return best || { lift, weight: null, reps: null, date: null };
      }),
    [workouts]
  );

  const notifications = useMemo(() => {
    const list = [];
    const overdue = tasks.filter((t) => t.status !== 'done' && t.doDate && t.doDate < TODAY);
    if (overdue.length) list.push({ id: `overdue-${TODAY}`, text: `${overdue.length} task${overdue.length === 1 ? '' : 's'} slipped from earlier days`, time: 'Today', view: 'today' });
    for (const c of courses) {
      if (!c.milestone?.date) continue;
      const n = diffDays(c.milestone.date, TODAY);
      if (n >= 0 && n <= 7 && c.gapCount > 0)
        list.push({ id: `ms-${c.id}-${TODAY}`, text: `${c.short || c.name} ${c.milestone.label || 'milestone'} ${n === 0 ? 'today' : `in ${n} day${n === 1 ? '' : 's'}`} — ${c.gapCount} topic${c.gapCount === 1 ? '' : 's'} behind`, time: 'Today', view: 'courses', courseId: c.id });
    }
    for (const b of books.filter((x) => x.status === 'reading')) {
      if (readingPace(b, settings.readingDays).behind) list.push({ id: `read-${b.id}-${TODAY}`, text: `Reading pace slipping on ${b.title}`, time: 'Today', view: 'reading' });
    }
    const y = screenTimeLogs.find((l) => l.date === addDays(TODAY, -1));
    if (y && y.totalMin > settings.screenLimitMin) list.push({ id: `screen-${TODAY}`, text: `Screen time over limit yesterday`, time: 'Yesterday', view: 'screen' });
    for (const l of jobLeads) {
      if (!['lost', 'closed'].includes(l.stage) && l.dueDate && l.dueDate <= TODAY)
        list.push({ id: `lead-${l.id}-${TODAY}`, text: `Follow up: ${l.company} — ${l.nextAction}`, time: l.dueDate === TODAY ? 'Today' : 'Overdue', view: 'job' });
    }
    return list.map((n) => ({ ...n, read: notifRead.includes(n.id) }));
  }, [tasks, courses, books, screenTimeLogs, jobLeads, notifRead, settings.readingDays, settings.screenLimitMin]);
  const markNotifs = (ids) => setNotifRead((r) => [...new Set([...r.filter((x) => x.endsWith(TODAY)), ...ids])]);

  const derived = useMemo(() => {
    const ws = settings.weekStartsOn;
    const weekStartD = startOfWeek(TODAY, ws);
    const weekFocus = focusSessions.filter((f) => f.date >= weekStartD && f.date <= TODAY && f.completed);
    const focusByCourse = [
      ...courses.map((c) => ({
        id: c.id,
        label: c.short || c.name,
        color: c.color,
        min: weekFocus.filter((f) => f.courseId === c.id).reduce((s, f) => s + f.minutes, 0),
      })),
      { id: 'other', label: 'Other', color: '#71717A', min: weekFocus.filter((f) => !f.courseId || !courses.some((c) => c.id === f.courseId)).reduce((s, f) => s + f.minutes, 0) },
    ];
    const openToday = tasks.filter((t) => t.status !== 'done' && t.doDate && t.doDate <= TODAY);
    const goals = weeklyGoals.filter((g) => g.weekStart === weekStartD);
    return {
      weekStart: weekStartD,
      goals,
      focusByCourse,
      openToday,
      totalGap: courses.reduce((s, c) => s + Math.max(0, c.gapCount), 0),
    };
  }, [courses, focusSessions, tasks, settings, weeklyGoals]);

  const value = {
    profile, setProfile,
    activeView, setActiveView: go, go,
    tasks, updateTask, toggleTask, addTask, deleteTask, top3: top3.filter((id) => tasks.some((t) => t.id === id)), toggleTop3, setTop3,
    openTaskId, setOpenTaskId,
    courses, addCourse, updateCourse, deleteCourse, addTopic, deleteTopic, setTopicStatus, selectedCourseId, setSelectedCourseId,
    habits, addHabit, deleteHabit, setHabitToday,
    books, addBook, deleteBook, logPages, startBook,
    workouts, addWorkout, deleteWorkout, prs, templates: workoutTemplates,
    deals, addDeal, moveDeal, deleteDeal,
    jobLeads, addLead, moveLead, deleteLead,
    focusSessions, addFocusSession,
    screenTimeLogs, logScreenTime,
    timeBlocks, addBlock, addRepeatingBlock, removeBlock, removeSeries, autoPlan,
    weeklyGoals, addGoal, updateGoal, deleteGoal,
    notifications, markNotifs,
    settings, setSettings, accents: ACCENTS,
    tutorialDone, dismissTip, restartTutorial,
    snapshot, importData, resetData, saveError, cloud, gcal,
    toasts, toast, dismissToast,
    derived,
    fmtShort,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
