import { splitEven } from './money.js';

export const STORAGE_KEY = 'squad-mode:v1';

const HUES = ['#2F6FDB', '#C2410C', '#0F8A5F', '#B4237A', '#7A5A00', '#0E7490', '#9333EA', '#4D7C0F'];
export const hueFor = (i) => HUES[i % HUES.length];

export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Merchants a card swipe can produce on a Gokarna weekend. */
export const MERCHANTS = [
  { title: 'Namaste Café', amount: 2400, what: 'Breakfast, Om Beach' },
  { title: 'Gokarna beach shack', amount: 1850, what: 'Lunch and juices' },
  { title: 'Auto-rickshaw', amount: 300, what: 'Town to Kudle Beach' },
  { title: 'Om Beach entry', amount: 250, what: 'Parking and entry' },
  { title: 'Zostel bar', amount: 1200, what: 'Drinks' },
  { title: 'Kudle Beach water sports', amount: 3500, what: 'Banana boat and kayaks' },
  { title: 'Half Moon boat ride', amount: 1600, what: 'Boat to Half Moon Beach' },
  { title: 'Mahabaleshwar temple stall', amount: 420, what: 'Flowers and prasad' },
  { title: 'Prema Restaurant', amount: 2750, what: 'Dinner, thalis and fish fry' },
  { title: 'HP fuel, Kumta', amount: 2200, what: 'Fuel for the rental' },
];

const EQUAL = (amount, ids) => splitEven(amount, ids);

export function seedState() {
  const members = [
    { id: 'm_shashank', name: 'Shashank', isYou: true, hasCard: true, last4: '4417' },
    { id: 'm_aditi', name: 'Aditi', hasCard: true, last4: '2093' },
    { id: 'm_rohan', name: 'Rohan', hasCard: true, last4: '7761' },
    { id: 'm_meera', name: 'Meera', hasCard: false },
    { id: 'm_kabir', name: 'Kabir', hasCard: false },
  ].map((m, i) => ({ isYou: false, ...m, hue: hueFor(i) }));
  const all = members.map((m) => m.id);
  const drinkers = ['m_shashank', 'm_aditi', 'm_rohan', 'm_kabir'];

  const payments = [
    {
      id: 'p_stay', ts: '2026-11-02T21:14:00+05:30', title: 'Zostel Gokarna, 2 nights',
      what: 'Two private rooms', amount: 12000, payerId: 'm_shashank', kind: 'group',
      source: 'imported', shares: EQUAL(12000, all),
    },
    {
      id: 'p_bus', ts: '2026-11-03T10:02:00+05:30', title: 'Sleeper bus, Bengaluru to Gokarna',
      what: 'Return, 5 seats', amount: 4800, payerId: 'm_shashank', kind: 'group',
      source: 'imported', shares: EQUAL(4800, all),
    },
    {
      id: 'p_auto1', ts: '2026-11-14T06:40:00+05:30', title: 'Auto from the bus stand',
      what: 'Two autos', amount: 600, payerId: 'm_meera', kind: 'group',
      source: 'cash', shares: EQUAL(600, all),
    },
    {
      id: 'p_boat', ts: '2026-11-14T11:25:00+05:30', title: 'Paradise Beach boat',
      what: 'Return boat', amount: 2500, payerId: 'm_rohan', kind: 'group',
      source: 'card', shares: EQUAL(2500, all),
    },
    {
      id: 'p_beer', ts: '2026-11-14T18:10:00+05:30', title: 'Sunset beers, Kudle',
      what: 'Meera skipped', amount: 1400, payerId: 'm_kabir', kind: 'custom',
      source: 'upi', shares: EQUAL(1400, drinkers),
    },
    {
      id: 'p_shades', ts: '2026-11-14T19:05:00+05:30', title: 'Sunglasses, Car Street',
      what: 'For me', amount: 450, payerId: 'm_shashank', kind: 'personal',
      source: 'card', shares: { m_shashank: 450 },
    },
    {
      id: 'p_dinner', ts: '2026-11-14T21:30:00+05:30', title: 'Dinner at Prema Restaurant',
      what: 'Thalis for five', amount: 3150, payerId: 'm_aditi', kind: 'group',
      source: 'card', shares: EQUAL(3150, all),
    },
  ];

  return {
    version: 1,
    trip: {
      id: 'trip_gokarna', name: 'Gokarna Weekend', start: '2026-11-14', end: '2026-11-16',
      status: 'live',
    },
    // simulated swipes advance this trip clock, so the feed reads like the weekend itself
    clock: '2026-11-15T08:50:00+05:30',
    members,
    payments,
    lastMerchant: -1,
    invited: {},
    settle: { paid: {}, nudges: true },
  };
}

export function newTripState({ name, start, end, members }) {
  return {
    version: 1,
    trip: { id: makeId('trip'), name, start, end, status: 'live' },
    clock: `${start}T09:00:00+05:30`,
    members: members.map((m, i) => ({
      id: m.id || makeId('m'), name: m.name, isYou: !!m.isYou, hasCard: !!m.hasCard,
      last4: m.hasCard ? String(1000 + Math.floor(Math.random() * 8999)) : undefined,
      hue: hueFor(i),
    })),
    payments: [],
    lastMerchant: -1,
    invited: {},
    settle: { paid: {}, nudges: true },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || !Array.isArray(s.members)) return seedState();
    return s;
  } catch {
    return seedState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: the demo still works for this session */
  }
}
