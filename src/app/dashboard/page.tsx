"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Brain,
  Flame,
  Target,
  FileUp,
  BookOpen,
  MessageCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNextDue } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: EASE, delay },
});

type DeckRow = {
  id: number;
  name: string;
  total_cards: number;
  due_count: number;
  next_due: string | null;
};

type DashboardData = {
  stats: {
    total_cards_studied: number;
    current_streak: number;
    overall_accuracy: string | number;
  } | null;
  decks: DeckRow[];
  usage: { used: number; limit: number };
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [attempt]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">We couldn&apos;t load your dashboard.</p>
        <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
      </div>
    );
  }

  const name = user?.firstName || "there";
  const { stats, decks, usage } = data;
  const pdfsLeft = Math.max(usage.limit - usage.used, 0);

  const dueDecks = decks.filter((d) => d.due_count > 0).sort((a, b) => b.due_count - a.due_count);
  const totalDue = dueDecks.reduce((n, d) => n + d.due_count, 0);
  const nextDue = decks.map((d) => d.next_due).filter((x): x is string => !!x).sort()[0] ?? null;
  const studyHref = dueDecks.length === 1 ? `/dashboard/study?deckId=${dueDecks[0].id}` : "/dashboard/study";

  const statCards = [
    { label: "Cards studied", value: stats?.total_cards_studied ?? 0, icon: Brain, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Day streak", value: stats?.current_streak ?? 0, icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Accuracy", value: `${Math.round(Number(stats?.overall_accuracy ?? 0))}%`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  const actions = [
    { href: "/dashboard/upload", icon: FileUp, label: "Upload a PDF", desc: `${pdfsLeft} PDF${pdfsLeft !== 1 ? "s" : ""} left this month` },
    { href: "/dashboard/decks", icon: BookOpen, label: "My decks", desc: `${decks.length} saved deck${decks.length !== 1 ? "s" : ""}` },
    { href: "/dashboard/tutor", icon: MessageCircle, label: "Ask the tutor", desc: "Clarify any concept" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Good {getTimeOfDay()}, {name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here&apos;s where you&apos;re at today.</p>
      </motion.div>

      <motion.div {...fadeUp(0.04)} className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-5">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </motion.div>

      {decks.length > 0 && (
        <motion.div {...fadeUp(0.08)} className="mb-6">
          {totalDue > 0 ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-violet-500 mb-1">Due for review</p>
                <h3 className="font-semibold text-gray-900">
                  {totalDue} card{totalDue !== 1 ? "s" : ""} due
                </h3>
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {dueDecks.slice(0, 2).map((d) => `${d.name} (${d.due_count})`).join(", ")}
                  {dueDecks.length > 2 ? ` and ${dueDecks.length - 2} more` : ""}
                </p>
              </div>
              <Link href={studyHref} className="shrink-0">
                <Button size="sm" className="gap-1.5">
                  Review now <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">You&apos;re all caught up</h3>
                <p className="text-sm text-gray-500">
                  {nextDue ? `Your next review is ${formatNextDue(nextDue)}.` : "Upload another PDF to keep going."}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <motion.div {...fadeUp(0.12)}>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Quick actions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {actions.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-violet-200 transition-colors duration-150">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}