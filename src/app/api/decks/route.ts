import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getUserDecks } from "@/lib/db";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decks = await getUserDecks(user.id);
  return NextResponse.json({ decks });
}