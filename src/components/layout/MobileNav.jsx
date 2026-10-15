import { AnimatePresence, motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../store';
import { cx } from '../ui';
import { ALL_NAV, MOBILE_PRIMARY, labelFor } from './nav';

export default function MobileNav() {
  const { activeView, go, profile } = useApp();
  const [more, setMore] = useState(false);
  const primary = ALL_NAV.filter((i) => MOBILE_PRIMARY.includes(i.id));
  const inMore = !MOBILE_PRIMARY.includes(activeView);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={cx('relative flex flex-col items-center gap-1 py-2.5 text-[10px]', active ? 'text-ink' : 'text-ink3')}
              >
                {active && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-accent" />}
                <Icon size={19} className={active ? 'text-accent' : ''} />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => setMore(true)}
            className={cx('relative flex flex-col items-center gap-1 py-2.5 text-[10px]', inMore ? 'text-ink' : 'text-ink3')}
          >
            {inMore && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-accent" />}
            <MoreHorizontal size={19} className={inMore ? 'text-accent' : ''} />
            More
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {more && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setMore(false)} />
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface p-5 pb-8"
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ type: 'spring', damping: 30, stiffness: 330 }}
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
              <div className="grid grid-cols-4 gap-2">
                {ALL_NAV.filter((i) => !MOBILE_PRIMARY.includes(i.id)).map((item) => {
                  const Icon = item.icon;
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        go(item.id);
                        setMore(false);
                      }}
                      className={cx(
                        'flex flex-col items-center gap-2 rounded-2xl py-3 text-[11px]',
                        active ? 'bg-accent/12 text-accent' : 'text-ink2 hover:bg-white/[0.04]'
                      )}
                    >
                      <Icon size={20} />
                      <span className="max-w-full truncate px-1">{labelFor(item, profile)}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
