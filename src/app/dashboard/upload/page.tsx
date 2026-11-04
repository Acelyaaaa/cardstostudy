"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp,
  CheckCircle,
  RefreshCw,
  X,
  Loader2,
  Brain,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type Stage = "idle" | "processing" | "done" | "error";

interface Card {
  front: string;
  back: string;
  difficulty: string;
}

function FlipCard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="cursor-pointer h-48"
      style={{ perspective: 1000 }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-xl border border-gray-100 bg-white p-4 flex flex-col justify-between overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Badge variant={card.difficulty as "easy" | "medium" | "hard"}>
            {card.difficulty}
          </Badge>
          <p className="text-sm font-medium text-gray-800 leading-snug">
            {card.front}
          </p>
          <p className="text-xs text-gray-300">Click to flip</p>
        </div>
        <div
          className="absolute inset-0 rounded-xl border border-indigo-100 bg-indigo-50 p-4 flex items-center overflow-y-auto"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-xs text-indigo-800 leading-relaxed">{card.back}</p>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [cards, setCards] = useState<Card[]>([]);
  const [deckId, setDeckId] = useState<number | null>(null);
  const [deckName, setDeckName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [cardCount, setCardCount] = useState(5);
  const [difficulty, setDifficulty] = useState("mixed");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast("Please upload a PDF file", "error");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast("File must be under 10MB", "error");
        return;
      }

      setFileName(file.name);
      setStage("processing");

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];

          const r = await fetch("/api/generate-flashcards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pdfBase64: base64,
              fileName: file.name,
              numberOfCards: cardCount,
              difficulty,
            }),
          });

          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Generation failed");

          setCards(data.flashcards);
          setDeckId(data.deckId);
          setDeckName(data.deckName);
          setStage("done");
          toast(`${data.count} flashcards generated`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Something went wrong";
          setErrorMsg(msg);
          setStage("error");
        }
      };
      reader.readAsDataURL(file);
    },
    [cardCount, difficulty, toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setStage("idle");
    setCards([]);
    setDeckId(null);
    setFileName("");
    setErrorMsg("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Upload notes
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Drop in any PDF and Claude will turn it into flashcards.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <FileUp
                  className={`w-6 h-6 ${
                    dragOver ? "text-indigo-600" : "text-indigo-400"
                  }`}
                />
              </div>
              <p className="font-medium text-gray-700 mb-1">
                Drag your PDF here
              </p>
              <p className="text-sm text-gray-400">
                or click to browse · up to 10MB
              </p>
            </div>

            <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => setShowSettings(!showSettings)}
              >
                <span className="font-medium">Generation settings</span>
                {showSettings ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showSettings && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">
                      Number of cards:{" "}
                      <span className="text-indigo-600">{cardCount}</span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={15}
                      value={cardCount}
                      onChange={(e) => setCardCount(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>3</span>
                      <span>15</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">
                      Difficulty
                    </label>
                    <div className="flex gap-2">
                      {["mixed", "easy", "medium", "hard"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                            difficulty === d
                              ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
            <p className="font-medium text-gray-800 mb-1">
              Claude is reading your notes…
            </p>
            <p className="text-sm text-gray-400 mb-6">
              This usually takes 10-30 seconds
            </p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <p className="font-medium text-gray-800 mb-1">
              Hmm, something went wrong
            </p>
            <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
            <Button onClick={reset} variant="outline">
              Try again
            </Button>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{deckName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {cards.length} flashcards from {fileName}
                </p>
              </div>
              <button
                onClick={reset}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
  {cards.map((card, i) => (
    <FlipCard key={i} card={card} />
  ))}
</div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  router.push(`/dashboard/study?deckId=${deckId}`)
                }
                className="flex-1 gap-2"
              >
                <Brain className="w-4 h-4" /> Study now
              </Button>
              <Button
                onClick={() => router.push("/dashboard/decks")}
                variant="outline"
                className="gap-2"
              >
                <Save className="w-4 h-4" /> View deck
              </Button>
              <Button onClick={reset} variant="ghost" className="gap-2">
                <RefreshCw className="w-4 h-4" /> New
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}