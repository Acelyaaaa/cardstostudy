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

const steps = [
  { icon: FileText, step: "01", title: "Upload", desc: "Any PDF — lecture slides, textbook chapters, past papers." },
  { icon: Zap, step: "02", title: "Generate", desc: "Claude reads every page and writes targeted flashcards." },
  { icon: RotateCcw, step: "03", title: "Study", desc: "Cards surface at the right moment via spaced repetition." },
  { icon: MessageSquare, step: "04", title: "Ask", desc: "The AI tutor explains anything until it makes sense." },
];

const freeTier = ["30 flashcards / month", "2 tutor sessions", "Spaced repetition", "Progress stats"];
const premiumTier = ["Unlimited flashcards", "Unlimited AI tutoring", "Advanced analytics", "Priority support"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-14 h-14 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Cards to Study</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/sign-up"><Button size="sm">Get started</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-14 pt-20 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5 mb-7">
              <Zap className="w-3.5 h-3.5" />
              Powered by Claude AI
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-6">
              Turn your notes into<br />
              <span className="text-indigo-500">exam confidence</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-9 max-w-lg">
              Upload a PDF. Claude reads it and builds personalised flashcards, a spaced study plan, and an AI tutor — all calibrated to your exam.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2 h-12 px-6 text-base">
                  Start for free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="h-12 px-6 text-base">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Free tier includes 30 flashcards a month. No card needed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product demo */}
      <section className="px-6 md:px-14 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              See it in action
            </h2>
            <p className="text-gray-500 text-sm">
              Click each tab to explore the features.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ProductDemo />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-14 py-24 bg-gray-50/70">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              From PDF to exam-ready
            </h2>
            <p className="text-gray-500">Four steps. No setup.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map(({ icon: Icon, step, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm mb-3">
                  <Icon className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xs font-semibold text-indigo-400 mb-1 tracking-wide">{step}</p>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 md:px-14 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Simple pricing</h2>
            <p className="text-gray-500">Start free, upgrade when you need more.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="border border-gray-200 rounded-2xl p-6 bg-white"
            >
              <p className="text-sm text-gray-400 mb-1">Free</p>
              <p className="text-4xl font-bold text-gray-900 mb-5">
                £0 <span className="text-base font-normal text-gray-400">/ month</span>
              </p>
              <ul className="space-y-3 mb-7">
                {freeTier.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block">
                <Button variant="outline" className="w-full">Get started</Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="border border-indigo-500 rounded-2xl p-6 bg-indigo-500"
            >
              <p className="text-sm text-indigo-200 mb-1">Premium</p>
              <p className="text-4xl font-bold text-white mb-5">
                £9 <span className="text-base font-normal text-indigo-200">/ month</span>
              </p>
              <ul className="space-y-3 mb-7">
                {premiumTier.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-indigo-100">
                    <CheckCircle className="w-4 h-4 text-white/80 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block">
                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50">Upgrade</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-14 py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Cards to Study</span>
          </div>
          <p className="text-xs text-gray-400">2025 Cards to Study. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Terms</Link>
            <a href="mailto:support@cardstostudy.app" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}