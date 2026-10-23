import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home as HomeIcon, ListChecks, HandCoins, Menu, RotateCcw, Plus } from 'lucide-react';
import { BrandMark } from './components/bits.jsx';
import { Sheet } from './components/Sheet.jsx';
import { SwipeSheet } from './components/SwipeSheet.jsx';
import { AddCashSheet } from './components/AddCashSheet.jsx';
import { InviteSheet } from './components/InviteSheet.jsx';
import { Toasts, useToasts } from './components/Toasts.jsx';
import { Home } from './screens/Home.jsx';
import { Activity } from './screens/Activity.jsx';
import { Settle } from './screens/Settle.jsx';
import { Setup } from './screens/Setup.jsx';
import { computeBalances } from './lib/settle.js';
import { MERCHANTS, loadState, makeId, newTripState, saveState, seedState } from './lib/seed.js';
import { addMinutes } from './lib/dates.js';
import { inr } from './lib/money.js';

const DISCLAIMER = 'Concept prototype for a product assignment. Not affiliated with or endorsed by Scapia.';

export default function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState('home');
  const [swipe, setSwipe] = useState(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [freshId, setFreshId] = useState(null);
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => saveState(state), [state]);

  const balances = useMemo(() => computeBalances(state.members, state.payments), [state.members, state.payments]);
  const you = state.members.find((m) => m.isYou) || state.members[0];
  const nameOf = useCallback((id) => {
    const m = state.members.find((x) => x.id === id);
    return m?.isYou ? 'You' : m?.name || 'Someone';
  }, [state.members]);

  const go = (t) => {
    setTab(t);
    requestAnimationFrame(() => document.getElementById('main')?.scrollTo({ top: 0 }));
  };

  const simulateSwipe = () => {
    const cardholders = state.members.filter((m) => m.hasCard);
    if (!cardholders.length) {
      push({ title: 'Nobody on this trip has the card', sub: 'Add payments by hand instead.' });
      return;
    }
    let idx = Math.floor(Math.random() * MERCHANTS.length);
    if (idx === state.lastMerchant) idx = (idx + 1) % MERCHANTS.length;
    // the organiser pays most often, as in real trips; others still show up
    const payer = Math.random() < 0.5 && cardholders.some((m) => m.isYou)
      ? cardholders.find((m) => m.isYou)
      : cardholders[Math.floor(Math.random() * cardholders.length)];
    const m = MERCHANTS[idx];
    setSwipe({ ...m, payerId: payer.id, idx, ts: addMinutes(state.clock, 35 + Math.floor(Math.random() * 120)) });
  };

  const logSwipe = ({ kind, shares }) => {
    if (!swipe) return;
    const id = makeId('p');
    const payment = {
      id, ts: swipe.ts, title: swipe.title, what: swipe.what, amount: swipe.amount,
      payerId: swipe.payerId, kind, source: 'card', shares,
    };
    const prev = state;
    setState((s) => ({ ...s, payments: [...s.payments, payment], clock: swipe.ts, lastMerchant: swipe.idx }));
    setFreshId(id);
    setSwipe(null);
    const n = Object.keys(shares).length;
    push({
      title: kind === 'personal' ? `Logged as ${swipe.payerId === you.id ? 'yours' : `${nameOf(swipe.payerId)}’s`}` : `Split ${n} ways`,
      sub: `${inr(swipe.amount)} at ${swipe.title}${kind === 'personal' ? '. Nobody owes anything.' : '. Balances updated.'}`,
      action: { label: 'Undo', onClick: () => setState(prev) },
    });
  };

  const addCash = (p) => {
    const id = makeId('p');
    const ts = addMinutes(state.clock, 20);
    setState((s) => ({ ...s, payments: [...s.payments, { id, ts, ...p }], clock: ts }));
    setFreshId(id);
    setCashOpen(false);
    push({ title: `${inr(p.amount)} added`, sub: `${p.title}, paid by ${nameOf(p.payerId).toLowerCase() === 'you' ? 'you' : nameOf(p.payerId)}` });
  };

  const resetDemo = () => {
    setState(seedState());
    setMenuOpen(false);
    setSwipe(null);
    go('home');
    push({ title: 'Demo reset', sub: 'Back to the Gokarna Weekend.' });
  };

  const createTrip = (input) => {
    setState(newTripState(input));
    go('home');
    push({ title: `${input.name} is live`, sub: 'Card swipes will ask “Group or just me?”' });
  };

  const screen = (() => {
    if (tab === 'setup') {
      return <Setup onCreate={createTrip} onCancel={() => go('home')} canCancel={state.trip.name} />;
    }
    if (tab === 'activity') return <Activity state={state} you={you} freshId={freshId} />;
    if (tab === 'settle') {
      return (
        <Settle
          state={state}
          balances={balances}
          you={you}
          onEnd={() => {
            setState((s) => ({ ...s, trip: { ...s.trip, status: 'ended' }, settle: { ...s.settle, paid: {} } }));
            push({ title: 'Trip ended', sub: 'Everyone got their one amount and a UPI link.' });
          }}
          onReopen={() => setState((s) => ({ ...s, trip: { ...s.trip, status: 'live' }, settle: { ...s.settle, paid: {} } }))}
          onMarkPaid={(key, t) => {
            setState((s) => ({ ...s, settle: { ...s.settle, paid: { ...s.settle.paid, [key]: true } } }));
            push({ title: `${inr(t.amount)} paid`, sub: `${nameOf(t.from)} → ${nameOf(t.to)}. Reminders stopped for this one.` });
          }}
          onToggleNudges={(v) => setState((s) => ({ ...s, settle: { ...s.settle, nudges: v } }))}
        />
      );
    }
    return (
      <Home
        state={state}
        balances={balances}
        you={you}
        freshId={freshId}
        onSwipe={simulateSwipe}
        onAddCash={() => setCashOpen(true)}
        onInvite={(m) => setInviteFor(m)}
        onGoActivity={() => go('activity')}
        onGoSettle={() => go('settle')}
      />
    );
  })();

  return (
    <div className="stage">
      <aside className="side" aria-label="About this demo">
        <BrandMark className="brand-mark" />
        <h1>Squad Mode</h1>
        <p className="concept">a Scapia concept</p>
        <p style={{ marginTop: 16 }}>
          Group trips go wrong at the moment someone pays and nobody logs it. Squad Mode asks
          &ldquo;Group or just me?&rdquo; right at the card swipe. At the end, the app asks for the money, so
          the organiser never has to.
        </p>
        <ol>
          <li>Tap <strong>Simulate a card swipe</strong> and answer the question.</li>
          <li>Try <strong>Custom split</strong> for a round only some people had.</li>
          <li>Open <strong>Settle</strong>, end the trip, and mark payments as done.</li>
        </ol>
        <p>Seeded with a 5-person Gokarna weekend. Reset or start a new trip from the menu.</p>
        <p className="disclaimer">{DISCLAIMER}</p>
      </aside>

      <div className="phone">
        <header className="topbar">
          <div className="brand">
            <BrandMark />
            <div>
              <div className="brand-name">Squad Mode</div>
              <div className="brand-sub">a Scapia concept</div>
            </div>
          </div>
          <button type="button" className="icon-btn" aria-label="Trip menu" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </header>

        {screen}

        {tab !== 'setup' ? (
          <nav className="tabbar" aria-label="Sections">
            <button type="button" className="tab" aria-current={tab === 'home' ? 'page' : undefined} onClick={() => go('home')}>
              <HomeIcon size={22} aria-hidden="true" /> Trip
            </button>
            <button type="button" className="tab" aria-current={tab === 'activity' ? 'page' : undefined} onClick={() => go('activity')}>
              <ListChecks size={22} aria-hidden="true" /> Activity
            </button>
            <button type="button" className="tab" aria-current={tab === 'settle' ? 'page' : undefined} onClick={() => go('settle')}>
              <HandCoins size={22} aria-hidden="true" /> Settle
            </button>
          </nav>
        ) : null}

        <SwipeSheet swipe={swipe} members={state.members} onLog={logSwipe} onClose={() => setSwipe(null)} />
        <AddCashSheet open={cashOpen} members={state.members} onClose={() => setCashOpen(false)} onAdd={addCash} />
        <InviteSheet
          member={inviteFor}
          tripName={state.trip.name}
          onClose={() => setInviteFor(null)}
          onSent={(m) => {
            setState((s) => ({ ...s, invited: { ...s.invited, [m.id]: true } }));
            setInviteFor(null);
            push({ title: `Invite sent to ${m.name}`, sub: 'Mock invite. Nothing left this page.' });
          }}
        />
        <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} labelledBy="menu-h">
          <h2 id="menu-h" style={{ paddingRight: 48 }}>{state.trip.name}</h2>
          <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn-soft btn-block" onClick={() => { setMenuOpen(false); go('setup'); }} data-autofocus>
              <Plus size={18} aria-hidden="true" /> Start a new trip
            </button>
            <button type="button" className="btn btn-soft btn-block" onClick={resetDemo}>
              <RotateCcw size={18} aria-hidden="true" /> Reset demo
            </button>
          </div>
          <p className="foot" style={{ marginTop: 16 }}>{DISCLAIMER}</p>
        </Sheet>
        <Toasts toasts={toasts} dismiss={dismiss} />
      </div>
    </div>
  );
}
