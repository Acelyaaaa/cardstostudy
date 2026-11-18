import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getDeck, deleteDeck } from "@/lib/db";

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseId((await params).deckId);
  if (!id) {
    return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
  }

  const deck = await getDeck(id, user.id);
  if (!deck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deck });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseId((await params).deckId);
  if (!id) {
    return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
  }

  const deleted = await deleteDeck(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}