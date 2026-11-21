"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Usage = { used: number; limit: number; messagesPerSession?: number };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 truncate">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { toast } = useToast();

  const [pdfs, setPdfs] = useState<Usage | null>(null);
  const [tutor, setTutor] = useState<Usage | null>(null);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setPdfs(d.usage ?? null);
        setTutor(d.tutorUsage ?? null);
        setPlan(d.plan === "premium" ? "premium" : "free");
      })
      .catch(() => {});
  }, []);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const r = await fetch("/api/account", { method: "DELETE" });
      if (!r.ok) throw new Error();
      window.location.href = "/";
    } catch {
      toast("Couldn't delete your account. Please try again.", "error");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "—";
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

  return (
    <div className="max-w-2xl mx-auto">
      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        description="This permanently deletes your account, all your decks and flashcards, your progress and your tutor conversations. This can't be undone."
        confirmLabel="Delete account"
        loading={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmOpen(false)}
      />

      <h1 className="text-xl font-semibold text-gray-900 mb-8">Settings</h1>

      <section className="rounded-xl border border-gray-100 bg-white p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">Account</h2>
          <Button size="sm" variant="outline" onClick={() => openUserProfile()}>
            Manage account
          </Button>
        </div>
        <Row label="Name" value={name} />
        <Row label="Email" value={email} />
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2">Plan</h2>
        <Row label="Current plan" value={plan === "premium" ? "Premium" : "Free"} />
        <Row label="PDFs this month" value={pdfs ? `${pdfs.used} of ${pdfs.limit} used` : "—"} />
        <Row label="Tutor sessions this month" value={tutor ? `${tutor.used} of ${tutor.limit} used` : "—"} />
        <Row label="Messages per tutor session" value={tutor?.messagesPerSession ? `${tutor.messagesPerSession}` : "—"} />
        <p className="text-xs text-gray-400 mt-3">
          Limits reset on the 1st of each month.{plan === "free" ? " Paid plans are coming soon." : ""}
        </p>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2">Legal</h2>
        <div className="flex gap-4 text-sm">
          <Link href="/privacy" className="text-violet-700 hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-violet-700 hover:underline">Terms of Service</Link>
        </div>
      </section>

      <section className="rounded-xl border border-red-100 bg-white p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Delete account</h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all your data. You can export your decks first from each deck&apos;s page.
        </p>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>Delete my account</Button>
      </section>
    </div>
  );
}