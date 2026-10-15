import { ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cx } from './ui';

// Horizontal-scrolling board. Cards move with arrows (no drag in the mockup)
// plus a "…" menu to jump to any column (e.g. Dead / Lost).
export function Board({ columns, items, getCol, renderCard, onMove, onDelete, renderEmpty, columnFooter }) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      <div className="flex gap-3" style={{ minWidth: columns.length * 196 }}>
        {columns.map((col, ci) => {
          const list = items.filter((i) => getCol(i) === col.id);
          return (
            <div key={col.id} className="flex w-[236px] shrink-0 flex-col rounded-card border border-line bg-surface/60 p-2.5 lg:w-auto lg:min-w-[184px] lg:flex-1">
              <div className="mb-2.5 flex items-center gap-2 px-1.5 pt-1">
                <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[13px] font-semibold">{col.label}</span>
                <span className="text-[11px] tabular-nums text-ink3">{list.length}</span>
                {columnFooter && <span className="ml-auto text-[11px] tabular-nums text-ink3">{columnFooter(list)}</span>}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {list.map((item) => (
                  <MovableCard key={item.id} columns={columns} index={ci} onMove={(to) => onMove(item.id, to)} onDelete={onDelete && (() => onDelete(item.id))}>
                    {renderCard(item)}
                  </MovableCard>
                ))}
                {!list.length && renderEmpty(col)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MovableCard({ children, columns, index, onMove, onDelete }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="group relative rounded-xl border border-line bg-bg/80 p-3 transition hover:border-ink3/30">
      {children}
      <div className="mt-2.5 flex items-center justify-between border-t border-line/70 pt-2">
        <button
          disabled={index === 0}
          onClick={() => onMove(columns[index - 1].id)}
          className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] text-ink3 hover:bg-white/[0.04] hover:text-ink disabled:opacity-0"
        >
          <ChevronLeft size={12} /> {columns[index - 1]?.label}
        </button>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} className="rounded-full p-1 text-ink3 hover:bg-white/[0.04] hover:text-ink" aria-label="Move to…">
            <MoreHorizontal size={13} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute bottom-7 left-1/2 z-20 w-36 -translate-x-1/2 rounded-xl border border-line bg-surface2 p-1 shadow-2xl">
                {columns.map((c, i) => (
                  <button
                    key={c.id}
                    disabled={i === index}
                    onClick={() => {
                      onMove(c.id);
                      setMenu(false);
                    }}
                    className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs', i === index ? 'text-ink3' : 'text-ink2 hover:bg-white/[0.05] hover:text-ink')}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </button>
                ))}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setMenu(false);
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-line px-2 py-1.5 text-left text-xs text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <button
          disabled={index === columns.length - 1}
          onClick={() => onMove(columns[index + 1].id)}
          className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] text-ink3 hover:bg-white/[0.04] hover:text-ink disabled:opacity-0"
        >
          {columns[index + 1]?.label} <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
