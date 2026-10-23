import { useEffect, useState } from 'react';
import { Sheet } from './Sheet.jsx';
import { Avatar } from './bits.jsx';
import { inr, splitEven } from '../lib/money.js';

export function AddCashSheet({ open, members, onClose, onAdd }) {
  const you = members.find((m) => m.isYou) || members[0];
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [payerId, setPayerId] = useState(you?.id);
  const [method, setMethod] = useState('upi');
  const [picked, setPicked] = useState(members.map((m) => m.id));
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!open) return;
    const firstNoCard = members.find((m) => !m.hasCard);
    setAmount('');
    setTitle('');
    setPayerId(firstNoCard?.id || you?.id);
    setMethod('upi');
    setPicked(members.map((m) => m.id));
    setTried(false);
  }, [open, members, you?.id]);

  const amt = parseInt(amount, 10) || 0;
  const valid = amt > 0 && title.trim() && picked.length > 0;

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    const kind = picked.length === members.length ? 'group' : picked.length === 1 && picked[0] === payerId ? 'personal' : 'custom';
    onAdd({ title: title.trim(), amount: amt, payerId, source: method, kind, shares: splitEven(amt, picked) });
  };

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Sheet open={open} onClose={onClose} labelledBy="cash-h">
      <form onSubmit={submit} noValidate>
        <h2 id="cash-h" style={{ paddingRight: 48 }}>Add a cash or UPI payment</h2>
        <p className="custom-note" style={{ marginTop: 6 }}>For spends that didn&rsquo;t go on a card.</p>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="cash-amt">Amount</label>
          <div className="money-input" style={{ width: '100%' }}>
            <span aria-hidden="true" style={{ fontSize: 24, left: 14 }}>₹</span>
            <input
              id="cash-amt"
              className="input input-lg"
              inputMode="numeric"
              placeholder="0"
              style={{ paddingLeft: 36 }}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
              data-autofocus
              aria-invalid={tried && amt <= 0}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="cash-title">What for</label>
          <input
            id="cash-title"
            className="input"
            placeholder="Coconuts at Kudle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
            aria-invalid={tried && !title.trim()}
          />
        </div>
        <div className="field">
          <span className="label" id="payer-l">Who paid</span>
          <div className="pills" role="group" aria-labelledby="payer-l">
            {members.map((m) => (
              <button type="button" key={m.id} className="pill" aria-pressed={payerId === m.id} onClick={() => setPayerId(m.id)} style={{ paddingLeft: 14 }}>
                {m.isYou ? 'You' : m.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label" id="method-l">Paid with</span>
          <div className="seg" role="group" aria-labelledby="method-l">
            <button type="button" aria-pressed={method === 'upi'} onClick={() => setMethod('upi')}>UPI</button>
            <button type="button" aria-pressed={method === 'cash'} onClick={() => setMethod('cash')}>Cash</button>
          </div>
        </div>
        <div className="field">
          <span className="label" id="split-l">Split between</span>
          <div className="who" role="group" aria-labelledby="split-l" style={{ marginTop: 0 }}>
            {members.map((m) => (
              <button type="button" key={m.id} className="who-chip" aria-pressed={picked.includes(m.id)} onClick={() => toggle(m.id)}>
                <Avatar member={m} showCard={false} />
                {m.isYou ? 'You' : m.name}
              </button>
            ))}
          </div>
          <p className="custom-note" style={{ marginTop: 4 }} aria-live="polite">
            {picked.length && amt ? `${inr(Math.ceil(amt / picked.length))} each for ${picked.length}` : picked.length ? '' : 'Pick at least one person'}
          </p>
        </div>
        {tried && !valid ? <p role="alert" className="custom-note bad">Add an amount and what it was for.</p> : null}
        <button type="submit" className="btn btn-ink btn-block" style={{ marginTop: 14 }}>
          Add payment
        </button>
      </form>
    </Sheet>
  );
}
