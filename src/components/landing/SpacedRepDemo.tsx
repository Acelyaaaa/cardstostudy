"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const cards = [
  { q: "What does ATP stand for?", a: "Adenosine Triphosphate — the primary energy currency of the cell." },
  { q: "Define cellular respiration", a: "Converting glucose and oxygen into ATP, CO₂, and water." },
  { q: "What is the role of ribosomes?", a: "Synthesising proteins by translating mRNA sequences." },
];

const responses = [
  { key: "again", label: "Again", cls: "bg-red-50 text-red-600 hover:bg-red-100 border-red-100" },
  { key: "hard", label: "Hard", cls: "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100" },
  { key: "good", label: "Good", cls: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100" },
  { key: "easy", label: "Easy", cls: "bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100" },
];

export default function SpacedRepDemo() {
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);

  const card = cards[cardIndex % cards.length];

  const handleAnswer = () => {
    setTimeout(() => {
      setCardIndex((i) => i + 1);
      setFlipped(false);
    }, 250);
  };

  return (
    <div className="p-5 flex flex-col gap-3 h-full justify-center">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>Card {(cardIndex % cards.length) + 1} of {cards.length}</span>
        <span className="text-emerald-600 font-medium">8 day streak</span>
      </div>

      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: 1000 }}
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="relative"
        >
          <div
            className="rounded-xl border border-gray-100 bg-white p-5 min-h-[110px] flex flex-col justify-between"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide">Question</p>
            <p className="text-sm font-medium text-gray-800 mt-2">{card.q}</p>
            <p className="text-xs text-gray-300 mt-3">tap to reveal</p>
          </div>
          <div
            className="absolute inset-0 rounded-xl border border-violet-100 bg-violet-50 p-5 flex flex-col justify-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xs text-violet-400 uppercase tracking-wide mb-2">Answer</p>
            <p className="text-sm text-violet-800 leading-relaxed">{card.a}</p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-4 gap-1.5"
          >
            {responses.map(({ key, label, cls }) => (
              <button
                key={key}
                onClick={handleAnswer}
                className={`text-xs font-medium py-2 rounded-lg border transition-[background-color,transform] duration-150 active:scale-[0.97] ${cls}`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}