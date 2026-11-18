import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, getUserStats, getUserDecks } from "@/lib/db";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ user: null, stats: null, decks: [] });
  }

  const [stats, decks] = await Promise.all([
    getUserStats(user.id),
    getUserDecks(user.id),
  ]);

  return NextResponse.json({ user, stats, decks });
}