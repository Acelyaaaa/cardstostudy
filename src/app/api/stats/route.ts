import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getUserStats, getUserDecks, getMonthlyUsage, getTutorUsage } from "@/lib/db";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [stats, decks, usage, tutorUsage] = await Promise.all([
    getUserStats(user.id),
    getUserDecks(user.id),
    getMonthlyUsage(user.id),
    getTutorUsage(user.id),
  ]);

  return NextResponse.json({ user, stats, decks, usage, tutorUsage });
}