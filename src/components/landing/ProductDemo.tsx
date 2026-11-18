"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, RotateCcw, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";

const UploadDemo = dynamic(() => import("./UploadDemo"), { ssr: false });
const SpacedRepDemo = dynamic(() => import("./SpacedRepDemo"), { ssr: false });
const TutorDemo = dynamic(() => import("./TutorDemo"), { ssr: false });

const tabs = [
  { id: "upload", icon: FileText, label: "Upload & generate", sublabel: "PDF to flashcards" },
  { id: "study", icon: RotateCcw, label: "Spaced repetition", sublabel: "Study at the right time" },
  { id: "tutor", icon: MessageSquare, label: "AI tutor", sublabel: "Ask anything" },
];

const demos = [UploadDemo, SpacedRepDemo, TutorDemo];

export default function ProductDemo() {
  const [active, setActive] = useState(0);
  const Demo = demos[active];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start">
      <div className="flex md:flex-col gap-2">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = active === i;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-3 p-3.5 rounded-xl text-left w-full transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] ${
                isActive ? "bg-white" : "hover:bg-white/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-violet-50" : "bg-white/10"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-700" : "text-violet-100"}`} />
              </div>
              <div className="min-w-0 hidden md:block">
                <p className={`text-sm font-medium leading-tight ${isActive ? "text-gray-900" : "text-white"}`}>
                  {tab.label}
                </p>
                <p className={`text-xs mt-0.5 ${isActive ? "text-gray-400" : "text-violet-200"}`}>
                  {tab.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/20 bg-[#fafafa] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-white">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          </div>
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded h-5 mx-6 flex items-center px-2">
            <span className="text-[11px] text-gray-400">cardstostudy.app/dashboard/{tabs[active].id}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="h-[280px]"
          >
            <Demo />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}