# Vault Tech Industries

A personal productivity platform for school, work and life — courses with a **baseline gap tracker**, a daily plan, tasks, a week calendar, habits, reading, gym, focus timer, screen time, a sales pipeline and an arbitrage board.

You sign in with Google, and everything is saved to one Firestore document in your account, so it's the same on every device.

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

## Sign-in and saving (Firebase)

The app opens on a **Continue with Google** screen. Once you're signed in, everything is saved to **one Firestore document for your account**:

```
vaultech/{your account id}
  data:      { profile, settings, tasks: [...], courses: [...], habits: [...], ... }
  updatedAt: 1792…
```

- **No document is created until you sign in,** and never more than one per account.
- **Opening the app, reloading or using another device doesn't write anything.**
- **It writes only when you change something.** Quick edits are batched, at most one save every 2 seconds.
- **Your other devices update live.** A copy is also cached in the browser so the app opens if you're offline.
- **Settings → Account** shows who's signed in and has **Sign out**. A small icon appears in the top bar only if saving has a problem or you're offline.

### One-time Firebase setup

1. **Authentication → Sign-in method → Google → Enable** (pick your support email) → Save. `localhost` is already an authorized domain. If you host the app somewhere, add that address under **Authentication → Settings → Authorized domains**.
2. **Firestore → Rules:** replace the old `vaultech` block with the one in [`firestore.rules`](firestore.rules), then click **Publish**:
   ```
   match /vaultech/{uid} {
     allow read, write: if request.auth != null && request.auth.uid == uid;
   }
   ```
3. Optional cleanup: delete the old `vt-…` documents in the `vaultech` collection. They came from the earlier no-sign-in version and aren't used anymore.

If you had data in this browser from before sign-in existed, it's moved into your account the first time you sign in.

The Firebase web config is in `src/firebaseConfig.js`. These values are public by design; the rules protect the data.

### Testing without touching real data

```bash
node test/mockServer.mjs     # a local stand-in for Firestore that counts writes
CLOUD_MOCK=1 npm run dev     # the app with a fake sign-in, pointed at the stand-in
```

## Google Calendar (read-only, no sign-in)

The Calendar page can show events from your Google calendars, using the API key in `src/googleConfig.js`.

- **An API key can only read *public* calendars.** For each calendar you want to show:
  1. Open Google Calendar on a computer → ⚙️ **Settings** → click the calendar on the left.
  2. Under **Access permissions for events**, tick **Make available to public**, with **See all event details**.
  3. Under **Integrate calendar**, copy the **Calendar ID**. For your main calendar it's your Gmail address.
  4. In the app, go to **Settings → Google Calendar** and paste the ID. You can add several calendars.
- **Two calendars are built in** (`src/googleConfig.js`): the shared `c_2ac9…@group.calendar.google.com` calendar and `dd4017@nyu.edu`. They're added on first launch. You can turn them off or remove them in Settings.
- You can also paste a Google share link (`…?cid=…`) instead of the ID. The app decodes it.
- **"Public" means anyone who knows the calendar ID can see its events.** Keep private things in a calendar you don't add here.
- **Events are read-only.** They show with a dashed outline. **Today** and **Auto-Plan** treat them as busy time.
- **Events refresh** every 10 minutes, when you come back to the tab, or with the Refresh button.
- **Events are not saved to Firestore.** Only the list of calendar IDs is synced, so the cloud document stays tiny.

**Protect the API key** (it's in a public repo): Google Cloud Console → **APIs & Services → Credentials** → your key.
- Under **Application restrictions**, choose **Websites** and add `http://localhost:5173/*`, plus your site's address if you host it.
- Under **API restrictions**, choose **Restrict key** and select **Google Calendar API** only.

## Where your data lives

Everything is stored in **one Firestore document** for your account (above). It saves automatically a moment after every change.

- **Settings → Your data → Export JSON** downloads a backup (`vault-tech-industries-YYYY-MM-DD.json`).
- **Import JSON** loads a backup — use it to move to another browser or device.
- **Erase…** wipes everything in your account.


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
  firebaseConfig.js       Firebase project config
  lib/cloud/              sync.js (sync logic) + firebaseBackend.js (Firestore calls)
firestore.rules, firebase.json, .firebaserc   Firestore rules + CLI deploy config
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

- Private Google calendars (that would need Google sign-in) and writing blocks back to Google Calendar
- iOS Shortcuts webhook — planned
- App blocking — out of scope; use Opal or one sec
