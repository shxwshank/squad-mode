import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Avatar, Switch } from '../components/bits.jsx';
import { hueFor, makeId } from '../lib/seed.js';

export function Setup({ onCreate, onCancel, canCancel }) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('2026-12-19');
  const [end, setEnd] = useState('2026-12-21');
  const [you, setYou] = useState({ id: makeId('m'), name: 'Shashank', hasCard: true, isYou: true });
  const [friends, setFriends] = useState([
    { id: makeId('m'), name: '', hasCard: false },
    { id: makeId('m'), name: '', hasCard: false },
  ]);
  const [error, setError] = useState('');

  const update = (id, patch) => setFriends((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const named = friends.filter((f) => f.name.trim());

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give the trip a name.');
    if (!you.name.trim()) return setError('Add your own name.');
    if (named.length < 1) return setError('Add at least one friend.');
    if (end < start) return setError('The trip ends before it starts. Check the dates.');
    setError('');
    onCreate({
      name: name.trim(),
      start,
      end,
      members: [{ ...you, name: you.name.trim() }, ...named.map((f) => ({ ...f, name: f.name.trim() }))],
    });
  };

  return (
    <form className="screen" id="main" onSubmit={submit} noValidate>
      <div className="setup-hero">
        <h1>New trip</h1>
        <p>Add the people going and who has the card. Card swipes get logged as they happen.</p>
      </div>

      <div>
        <div className="field">
          <label htmlFor="trip-name">Trip name</label>
          <input
            id="trip-name"
            className="input"
            placeholder="Coorg long weekend"
            value={name}
            onChange={(e) => setName(e.target.value)}
            enterKeyHint="next"
            autoComplete="off"
          />
        </div>
        <div className="field two">
          <div className="field">
            <label htmlFor="start">Starts</label>
            <input id="start" type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field" style={{ marginTop: 0 }}>
            <label htmlFor="end">Ends</label>
            <input id="end" type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: '20px 0 0' }}>
        <legend className="label" style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 8 }}>Who&rsquo;s going</legend>
        <div className="friend-row">
          <Avatar member={{ ...you, hue: hueFor(0) }} showCard={false} />
          <input
            className="input"
            aria-label="Your name"
            value={you.name}
            onChange={(e) => setYou((y) => ({ ...y, name: e.target.value }))}
          />
          <Switch id={`card-${you.id}`} checked={you.hasCard} onChange={(v) => setYou((y) => ({ ...y, hasCard: v }))} label="Card" />
        </div>
        {friends.map((f, i) => (
          <div className="friend-row" key={f.id}>
            <Avatar member={{ ...f, name: f.name || String(i + 2), hue: hueFor(i + 1) }} showCard={false} />
            <input
              className="input"
              aria-label={`Friend ${i + 1} name`}
              placeholder="Friend’s name"
              value={f.name}
              onChange={(e) => update(f.id, { name: e.target.value })}
              autoComplete="off"
            />
            <Switch id={`card-${f.id}`} checked={f.hasCard} onChange={(v) => update(f.id, { hasCard: v })} label="Card" />
            <button
              type="button"
              className="icon-btn"
              style={{ background: 'transparent' }}
              aria-label={`Remove friend ${i + 1}`}
              onClick={() => setFriends((list) => list.filter((x) => x.id !== f.id))}
            >
              <X size={18} />
            </button>
          </div>
        ))}
        {friends.length < 7 ? (
          <button
            type="button"
            className="btn btn-soft btn-sm"
            style={{ marginTop: 10 }}
            onClick={() => setFriends((f) => [...f, { id: makeId('m'), name: '', hasCard: false }])}
          >
            <Plus size={16} aria-hidden="true" /> Add a friend
          </button>
        ) : null}
      </fieldset>

      {error ? <p role="alert" className="custom-note bad">{error}</p> : null}

      <div style={{ display: 'grid', gap: 8 }}>
        <button type="submit" className="btn btn-ink btn-block">Start the trip</button>
        {canCancel ? (
          <button type="button" className="btn btn-ghost btn-block" onClick={onCancel}>Back to {canCancel}</button>
        ) : null}
      </div>
    </form>
  );
}
