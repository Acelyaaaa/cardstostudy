"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  Loader2,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

type Flashcard = {
  id: number;
  front: string;
  back: string;
  difficulty: string;
  times_studied: number;
  times_correct: number;
};

type Deck = {
  id: number;
  name: string;
  total_cards: number;
  cards_studied: number;
  accuracy: string;
  created_at: string;
  flashcards: Flashcard[];
};

export default function DeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/decks/${deckId}`)
      .then((r) => r.json())
      .then((d) => {
        setDeck(d.deck);
        setLoading(false);
      });
  }, [deckId]);

  const handleDelete = async () => {
    if (!confirm("Delete this deck and all its flashcards?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      toast("Deck deleted");
      router.push("/dashboard/decks");
    } catch {
      toast("Failed to delete", "error");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">Deck not found</p>
        <Link href="/dashboard/decks">
          <Button variant="outline">Back to decks</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href="/dashboard/decks"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All decks
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              {deck.name}
            </h1>
            <p className="text-sm text-gray-500">
              {deck.total_cards} cards · Created {formatDate(deck.created_at)}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <Link href={`/dashboard/study?deckId=${deck.id}`}>
              <Button className="gap-2">
                <Brain className="w-4 h-4" /> Study
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {deck.flashcards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.03 }}
            className="rounded-xl border border-gray-100 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="font-medium text-gray-900 text-sm flex-1">
                {card.front}
              </p>
              <Badge variant={card.difficulty as "easy" | "medium" | "hard"}>
                {card.difficulty}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              {card.back}
            </p>
            {card.times_studied > 0 && (
              <p className="text-xs text-gray-400">
                Studied {card.times_studied} time
                {card.times_studied !== 1 ? "s" : ""} ·{" "}
                {Math.round(
                  (card.times_correct / card.times_studied) * 100
                )}
                % correct
              </p>
            )}
          </motion.div>
        ))}

        {deck.flashcards.length === 0 && (
          <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <BookOpen className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No flashcards in this deck
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}