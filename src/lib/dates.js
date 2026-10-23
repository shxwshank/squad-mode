const TZ = 'Asia/Kolkata';
const day = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: TZ });
const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });
const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });

const asDate = (iso) => new Date(iso.length <= 10 ? `${iso}T12:00:00+05:30` : iso);

export function fmtDateRange(start, end) {
  if (!start) return '';
  const a = asDate(start);
  const b = asDate(end || start);
  const sameMonth = a.getMonth() === b.getMonth();
  if (start === end || !end) return day.format(a);
  if (sameMonth) return `${a.getDate()}–${day.format(b)}`;
  return `${day.format(a)} – ${day.format(b)}`;
}

export function fmtWhen(iso) {
  const d = asDate(iso);
  return `${day.format(d)}, ${time.format(d).toLowerCase()}`;
}

export function fmtDay(iso) {
  return weekday.format(asDate(iso));
}

export function fmtTime(iso) {
  return time.format(asDate(iso)).toLowerCase();
}

/** Advance an ISO timestamp (IST) by minutes and return it in the same offset form. */
export function addMinutes(iso, mins) {
  const t = asDate(iso).getTime() + mins * 60000;
  const ist = new Date(t + 5.5 * 3600000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:00+05:30`;
}
