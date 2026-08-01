/** Pure availability classification, ported from availMeta() in the prototype's 03-app.js. */
export interface Availability {
  out: boolean;
  cls: '' | 'low' | 'out';
  text: string;
}

export function availMeta(availableSeats: number | null | undefined): Availability {
  const seats = Number(availableSeats ?? 0);
  const out = seats === 0;
  if (out) return { out, cls: 'out', text: 'Sold out' };
  if (seats <= 3) return { out, cls: 'low', text: `Only ${seats} seat${seats > 1 ? 's' : ''} left` };
  return { out, cls: '', text: `${seats} seats left` };
}
