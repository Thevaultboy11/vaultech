// Keeps Google Calendar events in memory (+ a small local cache). Events are NOT
// saved to Firestore — only the list of calendar IDs is (inside settings).
import { useCallback, useEffect, useRef, useState } from 'react';
import { TODAY, addDays, startOfWeek } from './dates';
import { fetchEvents, gcalConfigured } from './gcal';

const CACHE_KEY = 'vault-tech-industries:gcal-cache';
const REFRESH_MS = 10 * 60 * 1000;

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return c && Array.isArray(c.events) ? c : null;
  } catch {
    return null;
  }
}

export function useGoogleCalendar(calendars, weekStartsOn) {
  const cached = useRef(readCache());
  const [events, setEvents] = useState(cached.current?.events || []);
  const [errors, setErrors] = useState({}); // calendarId → message
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(cached.current?.at ? new Date(cached.current.at) : null);
  const [range, setRange] = useState(() => {
    const ws = startOfWeek(TODAY, weekStartsOn);
    return { from: addDays(ws, -7), to: addDays(ws, 41) };
  });
  const enabled = calendars.filter((c) => c.enabled !== false);
  const sig = enabled.map((c) => c.id).join('|');
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!gcalConfigured) return;
    const ids = sig ? sig.split('|') : [];
    const id = ++reqId.current;
    if (!ids.length) {
      setEvents([]);
      setErrors({});
      return;
    }
    setLoading(true);
    const results = await Promise.allSettled(ids.map((cid) => fetchEvents(cid, range.from, range.to)));
    if (id !== reqId.current) return; // a newer refresh started
    const next = [];
    const errs = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') next.push(...r.value);
      else {
        errs[ids[i]] = r.reason?.message || 'Couldn’t load this calendar';
        // keep showing old events for a calendar that failed to refresh
        next.push(...events.filter((e) => e.calendarId === ids[i]));
      }
    });
    setEvents(next);
    setErrors(errs);
    setLoading(false);
    const at = new Date();
    setLastFetched(at);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: at.toISOString(), events: next }));
    } catch {
      /* ignore */
    }
  }, [sig, range.from, range.to]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    const onFocus = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);

  // Calendar page calls this when you browse to another week
  const ensureWeek = useCallback((weekStart) => {
    setRange((r) => (weekStart >= r.from && addDays(weekStart, 6) <= r.to ? r : { from: addDays(weekStart, -7), to: addDays(weekStart, 41) }));
  }, []);

  const colorOf = Object.fromEntries(calendars.map((c) => [c.id, c.color]));
  const nameOf = Object.fromEntries(calendars.map((c) => [c.id, c.name || c.id]));
  const enabledIds = new Set(enabled.map((c) => c.id));
  const visible = events.filter((e) => enabledIds.has(e.calendarId)).map((e) => ({ ...e, color: colorOf[e.calendarId] || '#60A5FA', calendarName: nameOf[e.calendarId] }));

  return { configured: gcalConfigured, events: visible, errors, loading, lastFetched, refresh, ensureWeek };
}
