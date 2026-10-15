// ─────────────────────────────────────────────────────────────
// Vault Tech Industries starts empty. Everything you add is saved
// in this browser as one JSON object (see store.jsx → STORAGE_KEY).
// The only built-ins are config: workout templates and accent colors.
// ─────────────────────────────────────────────────────────────

export const APP_NAME = 'Vault Tech Industries';
export const DATA_VERSION = 1;

export const emptyData = () => ({
  version: DATA_VERSION,
  profile: { name: '', school: '', role: '', company: '' },
  courses: [], // { id, code, short, name, professor, color, schedule, milestone:{label,date}|null, topics:[{id,title,classDate,status,estMin}] }
  tasks: [], // { id, title, project, area, courseId, doDate, doTime, dueDate, estMin, priority, status, recurrence, parentId, checklist[], notes }
  habits: [], // { id, name, icon, kind: 'gym'|'reading'|null, frequencyPerWeek, completions: ['YYYY-MM-DD'], createdAt }
  books: [], // { id, title, author, status, totalPages, pagesRead, startDate, tags[], hue, log:[{date,pages}] }
  workouts: [], // { id, date, template, durationMin, exercises:[{name, sets:[{reps,weight}], prev}], previousSessionNote }
  deals: [], // { id, item, buyPrice, sellPrice, fees, margin, status, notes }
  jobLeads: [], // { id, company, contact, stage, nextAction, dueDate }
  focusSessions: [], // { id, courseId, taskId, minutes, date, completed }
  screenTimeLogs: [], // { id, date, totalMin, byCategory:[{name,min}] }
  timeBlocks: [], // { id, title, type, start, end, protected, linkedTaskId }
  weeklyGoals: [], // { id, text, progress, weekStart }
  top3: [],
  notifRead: [],
  tutorialDone: [], // tip ids the user dismissed
  settings: { ...defaultSettings },
});

export const defaultSettings = {
  accent: 'baby',
  density: 'comfortable',
  weekStartsOn: 1,
  screenLimitMin: 180,
  gymTarget: 4,
  readingDays: 14,
  readingYearGoal: 26,
  tutorial: true,
};

export const workoutTemplates = {
  Push: ['Bench press', 'Overhead press', 'Seated cable row', 'Incline DB press', 'Triceps pushdown'],
  Pull: ['Deadlift', 'Lat pulldown', 'Barbell row', 'Face pull', 'Biceps curl'],
  Legs: ['Squat', 'Romanian deadlift', 'Leg press', 'Walking lunge', 'Calf raise'],
};

export const PR_LIFTS = ['Bench press', 'Squat', 'Deadlift'];

export const SCREEN_CATEGORIES = ['Social', 'Entertainment', 'Study', 'Other'];

export const COURSE_COLORS = ['#7EC8E3', '#A78BFA', '#F5A97F', '#86EFAC', '#F472B6', '#FBBF24'];

export const ACCENTS = {
  baby: { name: 'Baby blue', rgb: '126 200 227', hover: '91 184 217', hex: '#7EC8E3' },
  lilac: { name: 'Lilac', rgb: '167 160 250', hover: '140 130 245', hex: '#A7A0FA' },
  mint: { name: 'Mint', rgb: '125 226 200', hover: '90 210 180', hex: '#7DE2C8' },
  peach: { name: 'Peach', rgb: '245 180 140', hover: '238 155 110', hex: '#F5B48C' },
};
