/**
 * Balances and debt simplification.
 * A payment: { amount, payerId, shares: { memberId: rupees } } where shares sum to amount.
 * Balance = what you paid for others minus what others paid for you. Positive = owed to you.
 */
export function computeBalances(members, payments) {
  const bal = Object.fromEntries(members.map((m) => [m.id, 0]));
  for (const p of payments) {
    if (bal[p.payerId] === undefined) continue;
    bal[p.payerId] += p.amount;
    for (const [id, share] of Object.entries(p.shares)) {
      if (bal[id] !== undefined) bal[id] -= share;
    }
  }
  return bal;
}

/**
 * Minimum number of transfers that settle every balance.
 * The minimum equals (people with a non-zero balance) minus (the largest number of
 * disjoint groups whose balances sum to zero). Found exactly with a subset DP,
 * which is instant for the 2–8 people a trip has. Inside each group a greedy
 * largest-debtor-pays-largest-creditor pass uses exactly (group size − 1) transfers.
 */
export function simplifyDebts(balances) {
  const people = Object.entries(balances)
    .filter(([, v]) => Math.round(v) !== 0)
    .map(([id, v]) => ({ id, v: Math.round(v) }));
  const n = people.length;
  if (n === 0) return [];
  const total = people.reduce((s, p) => s + p.v, 0);
  if (total !== 0) throw new Error(`Balances do not sum to zero (${total})`);

  const full = (1 << n) - 1;
  const sum = new Array(1 << n).fill(0);
  for (let mask = 1; mask <= full; mask++) {
    const low = mask & -mask;
    const i = 31 - Math.clz32(low);
    sum[mask] = sum[mask ^ low] + people[i].v;
  }
  // dp[mask] = max zero-sum groups that partition mask (only meaningful when sum[mask] === 0)
  const dp = new Array(1 << n).fill(-1);
  const choice = new Array(1 << n).fill(0);
  dp[0] = 0;
  for (let mask = 1; mask <= full; mask++) {
    if (sum[mask] !== 0) continue;
    const low = mask & -mask; // fix the lowest member to avoid counting permutations
    for (let sub = mask; sub; sub = (sub - 1) & mask) {
      if (!(sub & low) || sum[sub] !== 0) continue;
      const rest = mask ^ sub;
      if (dp[rest] < 0) continue;
      if (dp[rest] + 1 > dp[mask]) {
        dp[mask] = dp[rest] + 1;
        choice[mask] = sub;
      }
    }
  }

  const transfers = [];
  let mask = full;
  while (mask) {
    const group = choice[mask];
    const members = people.filter((_, i) => group & (1 << i)).map((p) => ({ ...p }));
    const debtors = members.filter((p) => p.v < 0);
    const creditors = members.filter((p) => p.v > 0);
    while (debtors.length && creditors.length) {
      debtors.sort((a, b) => a.v - b.v);
      creditors.sort((a, b) => b.v - a.v);
      const d = debtors[0];
      const c = creditors[0];
      const amt = Math.min(-d.v, c.v);
      transfers.push({ from: d.id, to: c.id, amount: amt });
      d.v += amt;
      c.v -= amt;
      if (d.v === 0) debtors.shift();
      if (c.v === 0) creditors.shift();
    }
    mask ^= group;
  }
  return transfers;
}
