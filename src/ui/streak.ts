export function streakLabel(streak: number): string {
  if (streak === 0) return "Start a streak today";
  return streak === 1 ? "1-day streak" : `${streak}-day streak`;
}
