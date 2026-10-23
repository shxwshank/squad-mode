import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Sheet } from './Sheet.jsx';
import { Avatar } from './bits.jsx';
import { inr, splitEven } from '../lib/money.js';

/**
 * The core moment. A card payment lands and the app asks one question:
 * was this for the group or just for the person who paid?
 */
export function SwipeSheet({ swipe: incoming, members, onLog, onClose }) {
  const reduce = useReducedMotion();
  const open = !!incoming;
  // keep the last payment on screen while the sheet slides away
  const last = useRef(null);
  if (incoming) last.current = incoming;
  const swipe = incoming || last.current;
  const payer = swipe ? members.find((m) => m.id === swipe.payerId) : null;
  const [customOpen, setCustomOpen] = useState(false);
  const [mode, setMode] = useState('people');
  const [picked, setPicked] = useState([]);
  const [amounts, setAmounts] = useState({});

  useEffect(() => {
    if (!incoming) return;
    setCustomOpen(false);
    setMode('people');
    setPicked(members.map((m) => m.id));
    setAmounts({});
  }, [incoming, members]);

  const n = members.length;
  const each = swipe ? Math.ceil(swipe.amount / n) : 0;
  const amountTotal = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + (Number(v) || 0), 0),
    [amounts],
  );

  if (!swipe) return null;

  const justLabel = payer?.isYou ? 'Just me' : `Just ${payer?.name}`;
  const remaining = swipe ? swipe.amount - amountTotal : 0;

  const logGroup = () => onLog({ kind: 'group', shares: splitEven(swipe.amount, members.map((m) => m.id)) });
  const logMine = () => onLog({ kind: 'personal', shares: { [swipe.payerId]: swipe.amount } });
  const logCustom = () => {
    if (mode === 'people') {
      onLog({ kind: picked.length === n ? 'group' : 'custom', shares: splitEven(swipe.amount, picked) });
    } else {
      const shares = {};
      for (const [id, v] of Object.entries(amounts)) {
        const x = Math.round(Number(v) || 0);
        if (x > 0) shares[id] = x;
      }
      onLog({ kind: 'custom', shares });
    }
  };
  const customValid = mode === 'people' ? picked.length > 0 : remaining === 0 && amountTotal > 0;
  const perHead = picked.length ? Math.ceil(swipe.amount / picked.length) : 0;

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Sheet open={open} onClose={onClose} labelledBy="swipe-q" closeLabel="Decide later">
      {swipe ? (
        <div>
          <div className="notif-src">
            <span className="mini-card" aria-hidden="true" />
            <span>
              {payer?.isYou ? 'Your card' : `${payer?.name}'s card`} •••• {payer?.last4} · just now
            </span>
          </div>
          <motion.p
            className="notif-amount"
            initial={reduce ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: 0.35, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
          >
            {inr(swipe.amount)}
          </motion.p>
          <p className="notif-merchant">at {swipe.title}</p>
          <h2 id="swipe-q" className="notif-q">Group or {payer?.isYou ? 'just me' : `just ${payer?.name}`}?</h2>
          {!payer?.isYou ? (
            <p className="custom-note">In the real app this question goes to {payer?.name}'s phone. It shows here for the demo.</p>
          ) : null}

          <div className="choice-grid">
            <button type="button" className="choice choice-group" onClick={logGroup} data-autofocus>
              <strong>Group</strong>
              <span>Split {n} ways, {inr(each)} each</span>
            </button>
            <button type="button" className="choice choice-me" onClick={logMine}>
              <strong>{justLabel}</strong>
              <span>Nobody owes anything</span>
            </button>
            <button
              type="button"
              className="choice choice-custom"
              aria-expanded={customOpen}
              aria-controls="custom-split"
              onClick={() => setCustomOpen((v) => !v)}
            >
              <strong>Custom split</strong>
              <span>Some people, or set amounts</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {customOpen ? (
              <motion.div
                id="custom-split"
                key="custom"
                initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="custom">
                  <div className="seg" role="group" aria-label="How to split">
                    <button type="button" aria-pressed={mode === 'people'} onClick={() => setMode('people')}>
                      Who was in
                    </button>
                    <button type="button" aria-pressed={mode === 'amounts'} onClick={() => setMode('amounts')}>
                      Set amounts
                    </button>
                  </div>

                  {mode === 'people' ? (
                    <>
                      <div className="who" role="group" aria-label="People in this payment">
                        {members.map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            className="who-chip"
                            aria-pressed={picked.includes(m.id)}
                            onClick={() => toggle(m.id)}
                          >
                            <Avatar member={m} showCard={false} />
                            {m.isYou ? 'You' : m.name}
                          </button>
                        ))}
                      </div>
                      <p className={`custom-note ${picked.length ? '' : 'bad'}`}>
                        {picked.length
                          ? `${picked.length} ${picked.length === 1 ? 'person' : 'people'}, about ${inr(perHead)} each`
                          : 'Pick at least one person'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="amount-rows">
                        {members.map((m) => (
                          <div className="amount-row" key={m.id}>
                            <label htmlFor={`amt-${m.id}`}>
                              <Avatar member={m} showCard={false} />
                              {m.isYou ? 'You' : m.name}
                            </label>
                            <div className="money-input">
                              <span aria-hidden="true">₹</span>
                              <input
                                id={`amt-${m.id}`}
                                className="input"
                                inputMode="numeric"
                                placeholder="0"
                                value={amounts[m.id] ?? ''}
                                onChange={(e) =>
                                  setAmounts((a) => ({ ...a, [m.id]: e.target.value.replace(/[^\d]/g, '') }))
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className={`custom-note ${remaining !== 0 && amountTotal > 0 ? 'bad' : ''}`} aria-live="polite">
                        {remaining === 0 && amountTotal > 0
                          ? 'Adds up. Ready to log.'
                          : remaining > 0
                            ? `${inr(remaining)} left to assign`
                            : `${inr(-remaining)} over the bill`}
                      </p>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn btn-ink btn-block"
                    style={{ marginTop: 12 }}
                    disabled={!customValid}
                    onClick={logCustom}
                  >
                    Log this split
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </Sheet>
  );
}
