const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹12,000 style. Sign handled by caller unless signed=true. */
export function inr(value, { signed = false } = {}) {
  const n = Math.round(Math.abs(value));
  const s = `₹${fmt.format(n)}`;
  if (!signed || value === 0) return s;
  return value > 0 ? `+${s}` : `−${s}`;
}

/** Split an integer amount into n integer parts that sum exactly to the amount. */
export function splitEven(amount, ids) {
  const n = ids.length;
  if (!n) return {};
  const base = Math.floor(amount / n);
  let rem = amount - base * n;
  const out = {};
  for (const id of ids) {
    out[id] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
  }
  return out;
}
