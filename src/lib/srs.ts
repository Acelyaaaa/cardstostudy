export type SrsResponse = "again" | "hard" | "good" | "easy";

const QUALITY: Record<SrsResponse, number> = { again: 0, hard: 3, good: 4, easy: 5 };


export function nextSchedule(
  response: SrsResponse,
  intervalDays: number,
  easeFactor: number
) {
  const q = QUALITY[response];
  const ease = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const first = intervalDays <= 1;
  const grow = (n: number) => Math.max(intervalDays + 1, Math.round(n));

  let interval: number;
  if (response === "again") interval = 1;
  else if (response === "hard") interval = first ? 2 : grow(intervalDays * 1.2);
  else if (response === "good") interval = first ? 3 : grow(intervalDays * ease);
  else interval = first ? 5 : grow(intervalDays * ease * 1.3);

  return { interval, ease, correct: q >= 3 };
}

export function formatInterval(days: number) {
  return days < 30 ? `${days}d` : `${Math.round(days / 30)}mo`;
}