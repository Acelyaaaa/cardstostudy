import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { markCard, updateStreak } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const flashcardId = Number(body?.flashcardId);
  const response = body?.response;

  if (
    !Number.isInteger(flashcardId) ||
    flashcardId <= 0 ||
    !["again", "hard", "good", "easy"].includes(response)
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const correct = await markCard(flashcardId, user.id, response);
  if (correct === null) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  await updateStreak(user.id);
  return NextResponse.json({ success: true, correct });
}