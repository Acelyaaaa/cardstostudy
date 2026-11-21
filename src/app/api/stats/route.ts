import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { planOf } from "@/lib/plans";
import { getUserStats, getUserDecks, getMonthlyUsage, getTutorUsage } from "@/lib/db";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = user.subscription_tier;
  const [stats, decks, usage, tutorUsage] = await Promise.all([
    getUserStats(user.id),
    getUserDecks(user.id),
    getMonthlyUsage(user.id, tier),
    getTutorUsage(user.id, tier),
  ]);

  return NextResponse.json({
    user: { id: user.id, name: user.name },
    stats,
    decks,
    usage,
    tutorUsage,
    plan: planOf(tier),
  });
}