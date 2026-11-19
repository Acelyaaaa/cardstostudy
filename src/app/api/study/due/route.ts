import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getDeckById, getDueCards } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deckId = Number(new URL(req.url).searchParams.get("deckId"));
  if (!Number.isInteger(deckId) || deckId <= 0) {
    return NextResponse.json({ error: "Missing or invalid deckId" }, { status: 400 });
  }

  const deck = await getDeckById(deckId, user.id);
  if (!deck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cards = await getDueCards(deckId);
  return NextResponse.json({ cards, deckName: deck.name });
}