"use client";
import { FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadMarkdown, printAsPdf, type ExportCard } from "@/lib/export";

export default function ExportButtons({
  deckName,
  cards,
}: {
  deckName: string;
  cards: ExportCard[];
}) {
  if (cards.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => printAsPdf(deckName, cards)}>
        <FileDown className="w-3.5 h-3.5" /> Export PDF
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadMarkdown(deckName, cards)}>
        <FileText className="w-3.5 h-3.5" /> Export Markdown
      </Button>
    </div>
  );
}