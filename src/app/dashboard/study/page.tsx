"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, Trophy, Info, X, Brain, FileUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { nextSchedule, formatInterval, type SrsResponse } from "@/lib/srs";
import { formatNextDue } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;

type Card = {
  id: number;
  front: string;
  back: string;
  difficulty: string;
  interval_days: number;
  ease_factor: string;
};

type DeckSummary = {
  id: number;
  name: string;
  total_cards: number;
  due_count: number;
  next_due: string | null;
};

const RESPONSES: { key: SrsResponse; label: string; cls: string }[] = [
  { key: "again", label: "Again", cls: "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" },
  { key: "hard", label: "Hard", cls: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" },
  { key: "good", label: "Good", cls: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" },
  { key: "easy", label: "Easy", cls: "bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100" },
];

function HowItWorks({ onClose }: { onClose: () => void }) {
  const rows = [
    { label: "Again", time: "tomorrow", desc: "You forgot it. It also comes back at the end of this session.", color: "bg-red-50 text-red-700 border-red-100" },
    { label: "Hard", time: "in about 2 days", desc: "You remembered with effort.", color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Good", time: "in about 3 days", desc: "You knew it.", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "Easy", time: "in about 5 days", desc: "You nailed it.", color: "bg-violet-50 text-violet-700 border-violet-100" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">How spaced repetition works</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your rating decides when you see the card next.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 transition-colors duration-150">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {rows.map(({ label, time, desc, color }) => (
            <div key={label} className={`rounded-lg border p-3 ${color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs opacity-80">due again {time}</span>
              </div>
              <p className="text-xs opacity-90">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          A card is <strong>due</strong> once its review date arrives, and new cards are due straight away. Cards that
          are due show up in your study decks and on your Overview. Times shown are for a first review; each time you
          get a card right, the gap grows.
        </p>
        <Button onClick={onClose} className="w-full mt-5">Got it</Button>
      </motion.div>
    </motion.div>
  );
}

function DeckPicker() {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setDecks(d.decks ?? []))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <div className="max-w-xl mx-auto text-center py-16 text-gray-500">We couldn&apos;t load your decks.</div>;
  }
  if (!decks) {
    return (
      <div className="max-w-xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
      </div>
    );
  }
  if (decks.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-5 h-5 text-violet-500" />
        </div>
        <h2 className="font-semibold text-gray-900 mb-1">Nothing to study yet</h2>
        <p className="text-sm text-gray-500 mb-6">Upload a PDF to create your first deck.</p>
        <Link href="/dashboard/upload">
          <Button className="gap-2"><FileUp className="w-4 h-4" /> Upload a PDF</Button>
        </Link>
      </div>
    );
  }

  const sorted = [...decks].sort((a, b) => b.due_count - a.due_count);
  const totalDue = sorted.reduce((n, d) => n + d.due_count, 0);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Study</h1>
      <p className="text-sm text-gray-500 mb-1">
        {totalDue > 0
          ? `${totalDue} card${totalDue !== 1 ? "s" : ""} due for review. Choose a deck to start.`
          : "You're all caught up. Nothing is due right now."}
      </p>
      <p className="text-xs text-gray-400 mb-6">
        A card is due when its review date arrives. New cards are due straight away, and the time you choose after
        each answer sets the next date.
      </p>
      <div className="space-y-2">
        {sorted.map((d) => (
          <Link key={d.id} href={`/dashboard/study?deckId=${d.id}`}>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 hover:border-violet-200 transition-colors duration-150">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{d.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {d.total_cards} cards
                  {d.due_count === 0 && d.next_due ? ` · next review ${formatNextDue(d.next_due)}` : ""}
                </p>
              </div>
              {d.due_count > 0 ? (
                <span className="shrink-0 rounded-full bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1">
                  {d.due_count} due
                </span>
              ) : (
                <span className="shrink-0 text-xs text-gray-400">Up to date</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StudyFlow({ deckId }: { deckId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [cards, setCards] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetch(`/api/study/due?deckId=${deckId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setCards(d.cards ?? []);
        setDeckName(d.deckName ?? "");
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [deckId]);

  const current = cards[currentIndex];

  const handleResponse = async (response: SrsResponse) => {
    if (!current || submitting) return;
    setSubmitting(true);

    try {
      const r = await fetch("/api/study/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: current.id, response }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();

      setSessionStats((s) => ({
        correct: s.correct + (data.correct ? 1 : 0),
        total: s.total + 1,
      }));

      // "Again" puts the card back at the end of this session.
      const requeue = response === "again";
      const queueLength = requeue ? cards.length + 1 : cards.length;
      if (requeue) setCards((c) => [...c, current]);

      setTimeout(() => {
        if (currentIndex + 1 >= queueLength) {
          setDone(true);
        } else {
          setCurrentIndex((i) => i + 1);
          setFlipped(false);
        }
        setSubmitting(false);
      }, 200);
    } catch {
      toast("Couldn't save that answer. Please try again.", "error");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">We couldn&apos;t load this deck.</p>
        <Link href="/dashboard/study"><Button variant="outline">Back to study</Button></Link>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <h2 className="font-semibold text-gray-900 mb-1">All caught up</h2>
        <p className="text-sm text-gray-500 mb-6">
          No cards are due in this deck right now. Cards come back on the date you chose when you rated them.
        </p>
        <Link href="/dashboard/study"><Button variant="outline">Back to study</Button></Link>
      </div>
    );
  }

  if (done) {
    const accuracy = sessionStats.total ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25, ease: EASE }}>
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-6 h-6 text-violet-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Session complete</h2>
          <p className="text-sm text-gray-500 mb-8">
            You reviewed {sessionStats.total} card{sessionStats.total !== 1 ? "s" : ""} with {accuracy}% accuracy.
            Each one will come back on the date you chose.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-2xl font-bold text-gray-900">{sessionStats.total}</p>
              <p className="text-xs text-gray-500">Reviewed</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-2xl font-bold text-emerald-500">{sessionStats.correct}</p>
              <p className="text-xs text-gray-500">Remembered</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-2xl font-bold text-violet-600">{accuracy}%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/dashboard/study")}>Back to study</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>Overview</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = (currentIndex / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto">
      <AnimatePresence>{showHelp && <HowItWorks onClose={() => setShowHelp(false)} />}</AnimatePresence>

      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard/study" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150">
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 truncate max-w-[200px]">
            {currentIndex + 1} of {cards.length} due · {deckName}
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 transition-colors duration-150"
          >
            <Info className="w-3.5 h-3.5" /> How it works
          </button>
        </div>
      </div>

      <div className="h-1 w-full bg-gray-100 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-violet-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: EASE }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="mb-6"
        >
          <div
            className="cursor-pointer"
            style={{ perspective: 1000, height: 360 }}
            onClick={() => !submitting && setFlipped((f) => !f)}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}
            >
              <div
                className="absolute inset-0 rounded-2xl border border-gray-100 bg-white p-8 flex flex-col shadow-sm"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex justify-between items-start mb-6">
                  <Badge variant={current.difficulty as "easy" | "medium" | "hard"}>{current.difficulty}</Badge>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Question</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-lg font-medium text-gray-900 leading-relaxed text-center">{current.front}</p>
                </div>
                <p className="text-xs text-gray-300 text-center mt-6">Click to reveal answer</p>
              </div>

              <div
                className="absolute inset-0 rounded-2xl border border-violet-100 bg-violet-50 p-6 flex flex-col shadow-sm"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className="text-xs text-violet-400 uppercase tracking-wide mb-3">Answer</span>
                <div className="flex-1 overflow-y-auto pr-1">
                  <p className="text-sm text-violet-900 leading-relaxed">{current.back}</p>
                </div>
                <p className="text-xs text-violet-400 text-center mt-3 pt-2 border-t border-violet-100">
                  How well did you remember this?
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <div className="grid grid-cols-4 gap-2">
              {RESPONSES.map(({ key, label, cls }) => {
                const { interval } = nextSchedule(key, Number(current.interval_days) || 1, parseFloat(current.ease_factor) || 2.5);
                return (
                  <button
                    key={key}
                    disabled={submitting}
                    onClick={() => handleResponse(key)}
                    className={`flex flex-col items-center py-3 rounded-xl border transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 ${cls}`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs opacity-70 mt-0.5">{formatInterval(interval)}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
              The time under each button is when this card will be due again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p className="text-xs text-center text-gray-400 mt-2">
          Try to answer in your head first, then click to reveal.
        </p>
      )}
    </div>
  );
}

function StudyPageInner() {
  const deckId = useSearchParams().get("deckId");
  return deckId ? <StudyFlow key={deckId} deckId={deckId} /> : <DeckPicker />;
}

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
        </div>
      }
    >
      <StudyPageInner />
    </Suspense>
  );
}