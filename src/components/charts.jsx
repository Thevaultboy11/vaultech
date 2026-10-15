import { fmtDur } from '../lib/dates';

// Horizontal bars, one row per item: label · bar · value
export function BarList({ items, max, format = fmtDur }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-[72px_1fr_56px] items-center gap-3">
          <span className="truncate text-xs text-ink2">{i.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full"
              style={{ width: `${(i.value / top) * 100}%`, background: i.color, transition: 'width 500ms cubic-bezier(.2,.8,.2,1)' }}
            />
          </div>
          <span className="text-right text-xs tabular-nums text-ink2">{format(i.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Sparkline with a dashed limit line; points over the limit turn red.
export function Sparkline({ values, limit, labels, width = 260, height = 64 }) {
  const pad = 6;
  const max = Math.max(limit * 1.25, ...values);
  const x = (i) => pad + (i * (width - pad * 2)) / (values.length - 1);
  const y = (v) => height - pad - (v / max) * (height - pad * 2);
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(values.length - 1)},${height - pad} L${x(0)},${height - pad} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height + (labels ? 14 : 0)}`} className="w-full" role="img" aria-label="Trend">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.22" />
          <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={width - pad} y1={y(limit)} y2={y(limit)} stroke="#71717A" strokeDasharray="3 4" strokeWidth="1" />
      <path d={area} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke="rgb(var(--accent))" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 3.2 : 2.2} fill={v > limit ? '#F87171' : 'rgb(var(--accent))'} stroke="#14141A" strokeWidth="1.5" />
      ))}
      {labels &&
        labels.map((l, i) => (
          <text key={i} x={x(i)} y={height + 11} textAnchor="middle" fontSize="9" fill="#71717A">
            {l}
          </text>
        ))}
    </svg>
  );
}

// Vertical bars with a limit line, for 7-day trends
export function TrendBars({ data, limit, height = 140, format = fmtDur }) {
  const max = Math.max(limit * 1.25, ...data.map((d) => d.value));
  return (
    <div className="relative" style={{ height: height + 24 }}>
      <div className="absolute inset-x-0 border-t border-dashed border-ink3/50" style={{ top: height - (limit / max) * height }}>
        <span className="absolute -top-4 right-0 text-[10px] text-ink3">limit {format(limit)}</span>
      </div>
      <div className="flex h-full items-end gap-2 sm:gap-3">
        {data.map((d) => {
          const over = d.value > limit;
          return (
            <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] tabular-nums text-ink3 opacity-0 transition group-hover:opacity-100">{format(d.value)}</span>
              <div
                className="w-full max-w-[34px] rounded-md"
                style={{
                  height: (d.value / max) * height,
                  background: over ? 'rgba(248,113,113,0.75)' : d.today ? 'rgb(var(--accent))' : 'rgb(var(--accent) / 0.35)',
                  transition: 'height 500ms cubic-bezier(.2,.8,.2,1)',
                }}
              />
              <span className={`text-[10px] ${d.today ? 'text-ink' : 'text-ink3'}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
