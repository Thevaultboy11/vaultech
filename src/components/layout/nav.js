import {
  LayoutDashboard,
  Sunrise,
  GraduationCap,
  ListChecks,
  CalendarDays,
  Flame,
  BookOpen,
  Dumbbell,
  ArrowLeftRight,
  Briefcase,
  Timer,
  Smartphone,
  Settings,
} from 'lucide-react';

export const NAV = [
  { group: 'Plan', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today', label: 'Today', icon: Sunrise },
    { id: 'tasks', label: 'Tasks', icon: ListChecks },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ] },
  { group: 'School', items: [
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'focus', label: 'Focus', icon: Timer },
  ] },
  { group: 'Life', items: [
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'screen', label: 'Screen Time', icon: Smartphone },
  ] },
  { group: 'Work', items: [
    { id: 'job', label: 'Job', icon: Briefcase },
    { id: 'arbitrage', label: 'Arbitrage', icon: ArrowLeftRight },
  ] },
];

export const SETTINGS_ITEM = { id: 'settings', label: 'Settings', icon: Settings };
export const ALL_NAV = [...NAV.flatMap((g) => g.items), SETTINGS_ITEM];
export const MOBILE_PRIMARY = ['dashboard', 'today', 'tasks', 'calendar'];

export const TITLES = {
  dashboard: 'Dashboard',
  today: 'Today',
  courses: 'Courses',
  tasks: 'Tasks',
  calendar: 'Calendar',
  habits: 'Habits',
  reading: 'Reading',
  gym: 'Gym',
  arbitrage: 'Arbitrage',
  job: 'Job',
  focus: 'Focus',
  screen: 'Screen Time',
  settings: 'Settings',
};

// The Job page takes your company name from Settings → Profile
export const labelFor = (item, profile) => (item.id === 'job' && profile?.company ? profile.company : item.label);
export const titleFor = (view, profile) => (view === 'job' && profile?.company ? profile.company : TITLES[view]);
