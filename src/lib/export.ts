export type ExportCard = { front: string; back: string; difficulty?: string };

function slug(name: string) {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
    "flashcards"
  );
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMarkdown(deckName: string, cards: ExportCard[]) {
  const lines = [`# ${deckName}`, "", `${cards.length} flashcards`, ""];
  cards.forEach((c, i) => {
    lines.push(`## ${i + 1}. ${c.front}`, "", c.back, "");
    if (c.difficulty) lines.push(`*Difficulty: ${c.difficulty}*`, "");
  });
  return lines.join("\n");
}

export function downloadMarkdown(deckName: string, cards: ExportCard[]) {
  const blob = new Blob([buildMarkdown(deckName, cards)], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(deckName)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


export function printAsPdf(deckName: string, cards: ExportCard[]) {
  const body = cards
    .map(
      (c, i) => `<div class="card">
        <p class="q">${i + 1}. ${esc(c.front)}</p>
        <p class="a">${esc(c.back)}</p>
        ${c.difficulty ? `<p class="d">${esc(c.difficulty)}</p>` : ""}
      </div>`
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(deckName)}</title>
  <style>
    body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#111827;margin:32px;line-height:1.5}
    h1{font-size:22px;margin:0 0 4px} .meta{color:#6b7280;font-size:12px;margin:0 0 24px}
    .card{border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:12px;break-inside:avoid}
    .q{font-weight:600;margin:0 0 6px} .a{margin:0;color:#374151;font-size:14px}
    .d{margin:8px 0 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  </style></head><body>
  <h1>${esc(deckName)}</h1>
  <p class="meta">${cards.length} flashcards · Cards to Study</p>${body}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  if (!win) return;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onafterprint = () => iframe.remove();
  setTimeout(() => iframe.remove(), 120_000);
  setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
}