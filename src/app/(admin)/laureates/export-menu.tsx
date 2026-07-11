"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, FileType, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { niveauRank } from "@/lib/prizes/niveau-order";
import { classeDisplay, type LaureateRow } from "./columns";

type ExportFormat = "pdf" | "word" | "excel" | "csv";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  csv: "CSV",
};

const FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  pdf: ".pdf",
  word: ".docx",
  excel: ".xlsx",
  csv: ".csv",
};

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

const PRIZE_ORDER = ["SPECIAL", "EXC", "ENC", "EXC_PLUS"];

const HEADERS = [
  "N°",
  "Nom(s) et Prénom(s)",
  "Section",
  "Année",
  "Classe (départ → arrivée)",
  "Moyenne",
  "Rang",
];

interface ExportMenuProps {
  rows: LaureateRow[];
  /** Human label describing the current filter, e.g. "2024-2025". */
  scopeLabel: string;
}

function rowCells(row: LaureateRow, index: number): (string | number)[] {
  return [
    index + 1,
    row.student_name,
    row.section.charAt(0).toUpperCase() + row.section.slice(1),
    row.school_year_label,
    classeDisplay(row),
    row.moyenne != null ? `${row.moyenne}/20` : "—",
    row.rang ?? "—",
  ];
}

/**
 * Ceremony sort: level ascending (SIL before CP...), then within the same
 * level moyenne descending (17 before 16), unranked moyennes last, name as
 * tiebreaker.
 */
function ceremonySort(a: LaureateRow, b: LaureateRow): number {
  const rankDiff = niveauRank(a.niveau_depart) - niveauRank(b.niveau_depart);
  if (rankDiff !== 0) return rankDiff;
  const moyenneA = a.moyenne ?? -1;
  const moyenneB = b.moyenne ?? -1;
  if (moyenneA !== moyenneB) return moyenneB - moyenneA;
  return a.student_name.localeCompare(b.student_name, "fr");
}

