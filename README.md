# Squad Mode (a Scapia concept)

A clickable prototype for a product-internship assignment. Squad Mode is a group-trip mode for a travel credit card.

**The problem:** splitting trip costs breaks down when the payment happens, not at the end. Someone pays for breakfast, nobody logs it, and three days later the organiser is rebuilding the weekend from UPI history and asking friends for money.

**The idea:** when a linked card is swiped, the app asks one question right then: *Group or just me?* One tap logs the split. When the trip ends, the app works out the fewest transfers, gives each person one amount with a UPI link, and sends the reminders itself, so the organiser never has to chase anyone.

> Concept prototype for a product assignment. Not affiliated with or endorsed by Scapia. Card numbers, the invite link and UPI are all fake.

## What's in the demo

- **Trip home:** your live balance, everyone's balance, recent payments, and bookings made before the trip (stay and bus) imported from the organiser's card.
- **Simulate a card swipe (the core moment):** generates a payment at a Gokarna merchant, made by a random cardholder, and opens the *Group or just me?* sheet. Pick **Group** (equal split), **Just me** (personal), or **Custom split** (choose who was in, or set exact amounts). Balances roll to the new value and a toast confirms the payment, with Undo.
- **Add a cash or UPI payment** for spends that weren't on a card.
- **Invite card:** friends without the card don't get auto-logged; one card suggests inviting them (a mock share).
- **Activity:** every payment with Group / Custom / Personal tags and filters.
- **Settle:** end the trip to get the minimum set of transfers, mock "Pay via UPI" buttons, a settled progress bar and the auto-nudge reminder schedule.
- **Menu:** start a new trip (name, dates, friends, who has the card) or reset the demo.

The state is saved to `localStorage`, so a refresh keeps your changes. **Reset demo** brings back the seeded *Gokarna Weekend*.

## Run locally

Requires Node 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the built app
npm test           # checks the split and settle-up maths
```

## Deploy to Vercel

Build command `npm run build`, output directory `dist`. `vercel.json` sets both, and adds an SPA rewrite to `index.html`.

**Option A: Vercel dashboard via GitHub**

1. Push this folder to a GitHub repository.
2. On vercel.com, choose **Add New → Project** and import the repository.
3. Vercel detects Vite. Check that the build command is `npm run build` and the output directory is `dist`, then click **Deploy**.

**Option B: Vercel CLI**

```bash
npx vercel          # first run: log in, link the project, get a preview URL
npx vercel --prod   # deploy to production
```

## How the settle-up works

`src/lib/settle.js`

- Each payment stores its payer and a `shares` map (who owes what for it). Shares are whole rupees, and `splitEven` hands out the leftover rupees so the shares always add up to the bill.
- A person's balance is what they paid minus their shares. Balances always sum to zero.
- `simplifyDebts` finds the minimum number of transfers. The minimum equals the number of people with a non-zero balance minus the largest number of groups whose balances cancel out. A subset search finds those groups exactly (instant for a trip of 2 to 8 people), and inside each group the largest debtor pays the largest creditor.
- `scripts/test-settle.mjs` checks the seed data, a case where plain greedy matching uses one transfer too many, and 500 random trips against a brute-force minimum.

## Stack and structure

Vite, React 19, `motion` for the sheets and number animations, `lucide-react` icons, and self-hosted Bricolage Grotesque and Onest fonts. Plain CSS with tokens in `src/styles.css`.

```
src/
  App.jsx                 state, swipe simulation, routing between tabs
  lib/settle.js           balances + minimum-transfer settle-up
  lib/money.js            ₹ en-IN formatting, exact even splits
  lib/seed.js             Gokarna seed trip, merchants, localStorage
  lib/dates.js            IST date helpers
  components/             Sheet, SwipeSheet, AddCashSheet, InviteSheet, Toasts, bits
  screens/                Home, Activity, Settle, Setup
scripts/
  test-settle.mjs         maths checks (npm test)
  screenshots.mjs         390x844 screenshots with Playwright
screenshots/              captured screens
```

## Screenshots

Run `npm run build` first, then `node scripts/screenshots.mjs`. It needs Playwright and a Chromium (`npm i -D playwright && npx playwright install chromium`), or set `CHROME_PATH` to an existing Chromium binary.
