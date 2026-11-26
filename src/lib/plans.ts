export type Plan = "free" | "premium";

export const PLAN_LIMITS = {
  free: { pdfsPerMonth: 5, tutorSessionsPerMonth: 2, tutorMessagesPerSession: 10 },
  premium: { pdfsPerMonth: 50, tutorSessionsPerMonth: 30, tutorMessagesPerSession: 50 },
} as const;

export function planOf(tier: string | null | undefined): Plan {
  return tier === "premium" ? "premium" : "free";
}

export function limitsFor(tier: string | null | undefined) {
  return PLAN_LIMITS[planOf(tier)];
}