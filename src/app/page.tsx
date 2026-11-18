"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  GraduationCap,
  FileText,
  Zap,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductDemo from "@/components/landing/ProductDemo";

const EASE = [0.23, 1, 0.32, 1] as const;

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.35, ease: EASE, delay },
});

const steps = [
  { icon: FileText, step: "01", title: "Upload", desc: "Any PDF — lecture slides, textbook chapters, past papers." },
  { icon: Zap, step: "02", title: "Generate", desc: "Every page is read and turned into targeted flashcards." },
  { icon: RotateCcw, step: "03", title: "Study", desc: "Cards come back at the right moment via spaced repetition." },
  { icon: MessageSquare, step: "04", title: "Ask", desc: "The AI tutor explains anything until it makes sense." },
];

const freeTier = ["5 PDFs / month", "2 tutor sessions / month", "Spaced repetition", "Progress stats"];
const premiumTier = ["Unlimited PDFs", "Unlimited AI tutoring", "Advanced analytics", "Priority support"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-14 h-14 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-700 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Cards to Study</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/sign-up"><Button size="sm">Get started</Button></Link>
        </div>
      </nav>

      
      <section className="bg-white px-6 md:px-14 pt-24 pb-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-6">
              Turn your notes into<br />
              <span className="text-violet-700">exam confidence</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-9 max-w-lg">
              Upload a PDF and get flashcards, a spaced-repetition schedule and an AI tutor for whatever you&apos;re stuck on.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2 h-12 px-6 text-base">
                  Start for free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="h-12 px-6 text-base">Sign in</Button>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">Free tier includes 5 PDFs a month. No card needed.</p>
          </motion.div>
        </div>
      </section>

      
      <section className="bg-violet-700 px-6 md:px-14 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div {...reveal()} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">See it in action</h2>
            <p className="text-violet-200 text-sm">Click each tab to explore the features.</p>
          </motion.div>
          <motion.div {...reveal(0.06)}>
            <ProductDemo />
          </motion.div>
        </div>
      </section>

      
      <section className="bg-white px-6 md:px-14 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div {...reveal()} className="mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">From PDF to exam-ready</h2>
            <p className="text-gray-500">Four steps. No setup.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map(({ icon: Icon, step, title, desc }, i) => (
              <motion.div key={step} {...reveal(i * 0.05)}>
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-violet-700" />
                </div>
                <p className="text-xs font-semibold text-violet-500 mb-1 tracking-wide">{step}</p>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="bg-violet-700 px-6 md:px-14 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div {...reveal()} className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Simple pricing</h2>
            <p className="text-violet-200">Start free. Paid plans are on the way.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div {...reveal()} className="border border-white/25 rounded-2xl p-6">
              <p className="text-sm text-violet-200 mb-1">Free</p>
              <p className="text-4xl font-bold text-white mb-5">
                £0 <span className="text-base font-normal text-violet-200">/ month</span>
              </p>
              <ul className="space-y-3 mb-7">
                {freeTier.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-violet-100">
                    <CheckCircle className="w-4 h-4 text-white/80 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block">
                <Button
                  variant="outline"
                  className="w-full bg-transparent border-white/40 text-white hover:bg-white/10 hover:border-white/60 hover:text-white"
                >
                  Get started
                </Button>
              </Link>
            </motion.div>

            <motion.div {...reveal(0.06)} className="rounded-2xl p-6 bg-white">
              <p className="text-sm text-gray-400 mb-1">Premium</p>
              <p className="text-4xl font-bold text-gray-900 mb-5">
                £9 <span className="text-base font-normal text-gray-400">/ month</span>
              </p>
              <ul className="space-y-3 mb-7">
                {premiumTier.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-violet-700 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="w-full" disabled>Coming soon</Button>
            </motion.div>
          </div>
        </div>
      </section>

      
      <footer className="bg-white px-6 md:px-14 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-violet-700 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Cards to Study</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Cards to Study. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-700 transition-colors duration-150">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-700 transition-colors duration-150">Terms</Link>
            <a href="mailto:support@cardstostudy.app" className="text-xs text-gray-400 hover:text-gray-700 transition-colors duration-150">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}