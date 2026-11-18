"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Zap, CheckCircle } from "lucide-react";

const cards = [
  {
    q: "What is the mitochondria?",
    a: "The powerhouse of the cell — produces ATP via cellular respiration.",
    diff: "easy",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    q: "Explain the Krebs cycle",
    a: "Chemical reactions that generate energy through oxidation of acetyl-CoA.",
    diff: "hard",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    q: "Define osmosis",
    a: "Movement of water through a semipermeable membrane from low to high solute concentration.",
    diff: "medium",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export default function UploadDemo() {
  const [stage, setStage] = useState<"idle" | "uploading" | "done">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStage("uploading"), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stage !== "uploading") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStage("done"), 300);
          return 100;
        }
        return p + 3;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [stage]);

  return (
    <div className="p-5 flex flex-col justify-center h-full">
      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-200 rounded-xl text-center"
          >
            <FileText className="w-7 h-7 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Lecture_Notes_Biology.pdf</p>
          </motion.div>
        )}

        {stage === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-36 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Zap className="w-4 h-4 text-violet-600" />
              Reading your notes…
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400">{progress}% processed</p>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">5 flashcards generated</span>
            </div>
            {cards.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white"
              >
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${c.color} ${c.bg} shrink-0 mt-0.5`}>
                  {c.diff}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{c.q}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.a}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}