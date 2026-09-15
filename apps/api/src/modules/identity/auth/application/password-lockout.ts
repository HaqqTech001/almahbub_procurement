/** A lock is anchored to the last genuine failure in the threshold sequence. */
export function passwordLockUntil(
  failures: readonly Date[],
  now: Date,
  threshold: number,
  windowSeconds: number,
): Date | null {
  const times = failures.map(date => date.getTime()).sort((a, b) => b - a).slice(0, threshold);
  if (times.length < threshold) return null;
  const newest = times[0]!;
  const oldest = times[threshold - 1]!;
  const windowMs = windowSeconds * 1000;
  const until = newest + windowMs;
  return newest - oldest < windowMs && until > now.getTime() ? new Date(until) : null;
}
