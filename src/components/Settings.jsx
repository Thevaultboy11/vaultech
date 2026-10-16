import { CalendarDays, ChevronDown, Plus, X, Cloud, Copy, Download, Eye, EyeOff, GraduationCap, HardDrive, Link2, RefreshCw, RotateCcw, Smartphone, Trash2, Upload, Webhook } from 'lucide-react';
import { validKey } from '../lib/cloud/sync';
import { cleanCalendarId, fetchCalendarName } from '../lib/gcal';
import { SYNC_LABEL } from './layout/SyncBadge';
import { useRef, useState } from 'react';
import { TODAY, fmtDur } from '../lib/dates';
import { STORAGE_KEY, useApp } from '../store';
import { Tip } from './Tutorial';
import { Button, Card, CardHeader, PageHeader, Segmented, Toggle, cx } from './ui';

function Row({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[13.5px]">{label}</div>
        {hint && <div className="text-xs text-ink3">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Stepper({ value, onChange, min, max, step = 1, format = (v) => v }) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-bg">
      <button className="h-8 w-8 text-ink3 hover:text-ink" onClick={() => onChange(Math.max(min, value - step))} aria-label="Decrease">
        −
      </button>
      <span className="min-w-[64px] text-center text-sm tabular-nums">{format(value)}</span>
      <button className="h-8 w-8 text-ink3 hover:text-ink" onClick={() => onChange(Math.min(max, value + step))} aria-label="Increase">
        +
      </button>
    </div>
  );
}

const PROFILE_FIELDS = [
  { k: 'name', label: 'Your name', ph: 'Full name' },
  { k: 'school', label: 'School', ph: 'e.g. NYU Abu Dhabi' },
  { k: 'company', label: 'Job / company', ph: 'Names the Job page' },
  { k: 'role', label: 'Role', ph: 'e.g. Sales & marketing intern' },
];

const GCAL_COLORS = ['#60A5FA', '#F472B6', '#34D399', '#FBBF24', '#A78BFA', '#FB923C'];

function GoogleCalendarCard() {
  const { settings, setSettings, gcal, toast } = useApp();
  const cals = settings.gcalCalendars || [];
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [help, setHelp] = useState(cals.length === 0);
  const setCals = (fn) => setSettings((s) => ({ ...s, gcalCalendars: fn(s.gcalCalendars || []) }));

  const add = async (e) => {
    e.preventDefault();
    const id = cleanCalendarId(input);
    if (!id) return;
    if (cals.some((c) => c.id === id)) {
      toast('Already added', { tone: 'muted' });
      return;
    }
    setAdding(true);
    let name = id.includes('@group.calendar.google.com') ? 'Google Calendar' : id;
    let ok = true;
    try {
      name = await fetchCalendarName(id);
    } catch (err) {
      ok = false;
      toast('Added, but Google said no', { sub: err.message, tone: 'warning', ms: 6000 });
    }
    setCals((list) => [...list, { id, name, color: GCAL_COLORS[list.length % GCAL_COLORS.length], enabled: true }]);
    setInput('');
    setAdding(false);
    if (ok) toast('Calendar added', { sub: name });
  };

  if (!gcal.configured) return null;

  return (
    <Card className="mb-4" accent={cals.length > 0}>
      <CardHeader
        title="Google Calendar"
        icon={CalendarDays}
        sub="Shows your Google events on the Calendar page (read-only). Today and Auto-Plan treat them as busy."
        action={
          cals.length > 0 && (
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={gcal.refresh} disabled={gcal.loading}>
              {gcal.loading ? 'Loading…' : 'Refresh'}
            </Button>
          )
        }
      />

      {cals.map((c) => (
        <div key={c.id} className="flex items-center gap-3 border-b border-line py-3">
          <button
            onClick={() => setCals((l) => l.map((x) => (x.id === c.id ? { ...x, color: GCAL_COLORS[(GCAL_COLORS.indexOf(x.color) + 1) % GCAL_COLORS.length] } : x)))}
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ background: c.color }}
            title="Change color"
            aria-label="Change color"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px]">{c.name}</div>
            <div className="truncate font-mono text-[11px] text-ink3">{c.id}</div>
            {gcal.errors[c.id] && <div className="mt-0.5 text-[11.5px] text-danger">{gcal.errors[c.id]}</div>}
            {!gcal.errors[c.id] && c.enabled !== false && gcal.lastFetched && (
              <div className="mt-0.5 text-[11px] text-ink3">{gcal.events.filter((e) => e.calendarId === c.id).length} events in the next 6 weeks</div>
            )}
          </div>
          <Toggle checked={c.enabled !== false} onChange={(v) => setCals((l) => l.map((x) => (x.id === c.id ? { ...x, enabled: v } : x)))} />
          <button onClick={() => setCals((l) => l.filter((x) => x.id !== c.id))} className="rounded-full p-1 text-ink3 hover:text-danger" aria-label="Remove calendar">
            <X size={14} />
          </button>
        </div>
      ))}

      <form onSubmit={add} className="flex flex-col gap-2 pt-4 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Calendar ID, e.g. you@gmail.com or …@group.calendar.google.com"
          className="input flex-1 font-mono text-xs"
        />
        <Button icon={Plus} disabled={!input.trim() || adding}>
          {adding ? 'Checking…' : 'Add calendar'}
        </Button>
      </form>

      <button onClick={() => setHelp((h) => !h)} className="mt-3 inline-flex items-center gap-1 text-xs text-ink3 hover:text-ink2">
        <ChevronDown size={12} className={cx('transition', help && 'rotate-180')} /> How to connect a calendar
      </button>
      {help && (
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-ink2">
          <li>
            Open <b className="text-ink">Google Calendar</b> on a computer → ⚙️ <b className="text-ink">Settings</b> → click your calendar on the left.
          </li>
          <li>
            Under <b className="text-ink">Access permissions for events</b>, tick <b className="text-ink">Make available to public</b> and choose <b className="text-ink">See all event details</b>.
          </li>
          <li>
            Scroll to <b className="text-ink">Integrate calendar</b> and copy the <b className="text-ink">Calendar ID</b> (your Gmail address for your main calendar).
          </li>
          <li>Paste it above. Repeat for any other calendar in your account.</li>
          <li className="text-ink3">Public means anyone who knows the ID can see those events. Use a separate calendar for anything private.</li>
        </ol>
      )}
    </Card>
  );
}

