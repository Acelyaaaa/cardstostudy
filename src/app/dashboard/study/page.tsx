"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Trophy,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Card = {
  id: number;
  front: string;
  back: string;
  difficulty: string;
};

function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">How spaced repetition works</h3>
            <p className="text-xs text-gray-500 mt-0.5">Rate how well you remembered each card.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { label: "Again", time: "under 1 minute", desc: "You forgot it. Shown again this session.", color: "bg-red-50 text-red-700 border-red-100" },
            { label: "Hard", time: "about 1 day", desc: "You struggled. Shown tomorrow.", color: "bg-amber-50 text-amber-700 border-amber-100" },
            { label: "Good", time: "about 3 days", desc: "You knew it. Shown in a few days.", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { label: "Easy", time: "about 5 days", desc: "You nailed it. Shown later next week.", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
          ].map(({ label, time, desc, color }) => (
            <div key={label} className={`rounded-lg border p-3 ${color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs opacity-80">{time}</span>
              </div>
              <p className="text-xs opacity-90">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          Cards you find hard appear more often. Cards you find easy wait longer between reviews — so your brain spends time on what it actually needs.
        </p>

        <Button onClick={onClose} className="w-full mt-5">Got it</Button>
      </motion.div>
    </motion.div>
  );
}

function StudyFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId");

  const [cards, setCards] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!deckId) return;
    fetch(`/api/study/due?deckId=${deckId}`)
      .then((r) => r.json())
      .then((d) => {
        setCards(d.cards ?? []);
        setDeckName(d.deckName ?? "");
        setLoading(false);
      });
  }, [deckId]);

  const current = cards[currentIndex];

  const handleResponse = async (response: "again" | "hard" | "good" | "easy") => {
    if (!current || submitting) return;
    setSubmitting(true);

    try {
      const r = await fetch("/api/study/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: current.id, response }),
      });
      const data = await r.json();

      setSessionStats((s) => ({
        correct: s.correct + (data.correct ? 1 : 0),
        total: s.total + 1,
      }));

      setTimeout(() => {
        if (currentIndex + 1 >= cards.length) {
          setDone(true);
        } else {
          setCurrentIndex((i) => i + 1);
          setFlipped(false);
        }
        setSubmitting(false);
      }, 250);
    } catch {
      setSubmitting(false);
    }
  };

  if (!deckId) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">No deck selected</p>
        <Link href="/dashboard/decks"><Button variant="outline">Go to decks</Button></Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
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
          No cards due in this deck right now. Come back later or study another deck.
        </p>
        <Link href="/dashboard/decks"><Button variant="outline">Back to decks</Button></Link>
      </div>
    );
  }

  if (done) {
    const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100);
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-6 h-6 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Session complete</h2>
          <p className="text-sm text-gray-500 mb-8">
            You reviewed {sessionStats.total} card{sessionStats.total !== 1 ? "s" : ""} with {accuracy}% accuracy.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-2xl font-bold text-gray-900">{sessionStats.total}</p>
              <p className="text-xs text-gray-500">Reviewed</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-2xl font-bold text-emerald-500">{sessionStats.correct}</p>
              <p className="text-xs text-gray-500">Correct</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-2xl font-bold text-indigo-500">{accuracy}%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/dashboard/decks")}>Back to decks</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto">
      <AnimatePresence>{showHelp && <HowItWorks onClose={() => setShowHelp(false)} />}</AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard/decks" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">{currentIndex + 1} of {cards.length} · {deckName}</div>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            How it works
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100 rounded-full mb-8 overflow-hidden">
        <motion.div className="h-full bg-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* Card — fixed container with internal flip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="mb-6"
        >
          <div
            className="cursor-pointer"
            style={{ perspective: 1000, height: 360 }}
            onClick={() => !submitting && setFlipped((f) => !f)}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}
            >
              {/* Front */}
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

              {/* Back */}
              <div
                className="absolute inset-0 rounded-2xl border border-indigo-100 bg-indigo-50 p-6 flex flex-col shadow-sm"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className="text-xs text-indigo-400 uppercase tracking-wide mb-3">Answer</span>
                <div className="flex-1 overflow-y-auto pr-1">
                  <p className="text-sm text-indigo-900 leading-relaxed">{current.back}</p>
                </div>
                <p className="text-xs text-indigo-400 text-center mt-3 pt-2 border-t border-indigo-100">
                  How well did you remember this?
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Response buttons — always below card, never overlapping */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-4 gap-2"
          >
            {[
              { key: "again", label: "Again", sub: "<1m",  cls: "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" },
              { key: "hard",  label: "Hard",  sub: "~1d",  cls: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" },
              { key: "good",  label: "Good",  sub: "~3d",  cls: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" },
              { key: "easy",  label: "Easy",  sub: "~5d",  cls: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100" },
            ].map(({ key, label, sub, cls }) => (
              <button
                key={key}
                disabled={submitting}
                onClick={() => handleResponse(key as "again" | "hard" | "good" | "easy")}
                className={`flex flex-col items-center py-3 rounded-xl border transition-all disabled:opacity-50 ${cls}`}
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs opacity-70 mt-0.5">{sub}</span>
              </button>
            ))}
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

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>}>
      <StudyFlow />
    </Suspense>
  );
}