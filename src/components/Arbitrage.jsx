import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../store';
import { Board } from './Kanban';
import { Button, Card, EmptyState, Field, Modal, PageHeader, Stat, cx } from './ui';
import { Tip } from './Tutorial';

const COLUMNS = [
  { id: 'idea', label: 'Idea', color: '#71717A' },
  { id: 'researching', label: 'Researching', color: '#A78BFA' },
  { id: 'active', label: 'Active', color: 'rgb(var(--accent))' },
  { id: 'done', label: 'Done', color: '#4ADE80' },
  { id: 'dead', label: 'Dead', color: '#F87171' },
];

const money = (n) => `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString()}`;

export function marginHealth(d) {
  const pct = d.buyPrice ? d.margin / d.buyPrice : 0;
  if (pct >= 0.2) return { cls: 'text-success bg-success/10', label: 'healthy', pct };
  if (pct >= 0.1) return { cls: 'text-warning bg-warning/10', label: 'thin', pct };
  return { cls: 'text-danger bg-danger/10', label: 'skip', pct };
}

function NewDealModal({ onClose, initialStatus = 'idea' }) {
  const { addDeal } = useApp();
  const [f, setF] = useState({ item: '', buyPrice: 100, sellPrice: 150, fees: 12, status: initialStatus, notes: '' });
  const margin = Number(f.sellPrice) - Number(f.buyPrice) - Number(f.fees);
  const h = marginHealth({ margin, buyPrice: Number(f.buyPrice) });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Modal
      open
      onClose={onClose}
      title="New deal"
      sub="Margin updates as you type."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!f.item.trim()}
            onClick={() => {
              addDeal({ ...f, buyPrice: Number(f.buyPrice), sellPrice: Number(f.sellPrice), fees: Number(f.fees) });
              onClose();
            }}
          >
            Add deal
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Item">
          <input autoFocus className="input" value={f.item} onChange={set('item')} placeholder="e.g. AirPods Pro 2 (sealed)" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Buy ($)">
            <input type="number" className="input tabular-nums" value={f.buyPrice} onChange={set('buyPrice')} />
          </Field>
          <Field label="Sell ($)">
            <input type="number" className="input tabular-nums" value={f.sellPrice} onChange={set('sellPrice')} />
          </Field>
          <Field label="Fees ($)" >
            <input type="number" className="input tabular-nums" value={f.fees} onChange={set('fees')} />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-bg/70 px-4 py-3">
          <span className="text-xs text-ink3">Margin</span>
          <span className="flex items-center gap-2">
            <span className="text-xl font-semibold tabular-nums">{money(margin)}</span>
            <span className={cx('rounded-full px-2 py-0.5 text-[11px]', h.cls)}>
              {Math.round(h.pct * 100)}% · {h.label}
            </span>
          </span>
        </div>
        <Field label="Stage">
          <select className="input" value={f.status} onChange={set('status')}>
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <textarea rows={2} className="input resize-none" value={f.notes} onChange={set('notes')} placeholder="Where, who, comps…" />
        </Field>
      </div>
    </Modal>
  );
}

export default function Arbitrage() {
  const { deals, moveDeal, deleteDeal } = useApp();
  const [modal, setModal] = useState(null);
  const active = deals.filter((d) => d.status === 'active');
  const done = deals.filter((d) => d.status === 'done');
  const pipeline = deals.filter((d) => ['idea', 'researching'].includes(d.status));

  return (
    <div>
      <PageHeader
        title="Arbitrage"
        sub="Buy low, list clean, sell fast."
        actions={
          <Button icon={Plus} onClick={() => setModal('idea')}>
            New deal
          </Button>
        }
      />

      <Tip id="arbitrage" />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card>
          <Stat label="In play" value={money(active.reduce((s, d) => s + d.margin, 0))} sub={`${active.length} active`} tone="success" />
        </Card>
        <Card>
          <Stat label="Pipeline" value={money(pipeline.reduce((s, d) => s + d.margin, 0))} sub={`${pipeline.length} ideas`} />
        </Card>
        <Card>
          <Stat label="Realized" value={money(done.reduce((s, d) => s + d.margin, 0))} sub={`${done.length} sold`} />
        </Card>
      </div>

      <Board
        columns={COLUMNS}
        items={deals}
        getCol={(d) => d.status}
        onMove={moveDeal}
        onDelete={deleteDeal}
        columnFooter={(list) => (list.length ? money(list.reduce((s, d) => s + d.margin, 0)) : '')}
        renderEmpty={(col) =>
          ['done', 'dead'].includes(col.id) ? (
            <EmptyState title={col.id === 'done' ? 'No sales yet' : 'Nothing dead'} text={col.id === 'done' ? 'First flip lands here.' : 'Good.'} compact />
          ) : (
            <EmptyState title="Empty" cta="Add deal" onCta={() => setModal(col.id)} compact />
          )
        }
        renderCard={(d) => {
          const h = marginHealth(d);
          return (
            <div>
              <div className="text-[13px] font-medium leading-snug">{d.item}</div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] tabular-nums">
                <span className="text-ink3">
                  buy <span className="text-ink2">{money(d.buyPrice)}</span>
                </span>
                <span className="text-ink3">
                  sell <span className="text-ink2">{money(d.sellPrice)}</span>
                </span>
                <span className="text-ink3">
                  fees <span className="text-ink2">{money(d.fees)}</span>
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-lg font-semibold tabular-nums tracking-tight">{money(d.margin)}</span>
                <span className={cx('rounded-full px-2 py-0.5 text-[10.5px]', h.cls)}>
                  {Math.round(h.pct * 100)}% · {h.label}
                </span>
              </div>
              {d.notes && <p className="mt-2 text-[11px] leading-snug text-ink3">{d.notes}</p>}
            </div>
          );
        }}
      />

      {modal && <NewDealModal initialStatus={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
