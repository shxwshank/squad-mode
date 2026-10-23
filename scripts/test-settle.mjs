// Checks the money maths: shares add up, balances sum to zero, and the
// simplified transfers settle everyone with the fewest payments.
import assert from 'node:assert/strict';
import { computeBalances, simplifyDebts } from '../src/lib/settle.js';
import { splitEven } from '../src/lib/money.js';
import { seedState } from '../src/lib/seed.js';

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`ok  ${name}`); };

function applyTransfers(bal, transfers) {
  const b = { ...bal };
  for (const t of transfers) { b[t.from] += t.amount; b[t.to] -= t.amount; }
  return b;
}

// brute-force minimum transfer count for small cases, to compare against
function bruteMin(values) {
  const v = values.filter((x) => x !== 0);
  if (!v.length) return 0;
  let best = Infinity;
  const rec = (arr, count) => {
    const i = arr.findIndex((x) => x !== 0);
    if (i < 0) { best = Math.min(best, count); return; }
    if (count >= best) return;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] !== 0 && Math.sign(arr[j]) !== Math.sign(arr[i])) {
        const next = arr.slice(); next[j] += next[i]; next[i] = 0;
        rec(next, count + 1);
      }
    }
  };
  rec(v, 0);
  return best;
}

check('splitEven sums exactly', () => {
  for (const amt of [1, 7, 100, 2400, 1850, 3151, 99999]) {
    for (let n = 1; n <= 6; n++) {
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const s = splitEven(amt, ids);
      assert.equal(Object.values(s).reduce((a, b) => a + b, 0), amt);
    }
  }
});

const seed = seedState();
const seedBal = computeBalances(seed.members, seed.payments);
console.log('    seed balances:', seedBal);

check('seed payments: shares add up to each amount', () => {
  for (const p of seed.payments) {
    assert.equal(Object.values(p.shares).reduce((a, b) => a + b, 0), p.amount, p.title);
  }
});

check('seed balances sum to zero', () => {
  assert.equal(Object.values(seedBal).reduce((a, b) => a + b, 0), 0);
});

check('seed transfers settle everyone', () => {
  const t = simplifyDebts(seedBal);
  console.log('    transfers:', t.map((x) => `${x.from} -> ${x.to} ₹${x.amount}`).join(', '));
  const after = applyTransfers(seedBal, t);
  for (const v of Object.values(after)) assert.equal(v, 0);
  assert.ok(t.length <= seed.members.length - 1);
  assert.equal(t.length, bruteMin(Object.values(seedBal)));
});

check('zero-sum subgroups are found (A owes B 100, C owes D 50)', () => {
  const t = simplifyDebts({ A: -100, B: 100, C: -50, D: 50 });
  assert.equal(t.length, 2);
});

check('greedy trap: [-5,-5,-3,4,4,5] needs 4 not 5', () => {
  const bal = { a: -5, b: -5, c: -3, d: 4, e: 4, f: 5 };
  const t = simplifyDebts(bal);
  for (const v of Object.values(applyTransfers(bal, t))) assert.equal(v, 0);
  assert.equal(t.length, bruteMin(Object.values(bal)));
});

check('500 random trips: zero-sum, settled, minimal', () => {
  let seedN = 42;
  const rnd = () => ((seedN = (seedN * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let k = 0; k < 500; k++) {
    const n = 2 + Math.floor(rnd() * 5);
    const members = Array.from({ length: n }, (_, i) => ({ id: `m${i}` }));
    const payments = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => {
      const amount = 50 + Math.floor(rnd() * 5000);
      const inIt = members.filter(() => rnd() > 0.3).map((m) => m.id);
      const ids = inIt.length ? inIt : [members[0].id];
      return { amount, payerId: members[Math.floor(rnd() * n)].id, shares: splitEven(amount, ids) };
    });
    const bal = computeBalances(members, payments);
    assert.equal(Object.values(bal).reduce((a, b) => a + b, 0), 0);
    const t = simplifyDebts(bal);
    for (const v of Object.values(applyTransfers(bal, t))) assert.equal(v, 0);
    for (const x of t) assert.ok(x.amount > 0);
    assert.equal(t.length, bruteMin(Object.values(bal)));
  }
});

console.log(`\n${passed} checks passed`);
