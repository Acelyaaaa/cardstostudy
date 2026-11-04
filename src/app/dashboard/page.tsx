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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

type DashboardData = {
  user: { id: number; name: string } | null;
  stats: {
    total_cards_studied: number;
    current_streak: number;
    overall_accuracy: number;
  } | null;
  decks: Array<{
    id: number;
    name: string;
    total_cards: number;
    cards_studied: number;
    last_studied: string | null;
  }>;
};

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Sync user to database first
      await fetch("/api/user/sync", { method: "POST" });
      // Then fetch stats
      const r = await fetch("/api/stats");
      const d = await r.json();
      setData(d);
      setLoading(false);
    }
    init();
  }, []);

  const name = user?.firstName || "there";
  const stats = data?.stats;
  const decks = data?.decks ?? [];
  const recentDeck = decks[0];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">
          Good {getTimeOfDay()}, {name}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here&apos;s where you&apos;re at today.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Cards studied",
            value: stats?.total_cards_studied ?? 0,
            icon: Brain,
            color: "text-indigo-500",
            bg: "bg-indigo-50",
          },
          {
            label: "Day streak",
            value: stats?.current_streak ?? 0,
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
          {
            label: "Accuracy",
            value: `${stats?.overall_accuracy ?? 0}%`,
            icon: Target,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-100 bg-white p-5 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Recent deck */}
      {recentDeck && (
        <motion.div {...fadeUp(0.1)} className="mb-6">
          <div className="rounded-xl border border-gray-100 bg-white p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  Continue where you left off
                </p>
                <h3 className="font-semibold text-gray-900">{recentDeck.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {recentDeck.total_cards} cards
                </p>
              </div>
              <Link href={`/dashboard/study?deckId=${recentDeck.id}`}>
                <Button size="sm" className="gap-1.5">
                  Study <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div {...fadeUp(0.15)}>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Quick actions
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              href: "/dashboard/upload",
              icon: FileUp,
              label: "Upload a PDF",
              desc: "Generate new flashcards",
            },
            {
              href: "/dashboard/decks",
              icon: BookOpen,
              label: "My decks",
              desc: `${decks.length} saved deck${decks.length !== 1 ? "s" : ""}`,
            },
            {
              href: "/dashboard/tutor",
              icon: MessageCircle,
              label: "Ask the tutor",
              desc: "Clarify any concept",
            },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer">
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

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}