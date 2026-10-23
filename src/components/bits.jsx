import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { inr } from '../lib/money.js';

/** Our own mark: three overlapping coins, one per friend, gold on ink. */
export function BrandMark({ className = 'brand-mark' }) {
  return (
    <svg className={className} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="11" fill="#17191f" />
      <circle cx="12" cy="19" r="6.5" fill="#c98a12" />
      <circle cx="17" cy="14" r="6.5" fill="#f0b43c" stroke="#17191f" strokeWidth="1.6" />
      <circle cx="22" cy="19" r="6.5" fill="#f6cf7a" stroke="#17191f" strokeWidth="1.6" />
    </svg>
  );
}

/** Coin stack drawn for the card object. */
export function Coins({ className = 'coins' }) {
  return (
    <svg className={className} viewBox="0 0 150 150" aria-hidden="true">
      <circle cx="80" cy="70" r="46" fill="#23262e" />
      <circle cx="60" cy="88" r="30" fill="#c98a12" />
      <circle cx="60" cy="84" r="30" fill="#f0b43c" />
      <circle cx="60" cy="84" r="21" fill="none" stroke="#c98a12" strokeWidth="3" />
      <text x="60" y="93" textAnchor="middle" fontSize="24" fontWeight="800" fill="#7a5207" fontFamily="system-ui">₹</text>
      <circle cx="104" cy="104" r="17" fill="#c98a12" />
      <circle cx="104" cy="101" r="17" fill="#f6cf7a" />
    </svg>
  );
}

export function Avatar({ member, showCard = true, size }) {
  const style = {
    background: `color-mix(in srgb, ${member.hue} 16%, white)`,
    color: `color-mix(in srgb, ${member.hue} 80%, black)`,
    ...(size ? { width: size, height: size } : null),
  };
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {member.name.trim().charAt(0).toUpperCase() || '?'}
      {showCard && member.hasCard ? <span className="card-dot" /> : null}
    </span>
  );
}

/** Rolls a rupee figure to its new value. Instant when motion is reduced. */
export function AnimatedAmount({ value, signed = false, duration = 0.7 }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce || from.current === value) {
      from.current = value;
      setShown(value);
      return undefined;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setShown(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce, duration]);
  return <span>{inr(shown, { signed })}</span>;
}

export function KindTag({ kind }) {
  const label = { group: 'Group', personal: 'Personal', custom: 'Custom' }[kind] || kind;
  return <span className={`tag tag-${kind}`}>{label}</span>;
}

export function Switch({ checked, onChange, label, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
