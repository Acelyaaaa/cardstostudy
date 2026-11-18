import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getOrCreateUser } from "@/lib/auth";
import {
  createDeck,
  saveFlashcards,
  deleteDeck,
  reserveGeneration,
  releaseGeneration,
  getMonthlyUsage,
} from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

const CARDS_PER_PDF = 5;

const MAX_PDF_BYTES = 3_000_000;
const MAX_BASE64_CHARS = Math.ceil(MAX_PDF_BYTES / 3) * 4;
const CARD_LEVELS = ["easy", "medium", "hard"];

const PROMPT = `You are a world-class educator creating flashcards from a document. Your job is to help a student deeply understand this material — not just memorise it.

Read the entire document carefully, then identify the ${CARDS_PER_PDF} MOST IMPORTANT concepts a student needs to master. Create one flashcard per concept.

STRICT RULES — follow these exactly:

QUESTIONS (front of card)
- Exactly one sentence
- Focused on ONE important concept, term, process, or idea
- Clear, specific, and unambiguous — not vague or trivial
- Must be directly derived from content explicitly stated in the document
- Never ask about something not covered in the document
- Avoid "What is X?" when a more precise question works ("Why does X cause Y?" or "How does X differ from Y?")
- Maximum 120 characters

ANSWERS (back of card)
- Exactly 3 clear sentences
- The first sentence directly answers the question
- The second sentence explains WHY or HOW
- The third sentence adds essential context, an example, or an implication
- Only use information explicitly stated in or directly inferable from the document — never invent facts, dates, names, or examples
- If the document uses specific terminology, use the same terminology
- Written in your own clear words, not copy-pasted from the document
- Maximum 350 characters total
- Prioritise clarity and density over length — every sentence must earn its place

DIFFICULTY
Mix the difficulties naturally so the deck covers recall, understanding, and application.
- "easy": Basic recall of a definition, term, or fact
- "medium": Understanding a concept, relationship, or process
- "hard": Applying a concept, comparing ideas, or reasoning about implications

QUALITY STANDARDS
- Prioritise the most exam-worthy, foundational concepts
- Skip trivia, page numbers, author bios, acknowledgements, or anything peripheral
- If the document is short or has limited substance, generate fewer high-quality cards rather than padding with weak ones
- Every single card must be genuinely useful for understanding the subject

OUTPUT FORMAT
Return ONLY a valid JSON array. No markdown fences, no preamble, no explanation outside the JSON.

Format:
[
  {
    "front": "The question goes here as one clear sentence.",
    "back": "First sentence answers directly. Second sentence explains why or how. Third sentence provides context or an example.",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Generate exactly ${CARDS_PER_PDF} flashcards now.`;

export async function POST(req: NextRequest) {
  let userId: number | null = null;
  let reservationId: number | null = null;
  let deckId: number | null = null;

 
  const fail = async (status: number, error: string) => {
    try {
      if (deckId && userId) await deleteDeck(deckId, userId);
      if (reservationId) await releaseGeneration(reservationId);
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
    return NextResponse.json({ error }, { status });
  };

  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    const body = await req.json().catch(() => null);
    const pdfBase64 = body?.pdfBase64;
    const fileName = body?.fileName;

    if (typeof pdfBase64 !== "string" || typeof fileName !== "string") {
      return NextResponse.json({ error: "Missing PDF data" }, { status: 400 });
    }
    if (pdfBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json(
        { error: "PDF must be under 3MB. Try compressing it or splitting it into chapters." },
        { status: 413 }
      );
    }
    // "%PDF-" in base64
    if (!pdfBase64.startsWith("JVBERi0")) {
      return NextResponse.json({ error: "That doesn't look like a PDF file" }, { status: 400 });
    }

    const deckName =
      fileName
        .slice(0, 200)
        .replace(/\.pdf$/i, "")
        .replace(/[-_]/g, " ")
        .trim() || "Untitled deck";

    const reservation = await reserveGeneration(user.id);
    if (!reservation.ok) {
      return NextResponse.json(
        {
          error:
            reservation.reason === "user_limit"
              ? "You've used all your free PDFs for this month. They reset on the 1st."
              : "We've hit our daily limit. Please try again tomorrow.",
        },
        { status: 429 }
      );
    }
    reservationId = reservation.id;

   
    const content: any = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
      },
      { type: "text", text: PROMPT },
    ];

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content }],
    });

    const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", raw);
      return fail(500, "We couldn't generate flashcards this time. Please try again.");
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fail(500, "No flashcards could be generated from this PDF.");
    }

    const flashcards = parsed
      .filter(
        (c) =>
          typeof c?.front === "string" &&
          typeof c?.back === "string" &&
          c.front.trim().length > 10 &&
          c.back.trim().length > 50
      )
      .slice(0, CARDS_PER_PDF)
      .map((c) => ({
        front: c.front.trim() as string,
        back: c.back.trim() as string,
        difficulty: CARD_LEVELS.includes(c.difficulty) ? (c.difficulty as string) : "medium",
      }));

    if (flashcards.length === 0) {
      return fail(500, "The generated cards didn't meet our quality standards. Try a different PDF.");
    }

    const deck = await createDeck(user.id, deckName, fileName.slice(0, 200));
    deckId = deck.id;
    await saveFlashcards(deck.id, flashcards);

    const usage = await getMonthlyUsage(user.id);

    return NextResponse.json({
      success: true,
      deckId: deck.id,
      deckName: deck.name,
      flashcards,
      count: flashcards.length,
      usage,
    });
  } catch (err) {
    console.error("Flashcard generation error:", err);
    if (err instanceof Anthropic.APIError && err.status === 400) {
      return fail(
        422,
        "We couldn't read this PDF. It may be password-protected, corrupted or over 100 pages."
      );
    }
    return fail(500, "Something went wrong generating flashcards.");
  }
}