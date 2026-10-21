import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cards to Study — AI Flashcards from Your Notes",
  description:
    "Upload your lecture notes or PDFs and get AI-generated flashcards, a personalised study plan, and an AI tutor — all in one place.",
  keywords: ["flashcards", "AI study", "revision", "university", "spaced repetition"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}