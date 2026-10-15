import { Info, Plus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { DOW, TODAY, addDays, dow, fmtDur } from '../lib/dates';
import { SCREEN_CATEGORIES } from '../data/defaults';
import { Tip } from './Tutorial';
import { useApp } from '../store';
import { TrendBars } from './charts';
import { Button, Callout, Card, CardHeader, Field, Modal, PageHeader, Ring, cx } from './ui';

const CAT_COLORS = {
  Social: '#F472B6',
  Entertainment: '#F5A97F',
  Study: 'rgb(var(--accent))',
  Other: '#71717A',
};

function LogModal({ onClose }) {
  const { logScreenTime, toast } = useApp();
  const [cat, setCat] = useState('Social');
  const [min, setMin] = useState(15);
  return (
    <Modal
      open
      onClose={onClose}
      title="Log screen time"
      sub="Manual for now — an iOS Shortcut can post here later."
      width="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              logScreenTime(cat, Number(min));
              toast('Logged', { sub: `${fmtDur(Number(min))} of ${cat}`, tone: 'muted' });
              onClose();
            }}
          >
            Log
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(CAT_COLORS).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cx('h-7 rounded-full border px-3 text-xs', cat === c ? 'border-accent/50 bg-accent/12 text-accent' : 'border-line text-ink2')}
            >
              {c}
            </button>
          ))}
        </div>
        <Field label="Minutes">
          <input type="number" className="input" value={min} onChange={(e) => setMin(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export default function ScreenTime() {
  const { screenTimeLogs, settings } = useApp();
  const [logging, setLogging] = useState(false);
  const limit = settings.screenLimitMin;
  const empty = { totalMin: 0, byCategory: SCREEN_CATEGORIES.map((name) => ({ name, min: 0 })) };
  const days = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6));
  const logFor = (d) => screenTimeLogs.find((l) => l.date === d);
  const today = logFor(TODAY) || empty;
  const yesterday = logFor(addDays(TODAY, -1));
  const ratio = today.totalMin / limit;
  const left = limit - today.totalMin;
  const pastLogs = days.slice(0, 6).map(logFor).filter(Boolean);
  const overDays = pastLogs.filter((l) => l.totalMin > limit).length;
  const avg = pastLogs.length ? Math.round(pastLogs.reduce((s, l) => s + l.totalMin, 0) / pastLogs.length) : 0;
  const maxCat = Math.max(...today.byCategory.map((c) => c.min), 1);

  return (
    <div>
      <PageHeader
        title="Screen time"
        sub={`Daily limit ${fmtDur(limit)}${pastLogs.length ? ` · ${pastLogs.length}-day average ${fmtDur(avg)}` : ''}`}
        actions={
          <Button variant="outline" icon={Plus} onClick={() => setLogging(true)}>
            Log time
          </Button>
        }
      />

      <Tip id="screen" />

      {yesterday && yesterday.totalMin > limit && (
        <Callout icon={ShieldAlert} tone="danger" className="mb-4">
          Yesterday was <b className="text-ink">{fmtDur(yesterday.totalMin)}</b> — {fmtDur(yesterday.totalMin - limit)} over. Biggest category:{' '}
          {[...yesterday.byCategory].sort((a, b) => b.min - a.min)[0].name.toLowerCase()}.
        </Callout>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col items-center py-8">
          <div className="label mb-5">Today so far</div>
          <Ring value={ratio} size={176} stroke={10} color={ratio > 1 ? '#F87171' : ratio > 0.85 ? '#FBBF24' : 'rgb(var(--accent))'}>
            <div className="text-center">
              <div className="text-3xl font-semibold tabular-nums tracking-tight">{fmtDur(today.totalMin)}</div>
              <div className="mt-1 text-xs text-ink3">of {fmtDur(limit)}</div>
            </div>
          </Ring>
          <p className={cx('mt-5 text-sm', left < 0 ? 'text-danger' : 'text-ink2')}>
            {today.totalMin === 0 ? 'Nothing logged today' : left >= 0 ? `${fmtDur(left)} left today` : `${fmtDur(-left)} over`}
          </p>
        </Card>

        <Card>
          <CardHeader title="By category · today" />
          <div className="space-y-4">
            {today.byCategory.map((c) => (
              <div key={c.name}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-ink2">{c.name}</span>
                  <span className="tabular-nums text-ink3">{fmtDur(c.min)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full" style={{ width: `${(c.min / maxCat) * 100}%`, background: CAT_COLORS[c.name], transition: 'width 500ms' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Last 7 days" sub={pastLogs.length ? `${overDays} of ${pastLogs.length} logged day${pastLogs.length === 1 ? '' : 's'} over the limit` : 'Log a few days to see your trend.'} />
        <TrendBars limit={limit} data={days.map((d) => ({ label: d === TODAY ? 'Today' : DOW[dow(d)], value: logFor(d)?.totalMin || 0, today: d === TODAY }))} />
      </Card>

      <Callout icon={Info} className="mt-4">
        This app only <b className="text-ink">logs</b> screen time. Actually blocking apps needs something like Opal or one sec on your phone. Later, an iOS Shortcut can send totals here automatically via a webhook.
      </Callout>

      {logging && <LogModal onClose={() => setLogging(false)} />}
    </div>
  );
}
