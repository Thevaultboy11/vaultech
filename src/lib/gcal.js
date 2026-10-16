// Read-only Google Calendar access with an API key (public calendars only).
import { GOOGLE_CALENDAR_API_KEY } from '../googleConfig';
import { addDays, localIso } from './dates';

const API = 'https://www.googleapis.com/calendar/v3/calendars';
const pad = (n) => String(n).padStart(2, '0');
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const gcalConfigured = Boolean(GOOGLE_CALENDAR_API_KEY);

// Accepts a calendar ID, an email, or a pasted "public URL"/embed link and returns the ID.
export function cleanCalendarId(input) {
  let s = (input || '').trim();
  try {
    if (/^https?:\/\//.test(s)) {
      const u = new URL(s);
      const src = u.searchParams.get('src') || u.searchParams.get('cid');
      if (src) s = src;
      else {
        const m = u.pathname.match(/\/ical\/([^/]+)\//);
        if (m) s = m[1];
      }
    }
  } catch {
    /* not a URL */
  }
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep */
  }
  return s.trim();
}

function friendly(status, body) {
  const reason = body?.error?.errors?.[0]?.reason || body?.error?.status || '';
  if (status === 404) return 'Calendar not found. Check the ID, and make sure the calendar is set to public in Google Calendar.';
  if (status === 403 && /accessNotConfigured|SERVICE_DISABLED/i.test(reason + JSON.stringify(body || '')))
    return 'Google Calendar API isn’t enabled for this API key’s project. Enable it in Google Cloud Console.';
  if (status === 403 && /referer|API_KEY_HTTP_REFERRER_BLOCKED|ipRefererBlocked/i.test(JSON.stringify(body || '')))
    return 'This API key isn’t allowed from this website address. Add it under the key’s Website restrictions.';
  if (status === 400 && /keyInvalid|API_KEY_INVALID/i.test(JSON.stringify(body || ''))) return 'The Google API key is invalid.';
  if (status === 403 || status === 401) return 'Google refused access. The calendar must be public (Access permissions → Make available to public).';
  return body?.error?.message || `Google Calendar error (${status})`;
}

async function getJson(url) {
  const r = await fetch(url);
  const body = await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error(friendly(r.status, body));
    e.status = r.status;
    throw e;
  }
  return body;
}

export async function fetchCalendarName(id) {
  const body = await getJson(`${API}/${encodeURIComponent(id)}?key=${GOOGLE_CALENDAR_API_KEY}`);
  return body.summary || id;
}

// Returns events between fromDate and toDate (inclusive dates, local), split per day.
export async function fetchEvents(id, fromDate, toDate) {
  const timeMin = new Date(`${fromDate}T00:00:00`).toISOString();
  const timeMax = new Date(`${addDays(toDate, 1)}T00:00:00`).toISOString();
  const out = [];
  let pageToken = '';
  for (let page = 0; page < 5; page++) {
    const q = new URLSearchParams({ key: GOOGLE_CALENDAR_API_KEY, timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
    if (pageToken) q.set('pageToken', pageToken);
    const body = await getJson(`${API}/${encodeURIComponent(id)}/events?${q}`);
    for (const ev of body.items || []) {
      if (ev.status === 'cancelled') continue;
      out.push(...normalize(ev, id));
    }
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

function normalize(ev, calendarId) {
  const base = {
    gid: ev.id,
    calendarId,
    title: ev.summary || 'Busy',
    location: ev.location || '',
    link: ev.htmlLink || '',
  };
  // All-day: start.date / end.date (end is exclusive)
  if (ev.start?.date) {
    const days = [];
    for (let d = ev.start.date; d < (ev.end?.date || addDays(ev.start.date, 1)) && days.length < 60; d = addDays(d, 1)) {
      days.push({ ...base, id: `${ev.id}@${d}`, date: d, allDay: true });
    }
    return days;
  }
  const s = new Date(ev.start?.dateTime);
  const e = new Date(ev.end?.dateTime || ev.start?.dateTime);
  if (isNaN(s)) return [];
  // Split timed events that cross midnight into one piece per day
  const pieces = [];
  let day = localIso(s);
  const lastDay = localIso(new Date(e.getTime() - 1));
  while (day <= lastDay && pieces.length < 14) {
    const startT = day === localIso(s) ? hhmm(s) : '00:00';
    const endT = day === localIso(e) ? hhmm(e) : '23:59';
    if (startT !== endT) pieces.push({ ...base, id: `${ev.id}@${day}`, date: day, start: `${day}T${startT}`, end: `${day}T${endT}`, allDay: false });
    day = addDays(day, 1);
  }
  return pieces;
}