function CloudCard() {
  const { cloud, toast } = useApp();
  const [show, setShow] = useState(false);
  const [joinKey, setJoinKey] = useState('');
  const [confirm, setConfirm] = useState(null); // 'join' | 'fresh' | 'off'
  const s = cloud.status;
  const masked = cloud.vault ? `${cloud.vault.slice(0, 6)}${'•'.repeat(14)}${cloud.vault.slice(-4)}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cloud.vault);
      toast('Vault key copied', { sub: 'Paste it on your other device in Settings → Cloud sync.' });
    } catch {
      setShow(true);
      toast('Couldn’t copy automatically', { sub: 'The key is shown — select and copy it.', tone: 'warning' });
    }
  };

  if (!cloud.configured) return null;

  return (
    <Card className="mb-4" accent={!!cloud.vault}>
      <CardHeader title="Cloud sync" icon={Cloud} sub={`Saves everything to ${cloud.backendName} and keeps your devices in sync. No sign-in.`} />
      <Row
        label={
          <span className="inline-flex items-center gap-2">
            <span
              className={cx(
                'h-2 w-2 rounded-full',
                s === 'synced' ? 'bg-success' : s === 'error' ? 'bg-danger' : s === 'off' || s === 'offline' ? 'bg-ink3' : 'bg-accent animate-pulse'
              )}
            />
            {SYNC_LABEL[s]}
          </span>
        }
        hint={
          cloud.error ? (
            <span className="text-danger">{cloud.error}</span>
          ) : cloud.vault ? (
            cloud.lastSyncedAt ? `Last synced ${cloud.lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Changes upload a moment after you make them.'
          ) : (
            'This device only saves locally.'
          )
        }
      >
        {cloud.vault ? (
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={cloud.syncNow}>
            Sync now
          </Button>
        ) : (
          <Button size="sm" icon={Cloud} onClick={cloud.enable}>
            Turn on
          </Button>
        )}
      </Row>

      {cloud.vault && (
        <Row label="Your vault key" hint="Works like a password for your data. Use it to connect your other devices — don’t share it.">
          <div className="flex items-center gap-1.5">
            <code className="max-w-[220px] truncate rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-[11.5px] text-ink2 sm:max-w-[260px]">
              {show ? cloud.vault : masked}
            </code>
            <button onClick={() => setShow((v) => !v)} className="rounded-full p-1.5 text-ink3 hover:bg-white/[0.05] hover:text-ink" aria-label={show ? 'Hide key' : 'Show key'}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={copy} className="rounded-full p-1.5 text-ink3 hover:bg-white/[0.05] hover:text-ink" aria-label="Copy key">
              <Copy size={14} />
            </button>
          </div>
        </Row>
      )}

      <Row label="Connect to another device’s vault" hint="Paste the vault key from your other device. This device will switch to that data.">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (validKey(joinKey)) setConfirm('join');
          }}
        >
          <input value={joinKey} onChange={(e) => setJoinKey(e.target.value)} placeholder="vt-…" className="input h-8 w-[180px] py-0 font-mono text-xs" />
          <Button size="sm" variant="outline" icon={Link2} disabled={!validKey(joinKey) || joinKey.trim() === cloud.vault}>
            Connect
          </Button>
        </form>
      </Row>

      {confirm === 'join' && (
        <div className="mb-2 rounded-xl border border-warning/30 bg-warning/[0.06] p-3 text-xs text-ink2">
          Data on this device will be replaced by what’s in that vault (anything not yet in it is lost — export a backup first if unsure).
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                cloud.connect(joinKey);
                setJoinKey('');
                setConfirm(null);
                toast('Connected to vault', { sub: 'Pulling your data…' });
              }}
            >
              Switch to that vault
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {cloud.vault && (
        <Row label="Start a new cloud vault" hint="Deletes this vault’s cloud copy and makes a new empty one with a new key. Data on this device is kept and re-uploaded.">
          {confirm === 'fresh' ? (
            <span className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  setConfirm(null);
                  await cloud.freshVault();
                  toast('New vault created', { sub: 'Copy the new key to your other devices.' });
                }}
              >
                Delete & start new
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => setConfirm('fresh')}>
              New vault…
            </Button>
          )}
        </Row>
      )}

      {cloud.vault && (
        <Row label="Stop syncing this device" hint="Keeps your data here and in the cloud, just stops this device from syncing.">
          <Button variant="ghost" size="sm" onClick={cloud.disconnect}>
            Turn off
          </Button>
        </Row>
      )}
    </Card>
  );
}

