import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUserByClerkId, createDeck, saveFlashcards } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Try refreshing." },
        { status: 404 }
      );
    }

    const { pdfBase64, fileName, numberOfCards = 5, difficulty = "mixed" } =
      await req.json();

    if (!pdfBase64 || !fileName) {
      return NextResponse.json({ error: "Missing PDF data" }, { status: 400 });
    }

    const deckName = fileName
      .replace(/\.pdf$/i, "")
      .replace(/[-_]/g, " ")
      .trim();

    const difficultyRule =
      difficulty === "mixed"
        ? "Mix the difficulties naturally so the deck covers recall, understanding, and application."
        : `All flashcards must be "${difficulty}" difficulty level.`;

    const prompt = `You are a world-class educator creating flashcards from a document. Your job is to help a student deeply understand this material — not just memorise it.

Read the entire document carefully, then identify the ${numberOfCards} MOST IMPORTANT concepts a student needs to master. Create one flashcard per concept.

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
${difficultyRule}
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

Generate exactly ${numberOfCards} flashcards now.`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: prompt },
          ] as any,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let flashcards;
    try {
      flashcards = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude response:", raw);
      return NextResponse.json(
        { error: "Claude returned invalid format. Try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards could be generated from this PDF" },
        { status: 500 }
      );
    }

    // Quality validation
    flashcards = flashcards.filter(
      (c) =>
        typeof c?.front === "string" &&
        typeof c?.back === "string" &&
        c.front.trim().length > 10 &&
        c.back.trim().length > 50
    );

    if (flashcards.length === 0) {
      return NextResponse.json(
        {
          error:
            "Generated cards didn't meet quality standards. Try a different PDF.",
        },
        { status: 500 }
      );
    }

    const deck = await createDeck(user.id, deckName, fileName);
    await saveFlashcards(deck.id, flashcards);

    return NextResponse.json({
      success: true,
      deckId: deck.id,
      deckName: deck.name,
      flashcards,
      count: flashcards.length,
    });
  } catch (err) {
    console.error("Flashcard generation error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating flashcards" },
      { status: 500 }
    );
  }
}