import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
};

// ── Users ─────────────────────────────────────────────────────────────────

export async function getUserByClerkId(clerkId: string) {
  const r = await db.query(
    "SELECT * FROM users WHERE clerk_id = $1",
    [clerkId]
  );
  return r.rows[0] ?? null;
}

export async function createUser(
  clerkId: string,
  email: string,
  name: string
) {
  const r = await db.query(
    `INSERT INTO users (clerk_id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (clerk_id)
     DO UPDATE SET email = $2, name = $3
     RETURNING *`,
    [clerkId, email, name]
  );
  await db.query(
    `INSERT INTO user_statistics (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [r.rows[0].id]
  );
  return r.rows[0];
}

// ── Decks ──────────────────────────────────────────────────────────────────

export async function getUserDecks(userId: number) {
  const r = await db.query(
    "SELECT * FROM decks WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId]
  );
  return r.rows;
}

export async function createDeck(
  userId: number,
  name: string,
  filename: string
) {
  const r = await db.query(
    `INSERT INTO decks (user_id, name, pdf_filename)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name, filename]
  );
  return r.rows[0];
}

export async function getDeck(deckId: number) {
  const deck = await db.query("SELECT * FROM decks WHERE id = $1", [deckId]);
  const cards = await db.query(
    "SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY created_at ASC",
    [deckId]
  );
  return { ...deck.rows[0], flashcards: cards.rows };
}

export async function deleteDeck(deckId: number) {
  await db.query("DELETE FROM decks WHERE id = $1", [deckId]);
}

// ── Flashcards ─────────────────────────────────────────────────────────────

export async function saveFlashcards(
  deckId: number,
  cards: { front: string; back: string; difficulty: string }[]
) {
  for (const c of cards) {
    await db.query(
      `INSERT INTO flashcards (deck_id, front, back, difficulty)
       VALUES ($1, $2, $3, $4)`,
      [deckId, c.front, c.back, c.difficulty ?? "medium"]
    );
  }
  await db.query(
    `UPDATE decks
     SET total_cards = (SELECT COUNT(*) FROM flashcards WHERE deck_id = $1),
         updated_at = NOW()
     WHERE id = $1`,
    [deckId]
  );
}

export async function getDueCards(deckId: number) {
  const r = await db.query(
    `SELECT * FROM flashcards
     WHERE deck_id = $1
       AND (next_review IS NULL OR next_review <= NOW())
     ORDER BY COALESCE(next_review, '1970-01-01') ASC`,
    [deckId]
  );
  return r.rows;
}

export async function markCard(
  flashcardId: number,
  response: "again" | "hard" | "good" | "easy"
) {
  const cr = await db.query(
    "SELECT * FROM flashcards WHERE id = $1",
    [flashcardId]
  );
  const card = cr.rows[0];

  const q =
    response === "again" ? 0 :
    response === "hard"  ? 2 :
    response === "good"  ? 4 : 5;

  const correct = q >= 3;
  let ef = parseFloat(card.ease_factor);
  let interval = parseInt(card.interval_days);

  ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  if (!correct) {
    interval = 1;
  } else if (interval <= 1) {
    interval = 3;
  } else {
    interval = Math.round(interval * ef);
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  // Update the individual flashcard
  await db.query(
    `UPDATE flashcards
     SET times_studied   = times_studied + 1,
         times_correct   = times_correct + $1,
         ease_factor     = $2,
         interval_days   = $3,
         next_review     = $4,
         last_reviewed   = NOW()
     WHERE id = $5`,
    [correct ? 1 : 0, ef, interval, next, flashcardId]
  );

  // Update deck-level stats (cards_studied count and accuracy %)
  await db.query(
    `UPDATE decks
     SET cards_studied = (
           SELECT COUNT(*) FROM flashcards
           WHERE deck_id = $1 AND times_studied > 0
         ),
         accuracy = COALESCE(
           (SELECT ROUND(
             (SUM(times_correct)::decimal / NULLIF(SUM(times_studied), 0)) * 100, 2
           )
           FROM flashcards WHERE deck_id = $1), 0
         ),
         last_studied = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [card.deck_id]
  );

  // Update user-level stats (total studied + overall accuracy)
  const deckUser = await db.query(
    "SELECT user_id FROM decks WHERE id = $1",
    [card.deck_id]
  );
  const userId = deckUser.rows[0]?.user_id;

  if (userId) {
    await db.query(
      `UPDATE user_statistics
       SET total_cards_studied = total_cards_studied + 1,
           overall_accuracy = COALESCE(
             (SELECT ROUND(
               (SUM(f.times_correct)::decimal / NULLIF(SUM(f.times_studied), 0)) * 100, 2
             )
             FROM flashcards f
             JOIN decks d ON f.deck_id = d.id
             WHERE d.user_id = $1), 0
           ),
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  }

  return correct;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getUserStats(userId: number) {
  const r = await db.query(
    "SELECT * FROM user_statistics WHERE user_id = $1",
    [userId]
  );
  return r.rows[0] ?? null;
}

export async function updateStreak(userId: number) {
  const stats = await getUserStats(userId);
  if (!stats) return;

  const today = new Date().toISOString().split("T")[0];
  const last = stats.last_study_date
    ? new Date(stats.last_study_date).toISOString().split("T")[0]
    : null;

  let streak = stats.current_streak ?? 0;

  if (last === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  if (last === yStr) {
    streak += 1;
  } else {
    streak = 1;
  }

  await db.query(
    `UPDATE user_statistics
     SET current_streak      = $1,
         longest_streak      = GREATEST(longest_streak, $1),
         last_study_date     = $2,
         total_sessions      = total_sessions + 1,
         updated_at          = NOW()
     WHERE user_id = $3`,
    [streak, today, userId]
  );
}

// ── Tutor ──────────────────────────────────────────────────────────────────

export async function createConversation(userId: number, topic: string) {
  const r = await db.query(
    `INSERT INTO tutor_conversations (user_id, topic)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, topic]
  );
  return r.rows[0];
}

export async function saveMessage(
  conversationId: number,
  role: string,
  content: string
) {
  const r = await db.query(
    `INSERT INTO tutor_messages (conversation_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, role, content]
  );
  return r.rows[0];
}

export async function getTutorMessages(conversationId: number) {
  const r = await db.query(
    `SELECT * FROM tutor_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return r.rows;
}

export async function getUserConversations(userId: number) {
  const r = await db.query(
    `SELECT * FROM tutor_conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 20`,
    [userId]
  );
  return r.rows;
}