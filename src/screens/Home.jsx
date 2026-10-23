import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CreditCard, Plus, Send, Utensils, Car, Waves, Ticket, Beer, Bus, BedDouble, Banknote, ShoppingBag } from 'lucide-react';
import { AnimatedAmount, Avatar, Coins, KindTag } from '../components/bits.jsx';
import { inr } from '../lib/money.js';
import { fmtDateRange, fmtWhen } from '../lib/dates.js';

export function merchantIcon(p) {
  const t = `${p.title} ${p.what || ''}`.toLowerCase();
  if (/bus|fuel/.test(t)) return Bus;
  if (/zostel gokarna|stay|room|night/.test(t)) return BedDouble;
  if (/auto|rickshaw|taxi|cab/.test(t)) return Car;
  if (/boat|water|kayak|beach entry|sports/.test(t)) return Waves;
  if (/entry|ticket|temple/.test(t)) return Ticket;
  if (/bar|beer|drink/.test(t)) return Beer;
  if (/café|cafe|shack|restaurant|dinner|lunch|breakfast|thali/.test(t)) return Utensils;
  if (/sunglass|shop|street/.test(t)) return ShoppingBag;
  return Banknote;
}

export function sourceLabel(p, members) {
  const payer = members.find((m) => m.id === p.payerId);
  const who = payer?.isYou ? 'You' : payer?.name || 'Someone';
  if (p.source === 'imported') return `${who}, imported`;
  if (p.source === 'card') return `${who}, card`;
  if (p.source === 'upi') return `${who}, UPI`;
  return `${who}, cash`;
}

