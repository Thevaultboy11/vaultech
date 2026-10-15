import { AlertTriangle, BookMarked, BookOpen, CheckCircle2, Minus, Play, Plus, Trophy, X } from 'lucide-react';
import { Tip } from './Tutorial';
import { useState } from 'react';
import { TODAY, fmtShort, relDay } from '../lib/dates';
import { readingPace, useApp } from '../store';
import { Button, Card, EmptyState, Field, Modal, PageHeader, Progress, Ring, Segmented, Stat, cx } from './ui';

function Cover({ book, size = 'md' }) {
  const dims = size === 'lg' ? 'h-44 w-32' : size === 'sm' ? 'h-14 w-10' : 'h-20 w-14';
  const initials = book.title
    .split(' ')
    .filter((w) => !['the', 'and', 'is', 'of'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <div
      className={cx('relative flex shrink-0 flex-col justify-between overflow-hidden rounded-lg p-2 shadow-soft', dims)}
      style={{
        background: `linear-gradient(155deg, hsl(${book.hue} 28% 26%), hsl(${book.hue} 22% 12%))`,
        boxShadow: 'inset 3px 0 0 rgba(0,0,0,0.25), 0 10px 30px -15px rgba(0,0,0,0.9)',
      }}
    >
      <span className={cx('font-semibold tracking-tight text-white/85', size === 'lg' ? 'text-3xl' : 'text-xs')}>{initials}</span>
      {size === 'lg' && (
        <span className="text-[10px] leading-tight text-white/60">
          {book.title}
          <br />
          {book.author}
        </span>
      )}
    </div>
  );
}

function AddBookModal({ onClose }) {
  const { addBook } = useApp();
  const [f, setF] = useState({ title: '', author: '', totalPages: 250, status: 'want', tags: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Modal
      open
      onClose={onClose}
      title="Add book"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!f.title.trim() || !(Number(f.totalPages) > 0)}
            onClick={() => {
              addBook({
                title: f.title.trim(),
                author: f.author.trim(),
                totalPages: Number(f.totalPages),
                status: f.status,
                tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3),
              });
              onClose();
            }}
          >
            Add book
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <input autoFocus className="input" value={f.title} onChange={set('title')} placeholder="The Obstacle Is the Way" />
        </Field>
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Field label="Author">
            <input className="input" value={f.author} onChange={set('author')} placeholder="Ryan Holiday" />
          </Field>
          <Field label="Pages">
            <input type="number" min={1} className="input tabular-nums" value={f.totalPages} onChange={set('totalPages')} />
          </Field>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink2">Shelf</span>
          <Segmented
            value={f.status}
            onChange={(v) => setF((x) => ({ ...x, status: v }))}
            options={[
              { value: 'want', label: 'Want to read' },
              { value: 'reading', label: 'Reading now' },
              { value: 'read', label: 'Already read' },
            ]}
          />
        </div>
        <Field label="Tags (comma separated)">
          <input className="input" value={f.tags} onChange={set('tags')} placeholder="stoicism, mindset" />
        </Field>
      </div>
    </Modal>
  );
}

function LogPagesModal({ book, onClose }) {
  const { logPages, settings } = useApp();
  const [n, setN] = useState(10);
  if (!book) return null;
  const pace = readingPace(book, settings.readingDays);
  const after = { ...book, pagesRead: Math.min(book.totalPages, book.pagesRead + n), log: [...book.log, { date: TODAY, pages: n }] };
  const paceAfter = readingPace(after, settings.readingDays);
  const step = (d) => setN((x) => Math.max(1, Math.min(book.totalPages - book.pagesRead, x + d)));
  return (
    <Modal
      open
      onClose={onClose}
      title="Log pages"
      sub={book.title}
      width="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              logPages(book.id, n);
              onClose();
            }}
          >
            Log {n} pages
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-center gap-3 py-4">
        <button onClick={() => step(-5)} className="h-9 w-12 rounded-full border border-line text-xs text-ink2 hover:text-ink">
          −5
        </button>
        <button onClick={() => step(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink2 hover:text-ink" aria-label="Minus one">
          <Minus size={16} />
        </button>
        <input
          type="number"
          value={n}
          onChange={(e) => setN(Math.max(1, Math.min(book.totalPages - book.pagesRead, Number(e.target.value) || 1)))}
          className="w-20 bg-transparent text-center text-4xl font-semibold tabular-nums tracking-tight outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button onClick={() => step(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink2 hover:text-ink" aria-label="Plus one">
          <Plus size={16} />
        </button>
        <button onClick={() => step(5)} className="h-9 w-12 rounded-full border border-line text-xs text-ink2 hover:text-ink">
          +5
        </button>
      </div>
      <div className="rounded-xl bg-bg/70 p-3 text-xs text-ink2">
        <div className="flex justify-between">
          <span>Page</span>
          <span className="tabular-nums">
            {book.pagesRead} → <b className="text-ink">{after.pagesRead}</b> / {book.totalPages}
          </span>
        </div>
        <div className="mt-1.5 flex justify-between">
          <span>Needed per day</span>
          <span className="tabular-nums">
            {pace.needed} → <b className={paceAfter.needed < pace.needed ? 'text-success' : 'text-ink'}>{paceAfter.remaining ? paceAfter.needed : 0}</b>
          </span>
        </div>
      </div>
    </Modal>
  );
}

