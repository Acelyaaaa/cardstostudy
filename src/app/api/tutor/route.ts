import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getOrCreateUser } from "@/lib/auth";
import { limitsFor } from "@/lib/plans";
import {
  createConversation,
  getConversation,
  countUserMessages,
  getTutorMessages,
  saveMessage,
  getTutorUsage,
  getUserConversations,
  getDeck,
  getDeckById,
  tutorGloballyBusy,
} from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 30;

type ChatMsg = { role: "user" | "assistant"; content: string };

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [conversations, usage] = await Promise.all([
    getUserConversations(user.id),
    getTutorUsage(user.id, user.subscription_tier),
  ]);
  return NextResponse.json({ conversations, usage });
}

async function deckContext(deckId: number | null, userId: number) {
  if (!deckId) return "";
  const deck = await getDeck(deckId, userId);
  if (!deck || deck.flashcards.length === 0) return "";
  const cards = deck.flashcards
    .map((c: { front: string; back: string }, i: number) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`)
    .join("\n");
  return `\n\nThe student is revising a deck called "${deck.name}". Its flashcards:\n${cards}\nUse these as the main reference for their questions, and add helpful context where useful.`;
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limits = limitsFor(user.subscription_tier);

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1000) {
    return NextResponse.json({ error: "Message must be between 1 and 1000 characters" }, { status: 400 });
  }

  let conversation: { id: number; deck_id: number | null } | null = null;
  let deckId: number | null = null;
  let sent = 0;
  let history: ChatMsg[] = [];

  if (body.conversationId !== undefined && body.conversationId !== null) {
    const id = Number(body.conversationId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }
    conversation = await getConversation(id, user.id);
    if (!conversation) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    sent = await countUserMessages(id);
    if (sent >= limits.tutorMessagesPerSession) {
      return NextResponse.json(
        { error: "This session has reached its message limit. Start a new session." },
        { status: 429 }
      );
    }
    deckId = conversation.deck_id ?? null;
    history = (await getTutorMessages(id)).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
  } else {
    const usage = await getTutorUsage(user.id, user.subscription_tier);
    if (usage.used >= usage.limit) {
      return NextResponse.json(
        { error: "You've used all your tutor sessions this month. They reset on the 1st." },
        { status: 429 }
      );
    }
    if (body.deckId) {
      const id = Number(body.deckId);
      const deck = Number.isInteger(id) ? await getDeckById(id, user.id) : null;
      if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
      deckId = deck.id;
    }
  }

  if (await tutorGloballyBusy()) {
    return NextResponse.json(
      { error: "The tutor has hit its daily limit. Please try again tomorrow." },
      { status: 429 }
    );
  }

  let recent = history.slice(-24);
  while (recent.length && recent[0].role !== "user") recent = recent.slice(1);

  const system = `You are the study tutor inside Cards to Study, an app that helps students revise from their own notes.
- Explain concepts clearly and simply, then check understanding with one short follow-up question.
- Keep replies under 150 words unless the student asks for more detail.
- Use plain text and short paragraphs. Avoid headings; use lists only when they genuinely help.
- If the student is wrong, say so kindly and explain why.
- Stay on studying and learning; if asked for something unrelated, steer back politely.
- If asked, say you are an AI study tutor.${await deckContext(deckId, user.id)}`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system,
      messages: [...recent, { role: "user", content: message }],
    });

    const block = res.content.find((b) => b.type === "text");
    const reply = block && block.type === "text" ? block.text.trim() : "";
    if (!reply) throw new Error("Empty reply");

  
    if (!conversation) {
      let topic = message.slice(0, 60);
      if (deckId) {
        const deck = await getDeckById(deckId, user.id);
        if (deck) topic = deck.name;
      }
      conversation = await createConversation(user.id, topic, deckId);
    }
    await saveMessage(conversation!.id, "user", message);
    await saveMessage(conversation!.id, "assistant", reply);

    return NextResponse.json({
      conversationId: conversation!.id,
      reply,
      remaining: Math.max(limits.tutorMessagesPerSession - (sent + 1), 0),
    });
  } catch (err) {
    console.error("Tutor error:", err);
    return NextResponse.json({ error: "The tutor is unavailable right now. Please try again." }, { status: 500 });
  }
}