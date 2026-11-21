"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Flame, Target, Trophy, Loader2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE = [0.23, 1, 0.32, 1] as const;

type Stats = {
  total_cards_studied: number;
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  overall_accuracy: string | number;
} | null;

type DeckRow = {
  id: number;
  name: string;
  total_cards: number;
  cards_studied: number;
  accuracy: string | number;
};

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats>(null);
  const [decks, setDecks] = useState<DeckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setStats(d.stats);
        setDecks(d.decks ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="max-w-3xl mx-auto text-center py-16 text-gray-500">We couldn&apos;t load your progress.</div>;
  }

  const cards = [
    { label: "Cards reviewed", value: stats?.total_cards_studied ?? 0, icon: Brain, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Accuracy", value: `${Math.round(Number(stats?.overall_accuracy ?? 0))}%`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Current streak", value: stats?.current_streak ?? 0, icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Best streak", value: stats?.longest_streak ?? 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Progress</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          You&apos;ve studied on {stats?.total_sessions ?? 0} day{stats?.total_sessions === 1 ? "" : "s"} so far.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: EASE }}
            className="rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">By deck</h2>

      {decks.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-gray-500 mb-4">No decks yet. Upload a PDF to start tracking progress.</p>
          <Link href="/dashboard/upload">
            <Button className="gap-2"><FileUp className="w-4 h-4" /> Upload a PDF</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((d) => {
            const pct = d.total_cards ? Math.round((d.cards_studied / d.total_cards) * 100) : 0;
            return (
              <Link key={d.id} href={`/dashboard/decks/${d.id}`}>
                <div className="rounded-xl border border-gray-100 bg-white p-4 hover:border-violet-200 transition-colors duration-150">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <p className="font-medium text-gray-900 truncate">{d.name}</p>
                    <p className="text-xs text-gray-500 shrink-0">
                      {d.cards_studied}/{d.total_cards} studied · {Math.round(Number(d.accuracy))}% accuracy
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-violet-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: EASE }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}