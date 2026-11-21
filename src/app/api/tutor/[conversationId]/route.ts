import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { limitsFor } from "@/lib/plans";
import { getConversation, getTutorMessages } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).conversationId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const conversation = await getConversation(id, user.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows: { role: string; content: string }[] = await getTutorMessages(id);
  const sent = rows.filter((m) => m.role === "user").length;
  const max = limitsFor(user.subscription_tier).tutorMessagesPerSession;

  return NextResponse.json({
    messages: rows.map((m) => ({ role: m.role, content: m.content })),
    remaining: Math.max(max - sent, 0),
  });
}