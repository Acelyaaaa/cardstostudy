import type { PDFFont } from "pdf-lib";

export type ExportCard = { front: string; back: string; difficulty?: string };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const BOTTOM = 52;
const CONTENT_W = PAGE_W - MARGIN * 2;
const AVAILABLE_H = PAGE_H - MARGIN - BOTTOM;
const INSET = 14;

function slug(name: string) {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
    "flashcards"
  );
}

export function exportFileName(deckName: string) {
  return `${slug(deckName)}.pdf`;
}


const FONT_SIGNATURES = [0x00010000, 0x74727565, 0x4f54544f];

async function loadFont(path: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(path);
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    if (buf.byteLength < 4) return null;
    return FONT_SIGNATURES.includes(new DataView(buf).getUint32(0)) ? buf : null;
  } catch {
    return null;
  }
}


function toWinAnsi(s: string) {
  return s
    .replace(/[→⇒]/g, "->")
    .replace(/←/g, "<-")
    .replace(/≈/g, "~")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.replace(/\t/g, " ").split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word;
      } else {
        // very long word: split by character
        let chunk = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
      }
    }
    lines.push(line);
  }
  return lines;
}

type Fonts = { regular: PDFFont; bold: PDFFont; clean: (s: string) => string };

function measure(deckName: string, cards: ExportCard[], fonts: Fonts, s: number) {
  const textW = CONTENT_W - INSET;
  const titleLines = wrap(fonts.clean(deckName), fonts.bold, 20 * s, CONTENT_W);
  const items = cards.map((c, i) => {
    const q = wrap(`${i + 1}. ${fonts.clean(c.front)}`, fonts.bold, 12 * s, textW);
    const a = wrap(fonts.clean(c.back), fonts.regular, 10.5 * s, textW);
    const h = q.length * 16 * s + 6 * s + a.length * 14.5 * s + (c.difficulty ? 16 * s : 0) + 6 * s;
    return { q, a, h, difficulty: c.difficulty };
  });
  const gap = 18 * s;
  const headerH = titleLines.length * 26 * s + 22 * s + 22 * s;
  const total =
    headerH + items.reduce((n, it) => n + it.h, 0) + gap * Math.max(items.length - 1, 0);
  return { titleLines, items, gap, total };
}

/** Builds an A4 PDF of the deck as study notes: one page when it fits, otherwise more. */
export async function buildNotesPdf(deckName: string, cards: ExportCard[]): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setTitle(deckName);
  doc.setCreator("Cards to Study");

  let fonts: Fonts;
  try {
    const [regularBytes, boldBytes] = await Promise.all([
      loadFont("/fonts/NotoSans-Regular.ttf"),
      loadFont("/fonts/NotoSans-Bold.ttf"),
    ]);
    if (!regularBytes || !boldBytes) throw new Error("font files unavailable");
    const fontkit = (await import("@pdf-lib/fontkit")).default;
    doc.registerFontkit(fontkit);
    // subset: false embeds the whole font. Subsetting can drop glyphs and leave letters missing.
    fonts = {
      regular: await doc.embedFont(regularBytes, { subset: false }),
      bold: await doc.embedFont(boldBytes, { subset: false }),
      clean: (t) => t,
    };
  } catch (e) {
    console.warn("Using the built-in font instead:", e);
    fonts = {
      regular: await doc.embedFont(StandardFonts.Helvetica),
      bold: await doc.embedFont(StandardFonts.HelveticaBold),
      clean: toWinAnsi,
    };
  }

  // Shrink the text a little, if needed, so everything stays on one page.
  let s = 1;
  let m = measure(deckName, cards, fonts, s);
  while (m.total > AVAILABLE_H && s > 0.76) {
    s = Math.round((s - 0.04) * 100) / 100;
    m = measure(deckName, cards, fonts, s);
  }
  const onePage = m.total <= AVAILABLE_H;
  if (!onePage) {
    s = 1;
    m = measure(deckName, cards, fonts, s);
  }

  const INK = rgb(0.067, 0.094, 0.153);
  const BODY = rgb(0.216, 0.255, 0.318);
  const MUTED = rgb(0.612, 0.639, 0.686);
  const RULE = rgb(0.9, 0.91, 0.925);
  const VIOLET = rgb(0.427, 0.157, 0.851);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // Title block
  for (const line of m.titleLines) {
    if (line) page.drawText(line, { x: MARGIN, y: y - 20 * s, size: 20 * s, font: fonts.bold, color: INK });
    y -= 26 * s;
  }
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  page.drawText(`${cards.length} flashcard${cards.length === 1 ? "" : "s"} · ${date}`, {
    x: MARGIN,
    y: y - 9 * s,
    size: 9 * s,
    font: fonts.regular,
    color: MUTED,
  });
  y -= 22 * s;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.75, color: RULE });
  y -= 22 * s;

  // Cards
  m.items.forEach((it) => {
    if (!onePage && y - it.h < BOTTOM) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }

    let cy = y;
    for (const l of it.q) {
      cy -= 16 * s;
      if (l) page.drawText(l, { x: MARGIN + INSET, y: cy + 4 * s, size: 12 * s, font: fonts.bold, color: INK });
    }
    cy -= 6 * s;
    for (const l of it.a) {
      cy -= 14.5 * s;
      if (l) page.drawText(l, { x: MARGIN + INSET, y: cy + 3.6 * s, size: 10.5 * s, font: fonts.regular, color: BODY });
    }
    if (it.difficulty) {
      cy -= 16 * s;
      page.drawText(it.difficulty.toUpperCase(), {
        x: MARGIN + INSET,
        y: cy + 4 * s,
        size: 8 * s,
        font: fonts.regular,
        color: MUTED,
      });
    }
    cy -= 6 * s;
    page.drawRectangle({ x: MARGIN, y: cy, width: 3, height: y - cy, color: VIOLET });
    y = cy - m.gap;
  });

  
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText("Cards to Study", { x: MARGIN, y: 28, size: 8, font: fonts.regular, color: MUTED });
    if (pages.length > 1) {
      const label = `Page ${i + 1} of ${pages.length}`;
      p.drawText(label, {
        x: PAGE_W - MARGIN - fonts.regular.widthOfTextAtSize(label, 8),
        y: 28,
        size: 8,
        font: fonts.regular,
        color: MUTED,
      });
    }
  });

  return doc.save();
}

type SavePicker = (options: unknown) => Promise<{
  createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
}>;


export async function savePdf(bytes: Uint8Array, fileName: string): Promise<"saved" | "cancelled"> {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;

  if (picker) {
    let handle: Awaited<ReturnType<SavePicker>> | null = null;
    try {
      handle = await picker.call(window, {
        suggestedName: fileName,
        types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      console.error("Save window unavailable, using a normal download:", e);
    }

    if (handle) {
      try {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return "saved";
      } catch (e) {
        console.error("Couldn't write the file:", e);
        const reason = e instanceof Error ? e.name : "unknown error";
        throw new Error(`Couldn't save the file (${reason}). Please try another folder.`);
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "saved";
}