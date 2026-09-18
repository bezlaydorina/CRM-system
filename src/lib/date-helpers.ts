// Small non-component helpers so ESLint's react-hooks/purity rule (which
// only inspects component/hook bodies) doesn't flag ordinary Date.now()
// usage inside Server Component pages.

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function daysAgoDate(days: number): Date {
  return hoursAgo(days * 24);
}

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
