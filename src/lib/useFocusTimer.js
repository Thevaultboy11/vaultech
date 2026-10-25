import { useCallback, useEffect, useRef, useState } from 'react';

// Focus timer that lives in the app store, so it keeps running when you switch pages.
//
// It never counts by "subtract 1 every tick": browsers throttle or freeze timers in
// background tabs and on a locked phone, so tick counting drifts or stalls. Instead a
// running timer stores the wall-clock time it ends at (endsAt) and the display is
// recomputed from Date.now(). The state is saved to localStorage, so a reload or a
// closed tab picks up where it left off (and finishes the session if it ran out).

const IDLE = { status: 'idle', length: 25, endsAt: null, remaining: 25 * 60 * 1000, courseId: '', taskId: '' };

const storageKey = (uid) => `vti:focus-timer:${uid}`;

function load(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return IDLE;
    const s = JSON.parse(raw);
    if (!['idle', 'running', 'paused'].includes(s.status)) return IDLE;
    return { ...IDLE, ...s };
  } catch {
    return IDLE;
  }
}

export function remainingMs(t, now = Date.now()) {
  if (t.status === 'running') return Math.max(0, t.endsAt - now);
  return t.remaining;
}

export function useFocusTimer(uid, onFinish) {
  const [timer, setTimer] = useState(() => load(uid));
  const [now, setNow] = useState(() => Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(uid), JSON.stringify(timer));
    } catch {
      /* storage blocked: timer still works for this tab */
    }
  }, [uid, timer]);

  // Refresh the clock while running; also re-sync the moment the tab becomes visible again.
  useEffect(() => {
    if (timer.status !== 'running') return;
    const sync = () => setNow(Date.now());
    sync();
    const id = setInterval(sync, 250);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [timer.status, timer.endsAt]);

  // Finish exactly once when the end time passes, whichever page is open.
  useEffect(() => {
    if (timer.status === 'running' && now >= timer.endsAt) {
      const done = timer;
      setTimer({ ...IDLE, length: done.length, remaining: done.length * 60000, courseId: done.courseId, taskId: done.taskId });
      finishRef.current?.(done);
    }
  }, [now, timer]);

  const start = useCallback(() => {
    setTimer((t) => (t.status === 'running' ? t : { ...t, status: 'running', endsAt: Date.now() + t.remaining }));
    setNow(Date.now());
  }, []);

  const pause = useCallback(() => {
    setTimer((t) => (t.status !== 'running' ? t : { ...t, status: 'paused', remaining: Math.max(0, t.endsAt - Date.now()), endsAt: null }));
  }, []);

  const reset = useCallback((length) => {
    setTimer((t) => {
      const len = length ?? t.length;
      return { ...t, status: 'idle', length: len, endsAt: null, remaining: len * 60000 };
    });
  }, []);

  const setLength = useCallback((len) => {
    setTimer((t) => (t.status !== 'idle' ? t : { ...t, length: len, remaining: len * 60000 }));
  }, []);

  const setTarget = useCallback((patch) => {
    setTimer((t) => (t.status !== 'idle' ? t : { ...t, ...patch }));
  }, []);

  // Demo helper: jump to the last few seconds.
  const skipTo = useCallback((ms) => {
    setTimer((t) => (t.status === 'running' ? { ...t, endsAt: Date.now() + ms } : t.status === 'paused' ? { ...t, remaining: ms } : t));
    setNow(Date.now());
  }, []);

  const left = remainingMs(timer, now);
  return { ...timer, left, start, pause, reset, setLength, setTarget, skipTo };
}