export default function Settings() {
  const { settings, setSettings, accents, toast, profile, setProfile, restartTutorial, snapshot, importData, resetData, saveError, cloud } = useApp();
  const set = (k) => (v) => setSettings((s) => ({ ...s, [k]: v }));
  const fileRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const counts = [
    ['tasks', snapshot.tasks.length],
    ['courses', snapshot.courses.length],
    ['habits', snapshot.habits.length],
    ['books', snapshot.books.length],
    ['blocks', snapshot.timeBlocks.length],
  ];
  const sizeKb = Math.max(1, Math.round(new Blob([JSON.stringify(snapshot)]).size / 1024));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-tech-industries-${TODAY}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Backup downloaded', { sub: a.download, tone: 'success' });
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) throw new Error('shape');
      importData(data);
    } catch {
      toast('That file didn’t look like a backup', { sub: 'Choose a .json file exported from here.', tone: 'warning' });
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" sub={cloud.vault ? 'Changes apply instantly and sync to the cloud.' : 'Changes apply instantly and save in this browser.'} />
      <Tip id="settings" />

      <Card className="mb-4">
        <CardHeader title="Profile" sub="Used for greetings and labels. Stays on this device." />
        <div className="grid gap-3 sm:grid-cols-2">
          {PROFILE_FIELDS.map((f) => (
            <label key={f.k} className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink2">{f.label}</span>
              <input className="input" value={profile[f.k]} placeholder={f.ph} onChange={(e) => setProfile((p) => ({ ...p, [f.k]: e.target.value }))} />
            </label>
          ))}
        </div>
      </Card>

      <Card className="mb-4" accent={settings.tutorial}>
        <CardHeader title="Tutorial mode" icon={GraduationCap} />
        <Row label="Show tips on every page" hint="A short how-to at the top of each page, plus a getting-started checklist on the Dashboard.">
          <Toggle checked={settings.tutorial} onChange={set('tutorial')} />
        </Row>
        <Row label="Start the tutorial over" hint="Brings back every tip you dismissed.">
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={restartTutorial}>
            Restart tutorial
          </Button>
        </Row>
      </Card>

      <Card className="mb-4">
        <CardHeader title="Look & feel" />
        <Row label="Accent" hint="Used sparingly: active nav, primary buttons, rings.">
          <div className="flex gap-2">
            {Object.entries(accents).map(([k, a]) => (
              <button
                key={k}
                onClick={() => set('accent')(k)}
                title={a.name}
                className={cx('h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition', settings.accent === k ? 'ring-2 ring-ink2' : 'hover:scale-110')}
                style={{ background: a.hex }}
              />
            ))}
          </div>
        </Row>
        <Row label="Preview">
          <div className="flex items-center gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="soft">
              Soft
            </Button>
            <span className="h-6 w-[2px] rounded-full bg-accent" />
          </div>
        </Row>
        <Row label="Density">
          <Segmented
            value={settings.density}
            onChange={set('density')}
            options={[
              { value: 'comfortable', label: 'Airy' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
        </Row>
        <Row label="Week starts on">
          <Segmented
            value={settings.weekStartsOn}
            onChange={set('weekStartsOn')}
            options={[
              { value: 1, label: 'Monday' },
              { value: 0, label: 'Sunday' },
            ]}
          />
        </Row>
      </Card>

      <Card className="mb-4">
        <CardHeader title="Targets" />
        <Row label="Daily screen limit" hint="Used on Screen Time and the Dashboard.">
          <Stepper value={settings.screenLimitMin} onChange={set('screenLimitMin')} min={30} max={480} step={15} format={fmtDur} />
        </Row>
        <Row label="Gym target" hint="Visits per week.">
          <Stepper value={settings.gymTarget} onChange={set('gymTarget')} min={1} max={7} format={(v) => `${v}/wk`} />
        </Row>
        <Row label="Reading pace" hint="Target days per book.">
          <Stepper value={settings.readingDays} onChange={set('readingDays')} min={3} max={60} format={(v) => `${v} days`} />
        </Row>
        <Row label="Books this year" hint="Yearly reading goal.">
          <Stepper value={settings.readingYearGoal} onChange={set('readingYearGoal')} min={1} max={150} format={(v) => `${v} books`} />
        </Row>
      </Card>

      <GoogleCalendarCard />

      <Card className="mb-4">
        <CardHeader title="Integrations" />
        <Row
          label={
            <span className="inline-flex items-center gap-2">
              <Webhook size={14} className="text-ink3" /> iOS Shortcuts webhook
            </span>
          }
          hint="Send screen time & habit ticks from your phone."
        >
          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-ink3">Coming soon</span>
        </Row>
        <Row
          label={
            <span className="inline-flex items-center gap-2">
              <Smartphone size={14} className="text-ink3" /> App blocking
            </span>
          }
          hint="Use Opal or one sec — this app only logs."
        >
          <span className="text-[11px] text-ink3">Not planned</span>
        </Row>
      </Card>

      <CloudCard />

      <Card>
        <CardHeader title="Your data" icon={HardDrive} />
        <Row
          label="Saved in this browser"
          hint={
            saveError
              ? 'Saving failed — this browser may be in private mode or out of space. Export a backup.'
              : `One JSON object (${sizeKb} KB) in localStorage → “${STORAGE_KEY}”. ${counts.map(([k, n]) => `${n} ${k}`).join(' · ')}`
          }
        >
          <span className={cx('inline-flex items-center gap-1.5 text-[11px]', saveError ? 'text-danger' : 'text-success')}>
            <span className={cx('h-1.5 w-1.5 rounded-full', saveError ? 'bg-danger' : 'bg-success')} />
            {saveError ? 'Not saved' : 'Saved'}
          </span>
        </Row>
        <Row label="Export a backup" hint="Downloads everything as a .json file. Use it to back up or move to another device or browser.">
          <Button variant="outline" size="sm" icon={Download} onClick={exportJson}>
            Export JSON
          </Button>
        </Row>
        <Row label="Import a backup" hint="Replaces everything here with the contents of the file.">
          <>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
            <Button variant="outline" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
          </>
        </Row>
        <Row label="Erase everything" hint={cloud.vault ? 'Deletes all data on this device and in your cloud vault (other devices clear too). Export first if you might want it back.' : 'Deletes all data in this browser. Export first if you might want it back.'}>
          {confirmReset ? (
            <span className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  resetData();
                  setConfirmReset(false);
                }}
              >
                Yes, erase all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmReset(true)}>
              Erase…
            </Button>
          )}
        </Row>
      </Card>
    </div>
  );
}
