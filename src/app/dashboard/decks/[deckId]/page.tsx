"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Loader2, Trash2, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import ExportButtons from "@/components/ExportButtons";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/decks/${deckId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setDeck(d.deck))
      .catch(() => setDeck(null))
      .finally(() => setLoading(false));
  }, [deckId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast("Deck deleted");
      router.push("/dashboard/decks");
    } catch {
      toast("Failed to delete", "error");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
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
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this deck?"
        description={`"${deck.name}" and all its flashcards will be permanently deleted.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        <Link
          href="/dashboard/decks"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          All decks
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">{deck.name}</h1>
            <p className="text-sm text-gray-500">
              {deck.total_cards} cards · Created {formatDate(deck.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/study?deckId=${deck.id}`}>
              <Button className="gap-2">
                <Brain className="w-4 h-4" /> Study
              </Button>
            </Link>
            <Link href={`/dashboard/tutor?deckId=${deck.id}`}>
              <Button variant="outline" className="gap-2">
                <MessageCircle className="w-4 h-4" /> Ask tutor
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              aria-label="Delete deck"
              className="text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <ExportButtons deckName={deck.name} cards={deck.flashcards} />
        </div>
      </motion.div>

      <div className="space-y-3">
        {deck.flashcards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(0.08 + i * 0.03, 0.3), duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-xl border border-gray-100 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="font-medium text-gray-900 text-sm flex-1">{card.front}</p>
              <Badge variant={card.difficulty as "easy" | "medium" | "hard"}>{card.difficulty}</Badge>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{card.back}</p>
            {card.times_studied > 0 && (
              <p className="text-xs text-gray-400">
                Studied {card.times_studied} time{card.times_studied !== 1 ? "s" : ""} ·{" "}
                {Math.round((card.times_correct / card.times_studied) * 100)}% correct
              </p>
            )}
          </motion.div>
        ))}

        {deck.flashcards.length === 0 && (
          <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <BookOpen className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No flashcards in this deck</p>
          </div>
        )}
      </div>
    </div>
  );
}