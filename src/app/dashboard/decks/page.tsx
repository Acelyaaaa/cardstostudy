"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, FileUp, Loader2, Trash2, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

type Deck = {
  id: number;
  name: string;
  total_cards: number;
  cards_studied: number;
  due_count: number;
  accuracy: string;
  updated_at: string;
};

export default function DecksPage() {
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Deck | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setDecks(d.decks ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/decks/${pendingDelete.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setDecks((d) => d.filter((x) => x.id !== pendingDelete.id));
      toast("Deck deleted");
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">We couldn&apos;t load your decks.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this deck?"
        description={`"${pendingDelete?.name ?? ""}" and all its flashcards will be permanently deleted.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My decks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {decks.length} saved deck{decks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button size="sm" className="gap-1.5">
            <FileUp className="w-4 h-4" /> New deck
          </Button>
        </Link>
      </motion.div>

      {decks.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-2xl p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-5 h-5 text-violet-500" />
          </div>
          <p className="font-medium text-gray-700 mb-1">No decks yet</p>
          <p className="text-sm text-gray-400 mb-6">Upload your first PDF to get started</p>
          <Link href="/dashboard/upload">
            <Button className="gap-2">
              <FileUp className="w-4 h-4" /> Upload a PDF
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {decks.map((deck, i) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="group rounded-xl border border-gray-100 bg-white p-5 hover:border-violet-200 transition-colors duration-150"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/decks/${deck.id}`}>
                    <h3 className="font-semibold text-gray-900 truncate hover:text-violet-700 transition-colors duration-150">
                      {deck.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {deck.total_cards} card{deck.total_cards !== 1 ? "s" : ""} · Updated {formatDate(deck.updated_at)}
                  </p>
                </div>
                <button
                  onClick={() => setPendingDelete(deck)}
                  aria-label={`Delete ${deck.name}`}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-[color,opacity] duration-150 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div>
                  <span className={`font-medium ${deck.due_count > 0 ? "text-violet-700" : "text-gray-700"}`}>
                    {deck.due_count}
                  </span>{" "}
                  due
                </div>
                <div>
                  <span className="font-medium text-gray-700">{deck.cards_studied}</span> studied
                </div>
                <div>
                  <span className="font-medium text-gray-700">{Number(deck.accuracy).toFixed(0)}%</span> accuracy
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/dashboard/study?deckId=${deck.id}`} className="flex-1">
                  <Button size="sm" className="w-full gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Study
                  </Button>
                </Link>
                <Link href={`/dashboard/decks/${deck.id}`}>
                  <Button size="sm" variant="outline" className="gap-1">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}