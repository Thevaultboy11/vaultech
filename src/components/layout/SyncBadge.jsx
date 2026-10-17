import { AlertTriangle, CloudOff } from 'lucide-react';
import { useApp } from '../../store';

// Invisible when everything is saved. Only shows up if saving has a problem or you're offline.
export default function SyncBadge() {
  const { cloud, go } = useApp();
  if (cloud.status !== 'error' && cloud.status !== 'offline') return null;
  const Icon = cloud.status === 'error' ? AlertTriangle : CloudOff;
  return (
    <button
      onClick={() => go('settings')}
      title={cloud.error || 'Offline — changes will save when you’re back'}
      aria-label={cloud.status === 'error' ? 'Saving problem' : 'Offline'}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/[0.05] ${cloud.status === 'error' ? 'text-danger' : 'text-warning'}`}
    >
      <Icon size={17} />
    </button>
  );
}
