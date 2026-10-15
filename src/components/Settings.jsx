import { CalendarDays, Download, GraduationCap, HardDrive, RotateCcw, Smartphone, Trash2, Upload, Webhook } from 'lucide-react';
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

export default function Settings() {
  const { settings, setSettings, accents, toast, profile, setProfile, restartTutorial, snapshot, importData, resetData, saveError } = useApp();
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
      <PageHeader title="Settings" sub="Changes apply instantly and save in this browser." />
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

      <Card className="mb-4">
        <CardHeader title="Integrations" />
        <Row
          label={
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} className="text-ink3" /> Google Calendar sync
            </span>
          }
          hint="Show your Google events on the Calendar page."
        >
          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-ink3">Coming soon</span>
        </Row>
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
        <Row label="Erase everything" hint="Deletes all data in this browser. Export first if you might want it back.">
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
