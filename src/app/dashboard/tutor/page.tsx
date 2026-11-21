"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Plus, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Msg = { role: "user" | "assistant"; content: string };
type Conv = { id: number; topic: string | null };
type DeckOption = { id: number; name: string };
type Usage = { used: number; limit: number; messagesPerSession: number };

function TutorChat() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conv[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [deckId, setDeckId] = useState(searchParams.get("deckId") ?? "");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = () =>
    fetch("/api/tutor")
      .then((r) => r.json())
      .then((d) => {
        setConversations(d.conversations ?? []);
        setUsage(d.usage ?? null);
      })
      .catch(() => {});

  useEffect(() => {
  fetch("/api/tutor")
    .then((r) => r.json())
    .then((d) => {
      const list: Conv[] = d.conversations ?? [];
      setConversations(list);
      setUsage(d.usage ?? null);
      
      if (!searchParams.get("deckId") && list.length > 0) openSession(list[0].id);
    })
    .catch(() => {});
  fetch("/api/decks")
    .then((r) => r.json())
    .then((d) => setDecks(d.decks ?? []))
    .catch(() => {});
}, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const newSession = () => {
    setActiveId(null);
    setMessages([]);
    setRemaining(null);
  };

  const openSession = async (id: number) => {
    setLoadingSession(true);
    try {
      const r = await fetch(`/api/tutor/${id}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setActiveId(id);
      setMessages(d.messages);
      setRemaining(d.remaining);
    } catch {
      toast("Couldn't open that session", "error");
    } finally {
      setLoadingSession(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const r = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: activeId ?? undefined,
          deckId: activeId ? undefined : deckId ? Number(deckId) : undefined,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Something went wrong");

      setActiveId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setRemaining(data.remaining);
      refresh();
    } catch (e) {
      setMessages((m) => m.slice(0, -1));
      setInput(text);
      toast(e instanceof Error ? e.message : "Something went wrong", "error");
    } finally {
      setSending(false);
    }
  };

  const sessionsExhausted = !activeId && !!usage && usage.used >= usage.limit;
  const messagesExhausted = !!activeId && remaining === 0;
  const blocked = sessionsExhausted || messagesExhausted;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-4rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI tutor</h1>
          {usage && (
            <p className="text-xs text-gray-400 mt-0.5">
              {usage.used} of {usage.limit} free sessions used this month · {usage.messagesPerSession} messages per session
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <select
              value={activeId ?? ""}
              onChange={(e) => (e.target.value ? openSession(Number(e.target.value)) : newSession())}
              aria-label="Past sessions"
              className="h-8 max-w-[160px] rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Past sessions</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>{c.topic || "Session"}</option>
              ))}
            </select>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={newSession}>
            <Plus className="w-3.5 h-3.5" /> New session
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
        {loadingSession && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
          </div>
        )}

        {!loadingSession && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <p className="font-medium text-gray-800 mb-1">What are you stuck on?</p>
            <p className="text-sm text-gray-400 mb-5 max-w-xs">
              Ask about any concept, or pick one of your decks so the tutor knows what you&apos;re revising.
            </p>
            {decks.length > 0 && (
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                aria-label="Deck to use as context"
                className="h-9 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">No deck (general question)</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                m.role === "user" ? "bg-violet-600 text-white" : "bg-gray-50 border border-gray-100 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3.5 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {blocked && (
        <p className="text-xs text-amber-600 mt-3">
          {sessionsExhausted
            ? "You've used all your free tutor sessions this month. They reset on the 1st."
            : "This session has reached its message limit. Start a new session to continue."}
        </p>
      )}

      <div className="flex items-end gap-2 mt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          maxLength={1000}
          disabled={blocked}
          placeholder="Ask a question…"
          className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
        />
        <Button onClick={send} disabled={!input.trim() || sending || blocked} aria-label="Send" className="h-[52px] px-4">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      {remaining !== null && remaining > 0 && (
        <p className="text-xs text-gray-400 mt-2">{remaining} message{remaining !== 1 ? "s" : ""} left in this session</p>
      )}
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
        </div>
      }
    >
      <TutorChat />
    </Suspense>
  );
}