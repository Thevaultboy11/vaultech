import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useApp } from './store';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import MobileNav from './components/layout/MobileNav';
import Toaster from './components/layout/Toaster';
import TaskDrawer from './components/tasks/TaskDrawer';

import Dashboard from './components/Dashboard';
import Today from './components/Today';
import Courses from './components/Courses';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Habits from './components/Habits';
import Reading from './components/Reading';
import Gym from './components/Gym';
import Arbitrage from './components/Arbitrage';
import Job from './components/Job';
import Focus from './components/Focus';
import ScreenTime from './components/ScreenTime';
import Settings from './components/Settings';

const VIEWS = {
  dashboard: Dashboard,
  today: Today,
  courses: Courses,
  tasks: Tasks,
  calendar: Calendar,
  habits: Habits,
  reading: Reading,
  gym: Gym,
  arbitrage: Arbitrage,
  job: Job,
  focus: Focus,
  screen: ScreenTime,
  settings: Settings,
};

export default function App() {
  const { activeView, settings, accents } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const View = VIEWS[activeView] || Dashboard;

  // Live accent + density from Settings
  useEffect(() => {
    const a = accents[settings.accent] || accents.baby;
    const root = document.documentElement;
    root.style.setProperty('--accent', a.rgb);
    root.style.setProperty('--accent-hover', a.hover);
    root.dataset.density = settings.density;
  }, [settings.accent, settings.density, accents]);

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
              className="mx-auto w-full max-w-[1240px]"
            >
              <View />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <TaskDrawer />
      <Toaster />
    </div>
  );
}