/** Groups rows by prize, in ceremony order, mirroring the official document. */
function groupByPrize(rows: LaureateRow[]): [string, LaureateRow[]][] {
  return PRIZE_ORDER.map((code): [string, LaureateRow[]] => [
    code,
    rows.filter((r) => r.awarded_prizes.includes(code)).sort(ceremonySort),
  ]).filter(([, group]) => group.length > 0);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function baseFilename(scopeLabel: string): string {
  const scope = scopeLabel.replaceAll(/[^\w-]+/g, "-");
  return `laureats-${scope}`;
}

export function ExportMenu({ rows, scopeLabel }: Readonly<ExportMenuProps>) {
  const [busy, setBusy] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<ExportFormat | null>(
    null
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Release the PDF blob URL when the preview closes or changes
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function openPreview(format: ExportFormat) {
    setPreviewFormat(format);
    if (format === "pdf") {
      setBusy(true);
      try {
        const doc = await buildPdfDoc();
        setPdfUrl(URL.createObjectURL(doc.output("blob")));
      } catch (err) {
        console.error(err);
        toast.error("Impossible de générer l'aperçu PDF.");
        setPreviewFormat(null);
      } finally {
        setBusy(false);
      }
    }
  }

  function closePreview() {
    setPreviewFormat(null);
    setPdfUrl(null);
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      toast.success(`Export ${label} généré (${rows.length} lauréats).`);
      closePreview();
    } catch (err) {
      console.error(err);
      toast.error(`L'export ${label} a échoué.`);
    } finally {
      setBusy(false);
    }
  }

  function confirmDownload() {
    if (!previewFormat) return;
    const exporters: Record<ExportFormat, () => Promise<void>> = {
      pdf: exportPdf,
      word: exportWord,
      excel: exportExcel,
      csv: exportCsv,
    };
    void run(FORMAT_LABELS[previewFormat], exporters[previewFormat]);
  }

  async function exportCsv() {
    const escape = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
    const sorted = [...rows].sort(ceremonySort);
    const lines = [
      [...HEADERS, "Prix"].map(escape).join(";"),
      ...sorted.map((r, i) =>
        [
          ...rowCells(r, i),
          r.awarded_prizes.map((c) => PRIZE_LABELS[c] ?? c).join(", "),
        ]
          .map(escape)
          .join(";")
      ),
    ];
    // BOM so Excel opens the accented names correctly
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    downloadBlob(blob, `${baseFilename(scopeLabel)}.csv`);
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    for (const [code, group] of groupByPrize(rows)) {
      const data = [HEADERS, ...group.map((r, i) => rowCells(r, i))];
      const sheet = XLSX.utils.aoa_to_sheet(data);
      sheet["!cols"] = [
        { wch: 4 },
        { wch: 34 },
        { wch: 12 },
        { wch: 10 },
        { wch: 24 },
        { wch: 9 },
        { wch: 6 },
      ];
      // Sheet names are capped at 31 chars by the xlsx format
      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        (PRIZE_LABELS[code] ?? code).slice(0, 31)
      );
    }
    XLSX.writeFile(workbook, `${baseFilename(scopeLabel)}.xlsx`);
  }

  async function buildPdfDoc() {
    const [{ jsPDF }, autoTable] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable").then((m) => m.default),
    ]);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REMISE DES PRIX", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Liste des lauréats — ${scopeLabel}`, pageWidth / 2, 26, {
      align: "center",
    });

    let y = 36;
    for (const [code, group] of groupByPrize(rows)) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${PRIZE_LABELS[code] ?? code} (${group.length})`, 14, y);
      autoTable(doc, {
        startY: y + 3,
        head: [HEADERS],
        body: group.map((r, i) => rowCells(r, i).map(String)),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY + 12;
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
    }
    return doc;
  }

  async function exportPdf() {
    const doc = await buildPdfDoc();
    doc.save(`${baseFilename(scopeLabel)}.pdf`);
  }

  async function exportWord() {
    const docx = await import("docx");
    const {
      Document,
      HeadingLevel,
      Packer,
      Paragraph,
      Table,
      TableCell,
      TableRow,
      TextRun,
      WidthType,
      AlignmentType,
    } = docx;

    const makeTable = (group: LaureateRow[]) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: HEADERS.map(
              (h) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: h, bold: true })],
                    }),
                  ],
                })
            ),
          }),
          ...group.map(
            (r, i) =>
              new TableRow({
                children: rowCells(r, i).map(
                  (cell) =>
                    new TableCell({
                      children: [new Paragraph(String(cell))],
                    })
                ),
              })
          ),
        ],
      });

    const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "REMISE DES PRIX", bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Liste des lauréats — ${scopeLabel}` }),
        ],
      }),
      new Paragraph(""),
    ];

    for (const [code, group] of groupByPrize(rows)) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: `${PRIZE_LABELS[code] ?? code} (${group.length})`,
              bold: true,
            }),
          ],
        }),
        makeTable(group),
        new Paragraph("")
      );
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${baseFilename(scopeLabel)}.docx`);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={busy || rows.length === 0}>
            {busy ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {rows.length} lauréat{rows.length > 1 ? "s" : ""}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openPreview("pdf")}>
            <FileText aria-hidden="true" />
            PDF (.pdf)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openPreview("word")}>
            <FileType aria-hidden="true" />
            Word (.docx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openPreview("excel")}>
            <FileSpreadsheet aria-hidden="true" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openPreview("csv")}>
            <FileSpreadsheet aria-hidden="true" />
            CSV (.csv)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={previewFormat !== null}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Aperçu — export {previewFormat ? FORMAT_LABELS[previewFormat] : ""}
            </DialogTitle>
            <DialogDescription>
              {rows.length} lauréat{rows.length > 1 ? "s" : ""} · {scopeLabel} ·
              fichier {baseFilename(scopeLabel)}
              {previewFormat ? FORMAT_EXTENSIONS[previewFormat] : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1">
            {previewFormat === "pdf" &&
              (pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="Aperçu du document PDF"
                  className="h-[60vh] w-full rounded-md border border-border"
                />
              ) : (
                <div className="flex h-[60vh] items-center justify-center rounded-md border border-border">
                  <Loader2
                    className="size-6 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Génération de l&apos;aperçu…</span>
                </div>
              ))}

            {previewFormat && previewFormat !== "pdf" && (
              <ScrollArea className="h-[60vh] rounded-md border border-border">
                <div className="p-4">
                  <HtmlPreview rows={rows} format={previewFormat} />
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePreview} disabled={busy}>
              Annuler
            </Button>
            <Button onClick={confirmDownload} disabled={busy}>
              {busy ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Download aria-hidden="true" />
              )}
              Télécharger{" "}
              {previewFormat ? FORMAT_EXTENSIONS[previewFormat] : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Faithful HTML rendering of what the exported file will contain: grouped
 *  prize tables for Word/Excel (one table per sheet/section), a flat table
 *  with a Prix column for CSV. */
function HtmlPreview({
  rows,
  format,
}: Readonly<{ rows: LaureateRow[]; format: "word" | "excel" | "csv" }>) {
  if (format === "csv") {
    const sorted = [...rows].sort(ceremonySort);
    return (
      <PreviewTable
        headers={[...HEADERS, "Prix"]}
        body={sorted.map((r, i) => [
          ...rowCells(r, i),
          r.awarded_prizes.map((c) => PRIZE_LABELS[c] ?? c).join(", "),
        ])}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {format === "word" && (
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">REMISE DES PRIX</p>
          <p className="text-sm text-muted-foreground">Liste des lauréats</p>
        </div>
      )}
      {groupByPrize(rows).map(([code, group]) => (
        <section key={code}>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {PRIZE_LABELS[code] ?? code} ({group.length})
            {format === "excel" && (
              <span className="ml-2 font-normal text-muted-foreground">
                — feuille dédiée
              </span>
            )}
          </h3>
          <PreviewTable
            headers={HEADERS}
            body={group.map((r, i) => rowCells(r, i))}
          />
        </section>
      ))}
    </div>
  );
}

function PreviewTable({
  headers,
  body,
}: Readonly<{ headers: string[]; body: (string | number)[][] }>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="border border-border bg-primary px-2 py-1.5 text-left font-semibold text-primary-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((cells, rowIdx) => (
            // Row order is stable for a given export snapshot
             
            <tr key={rowIdx} className="even:bg-muted/50">
              {cells.map((cell, cellIdx) => (
                 
                <td key={cellIdx} className="border border-border px-2 py-1">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
