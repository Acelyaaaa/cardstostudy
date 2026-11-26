import { Pool } from "pg";
import { nextSchedule, type SrsResponse } from "@/lib/srs";
import { limitsFor } from "@/lib/plans";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
};

const GLOBAL_DAILY_LIMIT = Number(process.env.MAX_DAILY_PDFS ?? 50);
const GLOBAL_DAILY_TUTOR_LIMIT = Number(process.env.MAX_DAILY_TUTOR_MESSAGES ?? 300);



export async function getUserByClerkId(clerkId: string) {
  const r = await db.query("SELECT * FROM users WHERE clerk_id = $1", [clerkId]);
  return r.rows[0] ?? null;
}

export async function createUser(clerkId: string, email: string, name: string) {
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


export async function deleteUser(userId: number) {
  await db.query("DELETE FROM users WHERE id = $1", [userId]);
}

export async function getUserDecks(userId: number) {
  const r = await db.query(
    `SELECT d.*,
       (SELECT COUNT(*)::int FROM flashcards f
         WHERE f.deck_id = d.id
           AND (f.next_review IS NULL OR f.next_review <= NOW())) AS due_count,
       (SELECT MIN(f.next_review) FROM flashcards f
         WHERE f.deck_id = d.id AND f.next_review > NOW()) AS next_due
     FROM decks d
     WHERE d.user_id = $1
     ORDER BY d.updated_at DESC`,
    [userId]
  );
  return r.rows;
}

export async function createDeck(userId: number, name: string, filename: string) {
  const r = await db.query(
    `INSERT INTO decks (user_id, name, pdf_filename)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name, filename]
  );
  return r.rows[0];
}


export async function getDeckById(deckId: number, userId: number) {
  const r = await db.query(
    "SELECT * FROM decks WHERE id = $1 AND user_id = $2",
    [deckId, userId]
  );
  return r.rows[0] ?? null;
}


export async function getDeck(deckId: number, userId: number) {
  const deck = await getDeckById(deckId, userId);
  if (!deck) return null;
  const cards = await db.query(
    "SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY created_at ASC, id ASC",
    [deckId]
  );
  return { ...deck, flashcards: cards.rows };
}


export async function deleteDeck(deckId: number, userId: number) {
  await db.query(
    `DELETE FROM flashcards
     WHERE deck_id IN (SELECT id FROM decks WHERE id = $1 AND user_id = $2)`,
    [deckId, userId]
  );
  const r = await db.query(
    "DELETE FROM decks WHERE id = $1 AND user_id = $2",
    [deckId, userId]
  );
  return (r.rowCount ?? 0) > 0;
}



export async function saveFlashcards(
  deckId: number,
  cards: { front: string; back: string; difficulty: string }[]
) {
  if (cards.length === 0) return;

  const values: unknown[] = [];
  const rows = cards.map((c, i) => {
    const o = i * 4;
    values.push(deckId, c.front, c.back, c.difficulty ?? "medium");
    return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4})`;
  });

  await db.query(
    `INSERT INTO flashcards (deck_id, front, back, difficulty)
     VALUES ${rows.join(", ")}`,
    values
  );

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
     ORDER BY COALESCE(next_review, '1970-01-01') ASC, id ASC`,
    [deckId]
  );
  return r.rows;
}


export async function markCard(
  flashcardId: number,
  userId: number,
  response: SrsResponse
): Promise<boolean | null> {
  const cr = await db.query(
    `SELECT f.* FROM flashcards f
     JOIN decks d ON d.id = f.deck_id
     WHERE f.id = $1 AND d.user_id = $2`,
    [flashcardId, userId]
  );
  const card = cr.rows[0];
  if (!card) return null;

  const { interval, ease, correct } = nextSchedule(
    response,
    parseInt(card.interval_days),
    parseFloat(card.ease_factor)
  );


  const next = new Date();
  next.setUTCDate(next.getUTCDate() + interval);
  next.setUTCHours(0, 0, 0, 0);

  await db.query(
    `UPDATE flashcards
     SET times_studied   = times_studied + 1,
         times_correct   = times_correct + $1,
         ease_factor     = $2,
         interval_days   = $3,
         next_review     = $4,
         last_reviewed   = NOW()
     WHERE id = $5`,
    [correct ? 1 : 0, ease, interval, next, flashcardId]
  );

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

  return correct;
}



export async function getMonthlyUsage(userId: number, tier?: string | null) {
  const r = await db.query(
    `SELECT COUNT(*)::int AS n FROM generation_log
     WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  return { used: r.rows[0].n as number, limit: limitsFor(tier).pdfsPerMonth };
}

export type Reservation =
  | { ok: true; id: number }
  | { ok: false; reason: "user_limit" | "global_limit" };


export async function reserveGeneration(
  userId: number,
  tier?: string | null
): Promise<Reservation> {
  const g = await db.query(
    `SELECT COUNT(*)::int AS n FROM generation_log
     WHERE created_at > NOW() - INTERVAL '24 hours'`
  );
  if (g.rows[0].n >= GLOBAL_DAILY_LIMIT) {
    return { ok: false, reason: "global_limit" };
  }

  const ins = await db.query(
    "INSERT INTO generation_log (user_id) VALUES ($1) RETURNING id",
    [userId]
  );
  const id = ins.rows[0].id as number;

  const { used, limit } = await getMonthlyUsage(userId, tier);
  if (used > limit) {
    await releaseGeneration(id);
    return { ok: false, reason: "user_limit" };
  }
  return { ok: true, id };
}

export async function releaseGeneration(id: number) {
  await db.query("DELETE FROM generation_log WHERE id = $1", [id]);
}



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



export async function getTutorUsage(userId: number, tier?: string | null) {
  const limits = limitsFor(tier);
  const r = await db.query(
    `SELECT COUNT(*)::int AS n FROM tutor_conversations
     WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  return {
    used: r.rows[0].n as number,
    limit: limits.tutorSessionsPerMonth,
    messagesPerSession: limits.tutorMessagesPerSession,
  };
}


export async function tutorGloballyBusy() {
  const r = await db.query(
    `SELECT COUNT(*)::int AS n FROM tutor_messages
     WHERE role = 'user' AND created_at > NOW() - INTERVAL '24 hours'`
  );
  return r.rows[0].n >= GLOBAL_DAILY_TUTOR_LIMIT;
}

export async function createConversation(
  userId: number,
  topic: string,
  deckId: number | null
) {
  const r = await db.query(
    `INSERT INTO tutor_conversations (user_id, topic, deck_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, topic, deckId]
  );
  return r.rows[0];
}


export async function getConversation(conversationId: number, userId: number) {
  const r = await db.query(
    "SELECT * FROM tutor_conversations WHERE id = $1 AND user_id = $2",
    [conversationId, userId]
  );
  return r.rows[0] ?? null;
}

export async function countUserMessages(conversationId: number) {
  const r = await db.query(
    `SELECT COUNT(*)::int AS n FROM tutor_messages
     WHERE conversation_id = $1 AND role = 'user'`,
    [conversationId]
  );
  return r.rows[0].n as number;
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
  await db.query(
    "UPDATE tutor_conversations SET updated_at = NOW() WHERE id = $1",
    [conversationId]
  );
  return r.rows[0];
}


export async function getTutorMessages(conversationId: number) {
  const r = await db.query(
    `SELECT * FROM tutor_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC, id ASC`,
    [conversationId]
  );
  return r.rows;
}

export async function getUserConversations(userId: number) {
  const r = await db.query(
    `SELECT * FROM tutor_conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 50`,
    [userId]
  );
  return r.rows;
}