import { TODAY, addDays, nextDow, relDay, fmtTime, fmtDur } from './dates';

// Mock natural-language parser for the top-bar quick-add.
// "Calc pset every Mon 9am p1 #school" →
//   { title: 'Calc pset', courseId: 'calc', recurrence: 'Weekly · Mon', doDate: Mon, doTime: '09:00', priority: 1, area: 'school' }

const DAY_MAP = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};
const DAY_RE = '(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)';
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Match a course by its short name, full name or code (e.g. "CSO", "Calc", "CS-UH 2010")
function courseMatchers(courses) {
  return courses.map((c) => {
    const words = [c.short, c.name, c.code].filter(Boolean).map((w) => esc(w.trim())).filter(Boolean);
    return { id: c.id, short: c.short || c.name, re: new RegExp(`(^|\\s)(${words.join('|')})(?=\\s|$)`, 'i') };
  });
}

const AREAS = ['school', 'job', 'arbitrage', 'misc'];

function dayWord(word) {
  const w = word.toLowerCase();
  if (w === 'today') return TODAY;
  if (w === 'tonight') return TODAY;
  if (w === 'tomorrow' || w === 'tmrw') return addDays(TODAY, 1);
  if (w in DAY_MAP) return nextDow(DAY_MAP[w], TODAY, false);
  return null;
}

export function parseQuickAdd(input, courses = []) {
  let text = ` ${input} `;
  const out = {
    title: '',
    priority: 3,
    area: 'misc',
    courseId: null,
    doDate: null,
    doTime: null,
    dueDate: null,
    recurrence: null,
    estMin: 30,
  };
  const chips = [];
  let areaSet = false;

  // Priority: p1–p4 or !1
  text = text.replace(/\s(?:p|!)([1-4])(?=\s)/i, (_, p) => {
    out.priority = Number(p);
    chips.push({ k: 'Priority', v: `P${p}` });
    return ' ';
  });

  // #area or #project
  text = text.replace(/\s#([\w-]+)(?=\s)/g, (_, tag) => {
    const t = tag.toLowerCase();
    if (AREAS.includes(t)) {
      out.area = t;
      areaSet = true;
      chips.push({ k: 'Area', v: t });
    } else {
      out.project = tag;
      chips.push({ k: 'Project', v: tag });
    }
    return ' ';
  });

  // Recurrence: "every mon", "every day", "every weekday", "daily", "weekly"
  text = text.replace(new RegExp(`\\severy\\s+(day|weekday|${DAY_RE.slice(1, -1)})(?=\\s)`, 'i'), (_, d) => {
    const w = d.toLowerCase();
    if (w === 'day') {
      out.recurrence = 'Daily';
      out.doDate = out.doDate || TODAY;
    } else if (w === 'weekday') {
      out.recurrence = 'Weekdays';
      out.doDate = out.doDate || addDays(TODAY, 1);
    } else {
      out.recurrence = `Weekly · ${SHORT[DAY_MAP[w]]}`;
      out.doDate = nextDow(DAY_MAP[w], TODAY, false);
    }
    return ' ';
  });
  text = text.replace(/\s(daily|weekly)(?=\s)/i, (_, r) => {
    out.recurrence = r.toLowerCase() === 'daily' ? 'Daily' : 'Weekly';
    out.doDate = out.doDate || TODAY;
    return ' ';
  });

  // Due date: "due fri", "due tomorrow"
  text = text.replace(new RegExp(`\\sdue\\s+(today|tomorrow|tmrw|${DAY_RE.slice(1, -1)})(?=\\s)`, 'i'), (_, d) => {
    out.dueDate = dayWord(d);
    return ' ';
  });

  // Do date
  text = text.replace(new RegExp(`\\s(today|tonight|tomorrow|tmrw|${DAY_RE.slice(1, -1)})(?=\\s)`, 'i'), (_, d) => {
    out.doDate = dayWord(d);
    if (d.toLowerCase() === 'tonight') out.doTime = '20:00';
    return ' ';
  });

  // Time: 9am, 9:30pm, 21:00
  text = text.replace(/\s(\d{1,2})(?::(\d{2}))?\s?(am|pm)(?=\s)/i, (_, h, m, ap) => {
    let hh = Number(h) % 12;
    if (ap.toLowerCase() === 'pm') hh += 12;
    out.doTime = `${String(hh).padStart(2, '0')}:${m || '00'}`;
    return ' ';
  });
  text = text.replace(/\s([01]?\d|2[0-3]):([0-5]\d)(?=\s)/, (_, h, m) => {
    out.doTime = `${String(h).padStart(2, '0')}:${m}`;
    return ' ';
  });

  // Estimate: 45m, 1h, 1.5h, 90min
  text = text.replace(/\s(\d+(?:\.\d+)?)\s?(h|hr|hrs|m|min|mins)(?=\s)/i, (_, n, u) => {
    out.estMin = Math.round(u.toLowerCase().startsWith('h') ? Number(n) * 60 : Number(n));
    return ' ';
  });

  // Course detection (keeps the word in the title)
  let courseShort = null;
  for (const c of courseMatchers(courses)) {
    if (c.re.test(text)) {
      courseShort = c.short;
      out.courseId = c.id;
      if (!areaSet) out.area = 'school';
      break;
    }
  }

  if (out.doTime && !out.doDate) out.doDate = TODAY;

  const title = text.replace(/\s+/g, ' ').trim();
  out.title = title ? title[0].toUpperCase() + title.slice(1) : '';

  if (out.courseId) chips.unshift({ k: 'Course', v: courseShort });
  if (out.doDate) chips.push({ k: 'Do', v: relDay(out.doDate) + (out.doTime ? ` ${fmtTime(out.doTime)}` : '') });
  if (out.dueDate) chips.push({ k: 'Due', v: relDay(out.dueDate) });
  if (out.recurrence) chips.push({ k: 'Repeats', v: out.recurrence });
  if (out.estMin !== 30) chips.push({ k: 'Est', v: fmtDur(out.estMin) });
  if (!areaSet && out.area === 'school') chips.push({ k: 'Area', v: 'school' });

  return { task: out, chips };
}
