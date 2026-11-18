"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const conversation = [
  {
    user: "Why is the Calvin cycle important?",
    assistant: "Great question. What do you already know about where plants get their energy from?",
  },
  {
    user: "From sunlight?",
    assistant:
      "Exactly. So if the light reactions capture sunlight as ATP — what do you think the Calvin cycle does with that ATP?",
  },
];

export default function TutorDemo() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "What would you like to understand better today?" },
  ]);
  const [stage, setStage] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (stage >= conversation.length) return;
    const delay = stage === 0 ? 900 : 2600;
    const t = setTimeout(() => {
      setMessages((m) => [...m, { role: "user", text: conversation[stage].user }]);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { role: "assistant", text: conversation[stage].assistant }]);
        setStage((s) => s + 1);
      }, 1400);
    }, delay);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="p-4 flex flex-col gap-2 h-full justify-end overflow-hidden">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="w-5 h-5 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center mr-1.5 mt-0.5 shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-violet-600" />
            </div>
          )}
          <div
            className={`max-w-[82%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${
              msg.role === "user" ? "bg-violet-600 text-white" : "bg-white border border-gray-100 text-gray-700"
            }`}
          >
            {msg.text}
          </div>
        </motion.div>
      ))}
      {typing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start items-center gap-1.5"
        >
          <div className="w-5 h-5 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-violet-600" />
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2.5 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}