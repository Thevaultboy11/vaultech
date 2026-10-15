import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useApp } from '../../store';
import { cx } from '../ui';
import { NAV, SETTINGS_ITEM, labelFor } from './nav';

export function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 18h18" stroke="#3F3F4A" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 15l5-5 4 3 7-7" stroke="rgb(var(--accent))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="6" r="1.8" fill="rgb(var(--accent))" />
      </svg>
      {!collapsed && (
        <span className="leading-none">
          <span className="block text-[12.5px] font-semibold tracking-[0.26em] text-ink">VAULT TECH</span>
          <span className="mt-1 block text-[8.5px] font-medium tracking-[0.42em] text-ink3">INDUSTRIES</span>
        </span>
      )}
    </div>
  );
}

export const initialsOf = (name) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '·';

function NavItem({ item, label, active, collapsed, badge, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cx(
        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition',
        active ? 'bg-white/[0.045] text-ink' : 'text-ink2 hover:bg-white/[0.03] hover:text-ink',
        collapsed && 'justify-center px-0'
      )}
    >
      {active && <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-accent" />}
      <Icon size={16} className={cx(active ? 'text-accent' : 'text-ink3 group-hover:text-ink2')} />
      {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      {!collapsed && badge > 0 && <span className="rounded-full bg-white/[0.06] px-1.5 text-[10px] tabular-nums text-ink2">{badge}</span>}
    </button>
  );
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const { activeView, go, profile, derived } = useApp();
  const badges = { today: derived.openToday.length, courses: derived.totalGap };
  const sub = [profile.school, profile.role].filter(Boolean).join(' · ');

  return (
    <aside className={cx('sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-bg md:flex', collapsed ? 'w-[68px]' : 'w-[228px]')}>
      <div className={cx('flex h-14 items-center', collapsed ? 'justify-center' : 'justify-between px-5')}>
        <Logo collapsed={collapsed} />
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-ink3 hover:text-ink2" aria-label="Collapse sidebar">
            <ChevronsLeft size={15} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2">
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-ink3 hover:text-ink2" aria-label="Expand sidebar">
            <ChevronsRight size={15} />
          </button>
        )}
        {NAV.map((g) => (
          <div key={g.group}>
            {!collapsed && <div className="label mb-1.5 px-3">{g.group}</div>}
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  label={labelFor(item, profile)}
                  active={activeView === item.id}
                  collapsed={collapsed}
                  badge={badges[item.id]}
                  onClick={() => go(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-line p-3">
        <NavItem item={SETTINGS_ITEM} label="Settings" active={activeView === 'settings'} collapsed={collapsed} onClick={() => go('settings')} />
        <button
          onClick={() => go('settings')}
          className={cx('flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-white/[0.03]', collapsed && 'justify-center px-0')}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/40 to-accent/10 text-[11px] font-semibold text-ink">
            {initialsOf(profile.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium">{profile.name ? profile.name.split(' ')[0] : 'Set up profile'}</div>
              <div className="truncate text-[11px] text-ink3">{sub || 'Name, school, job'}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