export default function Reading() {
  const { books, startBook, deleteBook, settings } = useApp();
  const readingYearGoal = settings.readingYearGoal;
  const [shelf, setShelf] = useState('want');
  const [logging, setLogging] = useState(null);
  const [adding, setAdding] = useState(false);
  const current = books.filter((b) => b.status === 'reading');
  const hero = current[0];
  const pace = hero ? readingPace(hero, settings.readingDays) : null;
  const year = TODAY.slice(0, 4);
  const readCount = books.filter((b) => b.status === 'read' && (!b.finishedOn || b.finishedOn.startsWith(year))).length;
  const shelfBooks = books.filter((b) => b.status === shelf);
  const queue = books.filter((b) => b.status === 'want');

  return (
    <div>
      <PageHeader
        title="Reading"
        sub={`One book every ${settings.readingDays} days. ${readingYearGoal} a year.`}
        actions={
          <Button icon={Plus} onClick={() => setAdding(true)}>
            Add book
          </Button>
        }
      />
      <Tip id="reading" />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {hero ? (
          <Card className="overflow-hidden">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
              style={{ background: `hsl(${hero.hue} 50% 40%)` }}
            />
            <div className="relative flex flex-col gap-6 sm:flex-row">
              <Cover book={hero} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="label">Currently reading</div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">{hero.title}</h2>
                <p className="text-sm text-ink3">{hero.author}</p>

                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-xs tabular-nums text-ink2">
                    <span>
                      {hero.pagesRead} / {hero.totalPages} pages
                    </span>
                    <span>{Math.round((hero.pagesRead / hero.totalPages) * 100)}%</span>
                  </div>
                  <Progress value={hero.pagesRead / hero.totalPages} height={8} />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4">
                  <Stat label="Pages / day" value={pace.needed} sub="to finish on time" tone={pace.behind ? 'warning' : undefined} />
                  <Stat label="Days left" value={pace.daysLeft} sub={`day ${pace.day} of ${settings.readingDays}`} />
                  <Stat label="Lately" value={pace.recentPace} sub="pages / day" />
                </div>

                {pace.behind && (
                  <div className="mt-5 flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2.5 text-xs text-warning">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                      Pace is slipping — you’ve averaged {pace.recentPace} pages/day over the last 3 days but need {pace.needed} to finish by{' '}
                      {fmtShort(pace.finishDate)}.
                    </span>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button icon={Plus} onClick={() => setLogging(hero)}>
                    Log pages
                  </Button>
                  <span className="self-center text-xs text-ink3">{pace.todayPages ? `${pace.todayPages} pages today` : 'Nothing logged today'}</span>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={BookOpen}
              title="Nothing on the nightstand"
              text={queue.length ? 'Start one from your queue.' : 'Add the book you’re reading (or want to read next).'}
              cta={queue.length ? 'Start next book' : 'Add a book'}
              onCta={() => (queue.length ? startBook(queue[0].id) : setAdding(true))}
            />
          </Card>
        )}

        <Card className="flex flex-col items-center justify-center text-center">
          <div className="label mb-4 flex items-center gap-1.5">
            <Trophy size={12} /> {year} goal
          </div>
          <Ring value={readCount / readingYearGoal} size={128} stroke={8}>
            <div>
              <div className="text-3xl font-semibold tabular-nums tracking-tight">{readCount}</div>
              <div className="text-xs text-ink3">of {readingYearGoal}</div>
            </div>
          </Ring>
          <p className="mt-4 text-xs text-ink3">{Math.max(0, readingYearGoal - readCount)} to go this year</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Shelves</span>
            <Segmented
              size="sm"
              value={shelf}
              onChange={setShelf}
              options={[
                { value: 'want', label: `Want ${books.filter((b) => b.status === 'want').length}` },
                { value: 'reading', label: `Reading ${current.length}` },
                { value: 'read', label: `Read ${readCount}` },
              ]}
            />
          </div>
          {shelfBooks.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {shelfBooks.map((b) => (
                <div key={b.id} className="group relative flex items-center gap-3 rounded-xl border border-line p-3">
                  <button onClick={() => deleteBook(b.id)} className="absolute right-1.5 top-1.5 text-ink3 opacity-0 transition hover:text-danger group-hover:opacity-100" aria-label="Delete book">
                    <X size={12} />
                  </button>
                  <Cover book={b} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{b.title}</div>
                    <div className="truncate text-[11px] text-ink3">
                      {[b.author, `${b.totalPages}p`].filter(Boolean).join(' · ')}
                    </div>
                    <div className="mt-1 flex gap-1">
                      {b.tags.map((t) => (
                        <span key={t} className="rounded-full bg-white/[0.05] px-1.5 text-[10px] text-ink3">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {b.status === 'read' && <CheckCircle2 size={15} className="text-success" />}
                  {b.status === 'reading' && <span className="text-[11px] tabular-nums text-accent">{Math.round((b.pagesRead / b.totalPages) * 100)}%</span>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={BookMarked} title="Shelf’s empty" text="Add a book you keep hearing about." cta="Add book" onCta={() => setAdding(true)} compact />
          )}
        </Card>

        <Card>
          <div className="mb-3 text-sm font-semibold">Up next</div>
          {queue.length ? (
            <div className="space-y-2">
              {queue.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="w-3 text-xs tabular-nums text-ink3">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]">{b.title}</div>
                    <div className="truncate text-[11px] text-ink3">{b.author}</div>
                  </div>
                  <Button size="sm" variant={i === 0 ? 'soft' : 'ghost'} icon={Play} onClick={() => startBook(b.id)}>
                    Start
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Queue’s empty" text="Add books to Want to read." compact />
          )}
          {current.length > 1 && (
            <p className="mt-4 text-[11px] text-warning">You’re reading {current.length} at once. One at a time keeps the pace honest.</p>
          )}
        </Card>
      </div>

      {adding && <AddBookModal onClose={() => setAdding(false)} />}
      {logging && <LogPagesModal book={books.find((b) => b.id === logging.id)} onClose={() => setLogging(null)} />}
    </div>
  );
}
