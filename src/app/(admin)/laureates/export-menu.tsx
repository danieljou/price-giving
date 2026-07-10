"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileType, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { niveauRank } from "@/lib/prizes/niveau-order";
import type { LaureateRow } from "./columns";

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
  "Classe départ",
  "Classe arrivée",
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
    row.niveau_depart,
    row.niveau_admission ?? "—",
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

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      toast.success(`Export ${label} généré (${rows.length} lauréats).`);
    } catch (err) {
      console.error(err);
      toast.error(`L'export ${label} a échoué.`);
    } finally {
      setBusy(false);
    }
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
        { wch: 14 },
        { wch: 14 },
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

  async function exportPdf() {
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
        <DropdownMenuItem onClick={() => run("PDF", exportPdf)}>
          <FileText aria-hidden="true" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("Word", exportWord)}>
          <FileType aria-hidden="true" />
          Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("Excel", exportExcel)}>
          <FileSpreadsheet aria-hidden="true" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("CSV", exportCsv)}>
          <FileSpreadsheet aria-hidden="true" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
