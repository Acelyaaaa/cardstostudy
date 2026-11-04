"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileUp,
  Loader2,
  Trash2,
  Brain,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

type Deck = {
  id: number;
  name: string;
  total_cards: number;
  cards_studied: number;
  accuracy: string;
  last_studied: string | null;
  updated_at: string;
};

export default function DecksPage() {
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((d) => {
        setDecks(d.decks ?? []);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this deck? All its flashcards will be lost.")) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/decks/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setDecks((d) => d.filter((x) => x.id !== id));
      toast("Deck deleted");
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="border border-dashed border-gray-200 rounded-2xl p-14 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="font-medium text-gray-700 mb-1">No decks yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Upload your first PDF to get started
          </p>
          <Link href="/dashboard/upload">
            <Button className="gap-2">
              <FileUp className="w-4 h-4" /> Upload a PDF
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {decks.map((deck, i) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-gray-100 bg-white p-5 hover:shadow-md hover:border-indigo-100 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/decks/${deck.id}`}>
                    <h3 className="font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors cursor-pointer">
                      {deck.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {deck.total_cards} card{deck.total_cards !== 1 ? "s" : ""} ·{" "}
                    Updated {formatDate(deck.updated_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(deck.id)}
                  disabled={deleting === deck.id}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50"
                >
                  {deleting === deck.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div>
                  <span className="font-medium text-gray-700">
                    {deck.cards_studied}
                  </span>{" "}
                  studied
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    {Number(deck.accuracy).toFixed(0)}%
                  </span>{" "}
                  accuracy
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/study?deckId=${deck.id}`}
                  className="flex-1"
                >
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