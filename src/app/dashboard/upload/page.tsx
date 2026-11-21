"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, CheckCircle, RefreshCw, X, Loader2, Brain, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import ExportButtons from "@/components/ExportButtons";

type Stage = "idle" | "processing" | "done" | "error";

interface Card {
  front: string;
  back: string;
  difficulty: string;
}


const MAX_BYTES = 3_000_000;

function FlipCard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="cursor-pointer h-48" style={{ perspective: 1000 }} onClick={() => setFlipped((f) => !f)}>
      <div
        className="relative w-full h-full transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-xl border border-gray-100 bg-white p-4 flex flex-col justify-between overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Badge variant={card.difficulty as "easy" | "medium" | "hard"}>{card.difficulty}</Badge>
          <p className="text-sm font-medium text-gray-800 leading-snug">{card.front}</p>
          <p className="text-xs text-gray-300">Click to flip</p>
        </div>
        <div
          className="absolute inset-0 rounded-xl border border-violet-100 bg-violet-50 p-4 flex items-center overflow-y-auto"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-xs text-violet-800 leading-relaxed">{card.back}</p>
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
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const limitReached = usage ? usage.used >= usage.limit : false;

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => d.usage && setUsage(d.usage))
      .catch(() => {});
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (limitReached) {
        toast("You've used all your free PDFs this month", "error");
        return;
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast("Please upload a PDF file", "error");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast("PDF must be under 3MB. Try compressing it or splitting it into chapters.", "error");
        return;
      }

      setFileName(file.name);
      setStage("processing");

      const reader = new FileReader();
      reader.onerror = () => {
        setErrorMsg("Couldn't read that file. Please try again.");
        setStage("error");
      };
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];

          const r = await fetch("/api/generate-flashcards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64: base64, fileName: file.name }),
          });

          const data = await r.json().catch(() => ({}));
          if (r.status === 413) {
            throw new Error("PDF must be under 3MB. Try compressing it or splitting it into chapters.");
          }
          if (!r.ok) throw new Error(data.error || "Generation failed");

          setCards(data.flashcards);
          setDeckId(data.deckId);
          setDeckName(data.deckName);
          if (data.usage) setUsage(data.usage);
          setStage("done");
          toast(`${data.count} flashcards generated`);
        } catch (e) {
          setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
          setStage("error");
        }
      };
      reader.readAsDataURL(file);
    },
    [limitReached, toast]
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Upload notes</h1>
        <p className="text-sm text-gray-500">Drop in a PDF and get 5 flashcards covering its key ideas.</p>
        {usage && (
          <p className="text-xs text-gray-400 mt-1">
            {Math.max(usage.limit - usage.used, 0)} of {usage.limit} free PDFs left this month
          </p>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {limitReached && (
              <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                You&apos;ve used all {usage?.limit} free PDFs this month. They reset on the 1st.
              </div>
            )}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors duration-150 ${
                limitReached ? "opacity-50 pointer-events-none " : ""
              }${dragOver ? "border-violet-400 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = ""; // lets the same file be picked again
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <FileUp className={`w-6 h-6 ${dragOver ? "text-violet-700" : "text-violet-500"}`} />
              </div>
              <p className="font-medium text-gray-700 mb-1">Drag your PDF here</p>
              <p className="text-sm text-gray-400">or click to browse · up to 3MB</p>
            </div>
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
            </div>
            <p className="font-medium text-gray-800 mb-1">Reading your notes…</p>
            <p className="text-sm text-gray-400">This usually takes 10–30 seconds</p>
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="text-center py-16">
            <p className="font-medium text-gray-800 mb-1">Hmm, something went wrong</p>
            <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
            <Button onClick={reset} variant="outline">Try again</Button>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{deckName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {cards.length} flashcards from {fileName} · saved to My decks
                </p>
              </div>
              <button onClick={reset} aria-label="Start over" className="text-gray-400 hover:text-gray-600 transition-colors duration-150">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-5">
              <ExportButtons deckName={deckName} cards={cards} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {cards.map((card, i) => (
                <FlipCard key={i} card={card} />
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => router.push(`/dashboard/study?deckId=${deckId}`)} className="flex-1 gap-2">
                <Brain className="w-4 h-4" /> Study now
              </Button>
              <Button onClick={() => router.push(`/dashboard/decks/${deckId}`)} variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" /> View deck
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