export function PaymentRow({ p, members, youId, fresh }) {
  const Icon = merchantIcon(p);
  const yourShare = p.shares[youId] || 0;
  const youPaid = p.payerId === youId;
  let effect = 0;
  if (youPaid) effect = p.amount - yourShare;
  else effect = -yourShare;
  const reduce = useReducedMotion();
  return (
    <motion.li
      className="row"
      layout={reduce ? false : 'position'}
      initial={fresh && !reduce ? { opacity: 0, transform: 'translateY(-8px)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <span className="merchant-icon"><Icon size={19} aria-hidden="true" /></span>
      <div className="row-main">
        <p className="row-title">{p.title}</p>
        <p className="row-sub">
          <KindTag kind={p.kind} /> {sourceLabel(p, members)}
        </p>
      </div>
      <p className="row-amt">
        {inr(p.amount)}
        <small className={effect > 0 ? 'amt-owed' : effect < 0 ? 'amt-owe' : ''}>
          {p.kind === 'personal' && !youPaid ? 'not yours' : effect > 0 ? `you lent ${inr(effect)}` : effect < 0 ? `your share ${inr(-effect)}` : 'all yours'}
        </small>
      </p>
    </motion.li>
  );
}

export function Home({ state, balances, you, onSwipe, onAddCash, onInvite, onGoActivity, onGoSettle, freshId }) {
  const reduce = useReducedMotion();
  const myBal = balances[you.id] || 0;
  const others = state.members.filter((m) => !m.isYou);
  const recent = [...state.payments].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 4);
  const imported = state.payments.filter((p) => p.source === 'imported');
  const importedTotal = imported.reduce((s, p) => s + p.amount, 0);
  const noCard = state.members.filter((m) => !m.hasCard && !state.invited[m.id]);
  const firstNoCard = noCard[0];
  const groupSpend = state.payments.filter((p) => p.kind !== 'personal').reduce((s, p) => s + p.amount, 0);
  const cardholders = state.members.filter((m) => m.hasCard);
  const ended = state.trip.status === 'ended';

  return (
    <div className="screen" id="main">
      <div>
        <h1 className="trip-title">{state.trip.name}</h1>
        <p className="trip-meta">
          {fmtDateRange(state.trip.start, state.trip.end)} · {state.members.length} people · {inr(groupSpend)} shared so far
        </p>
      </div>

      <section className="hero" aria-labelledby="bal-label">
        <p className="hero-label" id="bal-label">
          {myBal > 0 ? "You're owed" : myBal < 0 ? 'You owe' : "You're all square"}
        </p>
        <p className={`hero-amount ${myBal > 0 ? 'owed' : myBal < 0 ? 'owe' : ''}`} aria-live="polite">
          <AnimatedAmount value={myBal} />
        </p>
        <p className="hero-sub">
          {myBal > 0
            ? 'Squad Mode collects it at the end. You never have to ask.'
            : myBal < 0
              ? 'Settle in one payment when the trip ends.'
              : 'Nothing to settle right now.'}
        </p>
      </section>

      {!ended ? (
        <motion.button
          type="button"
          className="swipe-card"
          onClick={onSwipe}
          initial={reduce ? false : { opacity: 0, transform: 'translateY(12px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          aria-describedby="swipe-help"
        >
          <Coins />
          <span className="sc-top"><span className="chip-live">Squad Mode on</span></span>
          <span className="sc-title">Simulate a card swipe</span>
          <span className="sc-row">
            <span className="sc-num" id="swipe-help">
              {cardholders.length} cards linked
            </span>
            <span className="sc-go"><CreditCard size={17} aria-hidden="true" /> Swipe</span>
          </span>
        </motion.button>
      ) : (
        <button type="button" className="btn btn-ink btn-block" onClick={onGoSettle}>
          Trip ended. See who pays whom
        </button>
      )}

      {!ended ? (
        <div className="quick-row">
          <button type="button" className="btn btn-plain btn-block" onClick={onAddCash}>
            <Plus size={18} aria-hidden="true" /> Add a cash or UPI payment
          </button>
        </div>
      ) : null}

      <section aria-labelledby="people-h">
        <div className="section-head">
          <h2 id="people-h">Balances</h2>
          <button type="button" className="link-btn" onClick={onGoSettle}>
            {ended ? 'Settle up' : 'End trip'}
          </button>
        </div>
        <ul className="list" style={{ listStyle: 'none', margin: 0 }}>
          {others.map((m) => {
            const b = balances[m.id] || 0;
            return (
              <li className="row" key={m.id}>
                <Avatar member={m} />
                <div className="row-main">
                  <p className="row-title">{m.name}</p>
                  <p className="row-sub">{m.hasCard ? `Card •••• ${m.last4} · auto` : 'No card · logs by hand'}</p>
                </div>
                <p className={`row-amt ${b > 0 ? 'amt-owed' : b < 0 ? 'amt-owe' : 'amt-zero'}`}>
                  <AnimatedAmount value={b} signed />
                  <small>{b > 0 ? 'gets back' : b < 0 ? 'owes' : 'square'}</small>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {firstNoCard ? (
        <section className="invite" aria-labelledby="invite-h">
          <Avatar member={firstNoCard} />
          <div>
            <h2 id="invite-h" style={{ fontSize: 18, marginBottom: 4 }}>
              {firstNoCard.name}&rsquo;s payments aren&rsquo;t auto-logged
            </h2>
            <p>
              Without the card, every spend has to be typed in, and some never are. With a Scapia
              card, {firstNoCard.name}&rsquo;s swipes get the same one-tap question, and earn coins too.
            </p>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-soft btn-sm" onClick={() => onInvite(firstNoCard)}>
              <Send size={16} aria-hidden="true" /> Invite {firstNoCard.name}
            </button>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="recent-h">
        <div className="section-head">
          <h2 id="recent-h">Recent payments</h2>
          <button type="button" className="link-btn" onClick={onGoActivity}>See all {state.payments.length}</button>
        </div>
        {recent.length ? (
          <ul className="list" style={{ listStyle: 'none', margin: 0 }}>
            <AnimatePresence initial={false}>
              {recent.map((p) => (
                <PaymentRow key={p.id} p={p} members={state.members} youId={you.id} fresh={p.id === freshId} />
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="list empty">No payments yet. Swipe the card above to log the first one.</div>
        )}
      </section>

      {imported.length ? (
        <section aria-labelledby="imp-h">
          <div className="section-head">
            <h2 id="imp-h">Booked before the trip</h2>
          </div>
          <div className="plain-card">
            <p style={{ marginBottom: 6 }}>
              Imported from your card. You paid {inr(importedTotal)} up front and it&rsquo;s already split.
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {imported.map((p) => (
                <li key={p.id} className="row" style={{ minHeight: 48 }}>
                  <div className="row-main">
                    <p className="row-title" style={{ fontSize: 15 }}>{p.title}</p>
                    <p className="row-sub">{fmtWhen(p.ts)}</p>
                  </div>
                  <p className="row-amt">{inr(p.amount)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <p className="foot">
        Concept prototype for a product assignment. Not affiliated with or endorsed by Scapia.
      </p>
    </div>
  );
}
