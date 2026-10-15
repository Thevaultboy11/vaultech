# Vault Tech Industries

A personal productivity platform for school, work and life — courses with a **baseline gap tracker**, a daily plan, tasks, a week calendar, habits, reading, gym, focus timer, screen time, a sales pipeline and an arbitrage board.

It runs entirely in your browser. No account, no server: everything you enter is saved on your device.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Needs Node 18 or newer.

`npm run build` creates a production build in `dist/`; `npm run preview` serves it.

## First launch

The app starts **empty**. **Tutorial mode** is on by default:

- each page shows a short “how this page works” card
- the Dashboard shows an 8-step **Getting started** checklist that ticks itself as you go

Dismiss tips one by one with **Got it**, or turn the whole thing off in **Settings → Tutorial mode**. **Restart tutorial** brings every tip back.

## Where your data lives

Everything is stored as **one JSON object** in your browser’s `localStorage`, under the key `vault-tech-industries:data`. It saves automatically a moment after every change.

- **Settings → Your data → Export JSON** downloads a backup (`vault-tech-industries-YYYY-MM-DD.json`).
- **Import JSON** loads a backup — use it to move to another browser or device.
- **Erase…** wipes everything.

Data is per browser and per device. Clearing site data or using a private window loses it — export a backup now and then.

## Pages

| Page | What it does |
| --- | --- |
| Dashboard | Greeting, course gap cards, Top 3, reading pace, habits, weekly goals, focus minutes, screen time |
| Today | Overdue / Today / Tonight, planned vs free hours, pick Top 3, Evening shutdown |
| Tasks | List (grouped by area, subtasks nested) or Board; filters; details drawer |
| Calendar | Week view, add blocks (with weekly repeat), protected blocks, click-to-schedule, Auto-Plan |
| Courses | Add courses + syllabus topics; gap and hours-to-catch-up recalculate live |
| Focus | 25/50 min timer linked to a course or task; weekly forest |
| Habits | Weekly targets, 28-day heatmap, rolling strength that never resets to zero |
| Reading | Shelves, pages/day needed, yearly goal, log pages |
| Gym | Push/Pull/Legs templates prefilled from your last session, PRs |
| Screen Time | Manual log by category, daily limit, 7-day trend |
| Job | Lead pipeline + commission helper (named after your company in Settings) |
| Arbitrage | Deal board with automatic margin and health badge |
| Settings | Profile, tutorial mode, accent, density, targets, data backup |

### Quick-add

Type in the top bar (or press ⌘K / Ctrl K):

```
Calc pset every Mon 9am p1 #school
```

It understands days (`today`, `tonight`, `tomorrow`, `fri`), times (`9am`, `21:00`), `every Mon` / `daily`, `due fri`, priority `p1`–`p4`, `#school` / `#job` / `#arbitrage` / `#misc`, durations (`45m`, `1.5h`), and your own course short names.

### How the gap works

`gap = (topics already taught that are still "not started") − (future topics you've already covered)`

Positive = behind, 0 = on baseline, negative = ahead. Hours to catch up = the sum of the behind topics’ estimates. See `src/lib/courses.js`.

## Stack

React 18 · Vite · Tailwind CSS 3 · lucide-react · framer-motion. No router: the sidebar sets `activeView` and `App.jsx` renders the matching page.

```
src/
  App.jsx                 shell + view switch
  store.jsx               all state, actions and localStorage saving
  data/defaults.js        empty starting data, settings, workout templates
  lib/                    dates, gap math, quick-add parser
  components/
    Tutorial.jsx          tutorial tips + getting-started checklist
    layout/               Sidebar, TopBar, MobileNav, Toaster
    tasks/                TaskRow, TaskDrawer
    ui.jsx, charts.jsx, Kanban.jsx
    Dashboard.jsx … Settings.jsx   one file per page
```

## Not included (yet)

- **Google Calendar sync** — planned; shown as “Coming soon” in Settings
- iOS Shortcuts webhook — planned
- App blocking — out of scope; use Opal or one sec
