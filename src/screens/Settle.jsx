import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, BellRing, Loader2 } from 'lucide-react';
import { Avatar, Switch } from '../components/bits.jsx';
import { simplifyDebts } from '../lib/settle.js';
import { inr } from '../lib/money.js';
import { fmtDateRange } from '../lib/dates.js';

const keyOf = (t) => `${t.from}>${t.to}>${t.amount}`;

export function Settle({ state, balances, you, onEnd, onReopen, onMarkPaid, onToggleNudges }) {
  const reduce = useReducedMotion();
  const ended = state.trip.status === 'ended';
  const transfers = useMemo(() => simplifyDebts(balances), [balances]);
  const byId = Object.fromEntries(state.members.map((m) => [m.id, m]));
  const [paying, setPaying] = useState(null);

  const paidCount = transfers.filter((t) => state.settle.paid[keyOf(t)]).length;
  const totalAmt = transfers.reduce((s, t) => s + t.amount, 0);
  const paidAmt = transfers.filter((t) => state.settle.paid[keyOf(t)]).reduce((s, t) => s + t.amount, 0);
  const pct = totalAmt ? paidAmt / totalAmt : 1;
  const nonZero = Object.values(balances).filter((v) => v !== 0).length;
  const naive = state.payments.reduce(
    (s, p) => s + Object.keys(p.shares).filter((id) => id !== p.payerId).length,
    0,
  );

  const pay = (t) => {
    setPaying(keyOf(t));
    setTimeout(() => {
      onMarkPaid(keyOf(t), t);
      setPaying(null);
    }, 900);
  };

  if (!ended) {
    return (
      <div className="screen" id="main">
        <div>
          <h1 className="trip-title">End the trip?</h1>
          <p className="trip-meta">{state.trip.name} · {fmtDateRange(state.trip.start, state.trip.end)}</p>
        </div>
        <div className="plain-card">
          <p>
            Squad Mode nets every payment down to the fewest transfers. Each person gets one amount
            and one UPI link, and the app sends the reminders instead of you.
          </p>
        </div>
        <section aria-labelledby="preview-h">
          <div className="section-head"><h2 id="preview-h">If you end it now</h2></div>
          <ul className="list" style={{ listStyle: 'none', margin: 0 }}>
            {state.members.map((m) => {
              const b = balances[m.id] || 0;
              return (
                <li className="row" key={m.id}>
                  <Avatar member={m} />
                  <div className="row-main"><p className="row-title">{m.isYou ? 'You' : m.name}</p></div>
                  <p className={`row-amt ${b > 0 ? 'amt-owed' : b < 0 ? 'amt-owe' : 'amt-zero'}`}>
                    {b > 0 ? `gets ${inr(b)}` : b < 0 ? `pays ${inr(b)}` : 'square'}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="trip-meta" style={{ fontSize: 14, marginTop: 10 }}>
            {transfers.length} {transfers.length === 1 ? 'transfer' : 'transfers'} settle all {state.payments.length} payments.
            Paying back every share one by one would take {naive}.
          </p>
        </section>
        <button type="button" className="btn btn-ink btn-block" onClick={onEnd} disabled={!state.payments.length}>
          End trip and settle up
        </button>
      </div>
    );
  }

  const nudges = [
    { when: 'Today', what: 'Each person gets their one amount and a UPI link', done: true },
    { when: 'Tomorrow', what: 'A friendly reminder to anyone who hasn’t paid' },
    { when: 'Day 3', what: 'A second nudge with a one-tap UPI link' },
    { when: 'Day 7', what: 'A last reminder. After that, you decide' },
  ];

  return (
    <div className="screen" id="main">
      <section className="settle-hero" aria-labelledby="settle-h">
        <h1 id="settle-h">
          {transfers.length === 0
            ? 'Everyone is square'
            : paidCount === transfers.length
              ? 'All settled'
              : `${transfers.length} ${transfers.length === 1 ? 'payment settles' : 'payments settle'} the trip`}
        </h1>
        <p>
          {transfers.length
            ? `Down from ${naive} separate paybacks. Nobody pays more than once.`
            : 'No money needs to move.'}
        </p>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct * 100)}
          aria-label="Settled"
        >
          <motion.div
            initial={false}
            animate={{ transform: `scaleX(${pct})` }}
            transition={{ duration: reduce ? 0 : 0.6, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        <div className="progress-meta">
          <span>{paidCount} of {transfers.length} paid</span>
          <span>{inr(paidAmt)} of {inr(totalAmt)}</span>
        </div>
      </section>

      {transfers.length ? (
        <section aria-labelledby="transfers-h">
          <div className="section-head"><h2 id="transfers-h">Who pays whom</h2></div>
          <ul className="list" style={{ listStyle: 'none', margin: 0 }}>
            {transfers.map((t) => {
              const from = byId[t.from];
              const to = byId[t.to];
              const k = keyOf(t);
              const done = !!state.settle.paid[k];
              const youPay = from.isYou;
              return (
                <li className="transfer" key={k}>
                  <div className="transfer-top">
                    <Avatar member={from} showCard={false} />
                    <ArrowRight size={16} className="arrow" aria-hidden="true" />
                    <Avatar member={to} showCard={false} />
                    <p className="transfer-who">
                      <strong>{from.isYou ? 'You' : from.name}</strong> {from.isYou ? 'pay' : 'pays'}{' '}
                      <strong>{to.isYou ? 'you' : to.name}</strong>
                    </p>
                    <span className="transfer-amt">{inr(t.amount)}</span>
                  </div>
                  {done ? (
                    <motion.span
                      className="paid-state"
                      initial={reduce ? false : { opacity: 0, transform: 'scale(0.96)' }}
                      animate={{ opacity: 1, transform: 'scale(1)' }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <Check size={18} aria-hidden="true" /> Paid via UPI
                    </motion.span>
                  ) : (
                    <button
                      type="button"
                      className={youPay ? 'btn btn-coin btn-sm' : 'btn btn-soft btn-sm'}
                      onClick={() => pay(t)}
                      disabled={paying === k}
                      style={{ justifySelf: 'start' }}
                    >
                      {paying === k ? (
                        <><Loader2 size={16} className="spin" aria-hidden="true" /> Opening UPI…</>
                      ) : youPay ? (
                        `Pay ${inr(t.amount)} via UPI`
                      ) : (
                        `Simulate ${from.name} paying by UPI`
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="trip-meta" style={{ fontSize: 13.5, marginTop: 8 }}>
            UPI is mocked in this prototype. No money moves.
          </p>
        </section>
      ) : null}

      <section className="plain-card" aria-labelledby="nudge-h">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h2 id="nudge-h" style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellRing size={20} aria-hidden="true" /> Reminders
          </h2>
          <Switch id="nudges" checked={state.settle.nudges} onChange={onToggleNudges} label={state.settle.nudges ? 'Auto-nudge on' : 'Auto-nudge off'} />
        </div>
        <p style={{ marginTop: 6 }}>
          {state.settle.nudges
            ? 'Squad Mode follows up on unpaid amounts for you. The messages come from the app, so nobody has to chase a friend.'
            : 'Off. Nobody gets reminded unless you turn this back on.'}
        </p>
        {state.settle.nudges ? (
          <ul className="nudge-list">
            {nudges.map((n) => (
              <li key={n.when}>
                <span className="when">{n.when}</span>
                <span className={n.done ? 'done' : ''}>{n.what}{n.done ? <span className="sent">Sent</span> : null}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 8 }}>
          {nonZero > 0 ? 'Reminders stop for each person the moment they pay.' : ''}
        </p>
      </section>

      <button type="button" className="btn btn-ghost btn-block" onClick={onReopen}>
        Reopen the trip
      </button>
    </div>
  );
}
