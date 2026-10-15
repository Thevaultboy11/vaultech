import { Calculator, Plus, User } from 'lucide-react';
import { useState } from 'react';
import { TODAY, addDays, relDay } from '../lib/dates';
import { useApp } from '../store';
import { Board } from './Kanban';
import { Button, Card, CardHeader, EmptyState, Field, Modal, PageHeader, Segmented, cx } from './ui';
import { Tip } from './Tutorial';

const STAGES = [
  { id: 'idea', label: 'Idea', color: '#71717A' },
  { id: 'outreach', label: 'Outreach', color: '#A78BFA' },
  { id: 'meeting', label: 'Meeting', color: 'rgb(var(--accent))' },
  { id: 'proposal', label: 'Proposal', color: '#FBBF24' },
  { id: 'closed', label: 'Closed', color: '#4ADE80' },
  { id: 'lost', label: 'Lost', color: '#F87171' },
];

// Rough, human rounding: $167k → "$170k", $52k → "$52k"
const k = (n) =>
  n >= 100000 ? `$${Math.round(n / 10000) * 10}k` : n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;

function CommissionHelper() {
  const [target, setTarget] = useState(5000);
  const [role, setRole] = useState('both');
  const rows = [
    { id: 'closer', label: 'Closer', range: '5–10%', lo: target / 0.1, hi: target / 0.05 },
    { id: 'finder', label: 'Finder', range: '1–3%', lo: target / 0.03, hi: target / 0.01 },
  ].filter((r) => role === 'both' || r.id === role);
  const max = target / 0.01;
  return (
    <Card>
      <CardHeader title="Commission helper" icon={Calculator} sub="How much needs to close to hit a number." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink2">
          To earn
          <span className="flex items-center rounded-xl border border-line bg-bg px-2">
            <span className="text-ink3">$</span>
            <input
              type="number"
              step={500}
              value={target}
              onChange={(e) => setTarget(Math.max(0, Number(e.target.value)))}
              className="h-8 w-20 bg-transparent px-1 text-sm tabular-nums text-ink outline-none"
            />
          </span>
        </label>
        <Segmented
          size="sm"
          value={role}
          onChange={setRole}
          options={[
            { value: 'both', label: 'Both' },
            { value: 'closer', label: 'Closer' },
            { value: 'finder', label: 'Finder' },
          ]}
        />
      </div>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id}>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-ink2">
                {r.label} <span className="text-ink3">· {r.range}</span>
              </span>
              <span className="font-semibold tabular-nums text-ink">
                ~{k(r.lo)}–{k(r.hi)} closed
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-line">
              <div
                className="absolute h-full rounded-full bg-accent/70"
                style={{ left: `${(r.lo / max) * 100}%`, width: `${((r.hi - r.lo) / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-ink3">
        Illustrative only — real rates depend on your agreement. Check the actual terms before planning around these.
      </p>
    </Card>
  );
}

function NewLeadModal({ onClose }) {
  const { addLead } = useApp();
  const [f, setF] = useState({ company: '', contact: '', nextAction: 'Send intro email', dueDate: addDays(TODAY, 2), stage: 'idea' });
  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));
  return (
    <Modal
      open
      onClose={onClose}
      title="New lead"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!f.company.trim()}
            onClick={() => {
              addLead(f);
              onClose();
            }}
          >
            Add lead
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Company">
          <input autoFocus className="input" value={f.company} onChange={set('company')} placeholder="Company name" />
        </Field>
        <Field label="Contact">
          <input className="input" value={f.contact} onChange={set('contact')} placeholder="Name · role" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Next action">
            <input className="input" value={f.nextAction} onChange={set('nextAction')} />
          </Field>
          <Field label="Due">
            <input type="date" className="input" value={f.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default function Job() {
  const { jobLeads, moveLead, deleteLead, tasks, go, profile } = useApp();
  const [adding, setAdding] = useState(false);
  const jobTasks = tasks.filter((t) => t.area === 'job' && t.status !== 'done');
  const counts = Object.fromEntries(STAGES.map((s) => [s.id, jobLeads.filter((l) => l.stage === s.id).length]));

  return (
    <div>
      <PageHeader
        title={profile.company || 'Job'}
        sub={[profile.role, `${counts.outreach} in outreach`, `${counts.meeting} meeting${counts.meeting === 1 ? '' : 's'} booked`].filter(Boolean).join(' · ')}
        actions={
          <Button icon={Plus} onClick={() => setAdding(true)}>
            New lead
          </Button>
        }
      />

      <Tip id="job" />

      <Board
        columns={STAGES}
        items={jobLeads}
        getCol={(l) => l.stage}
        onMove={moveLead}
        onDelete={deleteLead}
        renderEmpty={(col) =>
          col.id === 'lost' ? (
            <EmptyState title="None lost" compact />
          ) : col.id === 'closed' ? (
            <EmptyState title="First close lands here" compact />
          ) : (
            <EmptyState title="Empty" cta="Add lead" onCta={() => setAdding(true)} compact />
          )
        }
        renderCard={(l) => {
          const overdue = l.dueDate && l.dueDate < TODAY;
          const soon = l.dueDate && l.dueDate <= addDays(TODAY, 1);
          return (
            <div>
              <div className="text-[13px] font-medium">{l.company}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink3">
                <User size={10} /> {l.contact || '—'}
              </div>
              <div className="mt-2.5 rounded-lg bg-white/[0.03] px-2 py-1.5 text-[11.5px] text-ink2">{l.nextAction}</div>
              <div className={cx('mt-2 text-[11px] tabular-nums', overdue ? 'text-danger' : soon ? 'text-warning' : 'text-ink3')}>
                {overdue ? 'overdue · ' : ''}
                {l.dueDate ? relDay(l.dueDate) : 'no date'}
              </div>
            </div>
          );
        }}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <CommissionHelper />
        <Card>
          <CardHeader
            title="Job tasks"
            action={
              <Button variant="ghost" size="sm" onClick={() => go('tasks')}>
                All
              </Button>
            }
          />
          <div className="space-y-2">
            {jobTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate text-ink2">{t.title}</span>
                <span className="shrink-0 text-[11px] text-ink3">{t.dueDate ? relDay(t.dueDate) : '—'}</span>
              </div>
            ))}
            {!jobTasks.length && <p className="text-xs text-ink3">All caught up.</p>}
          </div>
        </Card>
      </div>

      {adding && <NewLeadModal onClose={() => setAdding(false)} />}
    </div>
  );
}
