import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { PaymentRow } from './Home.jsx';
import { fmtDay } from '../lib/dates.js';
import { inr } from '../lib/money.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'group', label: 'Group' },
  { id: 'custom', label: 'Custom' },
  { id: 'personal', label: 'Personal' },
];

export function Activity({ state, you, freshId }) {
  const [filter, setFilter] = useState('all');
  const list = [...state.payments]
    .filter((p) => filter === 'all' || p.kind === filter)
    .sort((a, b) => b.ts.localeCompare(a.ts));
  const total = list.reduce((s, p) => s + p.amount, 0);

  const groups = [];
  for (const p of list) {
    const label = p.source === 'imported' ? 'Before the trip' : fmtDay(p.ts);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(p);
    else groups.push({ label, items: [p] });
  }

  return (
    <div className="screen" id="main">
      <div>
        <h1 className="trip-title">Every payment</h1>
        <p className="trip-meta">
          {list.length} {list.length === 1 ? 'payment' : 'payments'} · {inr(total)}
        </p>
      </div>
      <div className="filters" role="group" aria-label="Filter payments">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="pill"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {groups.length ? (
        <div>
          {groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="day-label">{g.label}</h2>
              <ul className="list" style={{ listStyle: 'none', margin: 0 }}>
                <AnimatePresence initial={false}>
                  {g.items.map((p) => (
                    <PaymentRow key={p.id} p={p} members={state.members} youId={you.id} fresh={p.id === freshId} />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="list empty">Nothing tagged {filter} yet.</div>
      )}
    </div>
  );
}
