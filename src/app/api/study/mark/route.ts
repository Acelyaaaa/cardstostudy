import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, markCard, updateStreak } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { flashcardId, response } = await req.json();

  if (!flashcardId || !["again", "hard", "good", "easy"].includes(response)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const correct = await markCard(flashcardId, response);
  await updateStreak(user.id);

  return NextResponse.json({ success: true, correct });
}