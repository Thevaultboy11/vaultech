import { Cloud, CloudOff, Loader2, AlertTriangle, Check } from 'lucide-react';
import { useApp } from '../../store';
import { cx } from '../ui';

export const SYNC_LABEL = {
  off: 'Cloud sync off',
  connecting: 'Connecting…',
  syncing: 'Saving to cloud…',
  synced: 'Saved to cloud',
  offline: 'Offline — will sync later',
  error: 'Sync problem',
};

export default function SyncBadge() {
  const { cloud, go } = useApp();
  const s = cloud.status;
  const Icon = s === 'off' || s === 'offline' ? CloudOff : s === 'error' ? AlertTriangle : Cloud;
  const tone = s === 'error' ? 'text-danger' : s === 'offline' || s === 'off' ? 'text-ink3' : s === 'synced' ? 'text-ink2' : 'text-accent';
  return (
    <button
      onClick={() => go('settings')}
      title={cloud.error || SYNC_LABEL[s]}
      aria-label={SYNC_LABEL[s]}
      className={cx('relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/[0.05]', tone)}
    >
      <Icon size={17} />
      {(s === 'syncing' || s === 'connecting') && <Loader2 size={9} className="absolute bottom-1.5 right-1.5 animate-spin" />}
      {s === 'synced' && <Check size={9} strokeWidth={3.5} className="absolute bottom-[7px] right-[7px] text-success" />}
    </button>
  );
}
