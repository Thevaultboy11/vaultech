// All dates are plain 'YYYY-MM-DD' strings in the device's local time.
const pad = (n) => String(n).padStart(2, '0');
export function localIso(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
// "Today" is fixed when the app loads (reload after midnight to roll over).
export const TODAY = localIso();
export function nowMin() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
export function nowHHMM() {
  const m = nowMin();
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toDate = (iso) => new Date(iso + 'T00:00:00Z');
const toIso = (d) => d.toISOString().slice(0, 10);

export function addDays(iso, n) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}

export function diffDays(a, b) {
  return Math.round((toDate(a) - toDate(b)) / 86400000);
}

export const dow = (iso) => toDate(iso).getUTCDay();

export function startOfWeek(iso, weekStartsOn = 1) {
  const d = dow(iso);
  const back = (d - weekStartsOn + 7) % 7;
  return addDays(iso, -back);
}

export function weekDays(iso, weekStartsOn = 1) {
  const s = startOfWeek(iso, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

export function fmtShort(iso) {
  const d = toDate(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtDay(iso) {
  return `${DOW[dow(iso)]}, ${fmtShort(iso)}`;
}

export function fmtLong(iso) {
  const d = toDate(iso);
  return `${DOW_LONG[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// Friendly relative label: Today, Tomorrow, Yesterday, Mon, or Oct 28
export function relDay(iso) {
  if (!iso) return '';
  const n = diffDays(iso, TODAY);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n > 1 && n < 7) return DOW[dow(iso)];
  return fmtShort(iso);
}

export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMin = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export function fmtTime(hhmm) {
  if (!hhmm) return '';
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')} ${ap}` : `${h} ${ap}`;
}

export function fmtDur(min) {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

// Next date (today or later) that falls on the given weekday index
export function nextDow(target, from = TODAY, includeToday = true) {
  const d = dow(from);
  let ahead = (target - d + 7) % 7;
  if (ahead === 0 && !includeToday) ahead = 7;
  return addDays(from, ahead);
}
