"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  Tags,
} from "lucide-react";
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
import { niveauCycle, type Cycle } from "@/lib/prizes/niveau-cycle";
import { classeDisplay, type LaureateRow } from "./columns";
import { buildSummary, formatSummaryCell } from "./summary";

type ExportFormat = "pdf" | "word" | "excel" | "csv";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  csv: "CSV",
};

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

const PRIZE_ORDER = ["SPECIAL", "EXC", "ENC", "EXC_PLUS"];

/** One accent color per prize, shared by the PDF/Word section headers. */
const PRIZE_COLORS: Record<string, { rgb: [number, number, number]; hex: string }> = {
  SPECIAL: { rgb: [124, 58, 237], hex: "7C3AED" },
  EXC: { rgb: [217, 119, 6], hex: "D97706" },
  ENC: { rgb: [13, 148, 136], hex: "0D9488" },
  EXC_PLUS: { rgb: [30, 64, 175], hex: "1E40AF" },
};

const SEPARATOR_GRAY_RGB: [number, number, number] = [229, 231, 235];
const SEPARATOR_GRAY_HEX = "E5E7EB";
const EMPHASIS_GRAY_RGB: [number, number, number] = [229, 231, 235];
const EMPHASIS_GRAY_HEX = "E5E7EB";
const GRAND_TOTAL_GRAY_RGB: [number, number, number] = [209, 213, 219];
const GRAND_TOTAL_GRAY_HEX = "D1D5DB";

const HEADERS = [
  "N°",
  "Nom(s) et Prénom(s)",
  "Section",
  "Année",
  "Classe (départ → arrivée)",
  "Moyenne",
  "Rang",
  "Notes",
];

interface ExportMenuProps {
  rows: LaureateRow[];
  /** Human label describing the current filter, e.g. "2024-2025". */
  scopeLabel: string;
}

// jsPDF's standard fonts only support WinAnsi (roughly CP1252), which has no
// glyph for "→" — it renders as garbage in the PDF export. Word/Excel/CSV use
// real Unicode fonts so they keep the arrow untouched.
function pdfSafe(text: string): string {
  return text.replaceAll("→", "->");
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
    row.notes ?? "",
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

type GroupItem =
  | { separator: false; row: LaureateRow; index: number }
  | { separator: true };

/** Marks every point where consecutive rows cross from one teaching cycle
 *  into the next (e.g. Primaire → Secondaire), so renderers can insert a
 *  visual break there. */
function withCycleSeparators(group: LaureateRow[]): GroupItem[] {
  const items: GroupItem[] = [];
  let previousCycle: Cycle | null | undefined;
  group.forEach((row, index) => {
    const cycle = niveauCycle(row.niveau_depart);
    if (previousCycle !== undefined && cycle !== previousCycle) {
      items.push({ separator: true });
    }
    items.push({ separator: false, row, index });
    previousCycle = cycle;
  });
  return items;
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
        { wch: 24 },
        { wch: 9 },
        { wch: 6 },
        { wch: 30 },
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const lastAutoTableY = () =>
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY;

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

      const body = withCycleSeparators(group).map((item) =>
        item.separator
          ? [
              {
                content: "",
                colSpan: HEADERS.length,
                styles: { fillColor: SEPARATOR_GRAY_RGB, minCellHeight: 2 },
              },
            ]
          : rowCells(item.row, item.index).map((c) => pdfSafe(String(c)))
      );

      autoTable(doc, {
        startY: y + 3,
        head: [HEADERS.map(pdfSafe)],
        body,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: PRIZE_COLORS[code]?.rgb ?? [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      });
      y = lastAutoTableY() + 12;
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
    }

    // Synthèse — prize x cycle breakdown, mirroring the official summary sheet
    const summary = buildSummary(rows);
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Synthèse", 14, y);

    autoTable(doc, {
      startY: y + 3,
      head: [["", ...summary.cycles, "TOTAL"]],
      body: summary.rows.map((r) => [
        r.label,
        ...r.values.map(formatSummaryCell),
        String(r.total),
      ]),
      styles: { fontSize: 8, cellPadding: 2, halign: "center" },
      columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const label = summary.rows[data.row.index]?.label;
        if (label === "Total 1" || label === "Total 2") {
          data.cell.styles.fillColor = EMPHASIS_GRAY_RGB;
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = lastAutoTableY() + 6;

    autoTable(doc, {
      startY: y,
      body: [
        [
          {
            content: "TOTAL",
            colSpan: summary.cycles.length + 1,
            styles: { halign: "left", fontStyle: "bold" },
          },
          String(summary.grandTotal),
        ],
      ],
      styles: {
        fontSize: 9,
        cellPadding: 3,
        fillColor: GRAND_TOTAL_GRAY_RGB,
        fontStyle: "bold",
        halign: "center",
      },
      margin: { left: 14, right: 14 },
    });

    return doc;
  }

  async function exportPdf() {
    const doc = await buildPdfDoc();
    doc.save(`${baseFilename(scopeLabel)}.pdf`);
  }

  /**
   * Adhesive name-tag sheet: one label per laureate, N° matching the exact
   * numbering used in the main PDF (same prize grouping + ceremony sort),
   * so a physical label can be matched back to that list at the ceremony.
   */
  async function buildLabelsDoc() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF(); // a4, mm — same defaults as buildPdfDoc
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 10;
    const cols = 3;
    const linesPerPage = 8;
    const gap = 2;
    const cellW = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
    const cellH =
      (pageHeight - margin * 2 - gap * (linesPerPage - 1)) / linesPerPage;

    const items = groupByPrize(rows).flatMap(([code, group]) =>
      group.map((row, index) => ({ code, row, number: index + 1 }))
    );

    let col = 0;
    let labelRow = 0;
    let isFirstCell = true;

    for (const item of items) {
      if (col === 0 && labelRow === 0 && !isFirstCell) {
        doc.addPage();
      }
      isFirstCell = false;

      const x = margin + col * (cellW + gap);
      const y = margin + labelRow * (cellH + gap);
      const [r, g, b] = PRIZE_COLORS[item.code]?.rgb ?? [30, 64, 175];

      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cellW, cellH, 2, 2, "S");
      doc.setFillColor(r, g, b);
      doc.rect(x, y, 3, cellH, "F");

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(`N° ${item.number}`, x + cellW / 2, y + cellH * 0.34, {
        align: "center",
      });

      doc.setFontSize(10);
      const nameLines = doc.splitTextToSize(
        item.row.student_name,
        cellW - 8
      ) as string[];
      nameLines.slice(0, 2).forEach((nameLine, li) => {
        doc.text(nameLine, x + cellW / 2, y + cellH * 0.58 + li * 4.2, {
          align: "center",
        });
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(r, g, b);
      doc.text(
        PRIZE_LABELS[item.code] ?? item.code,
        x + cellW / 2,
        y + cellH * 0.88,
        { align: "center" }
      );

      col++;
      if (col >= cols) {
        col = 0;
        labelRow++;
        if (labelRow >= linesPerPage) labelRow = 0;
      }
    }

    return doc;
  }

  async function exportLabels() {
    const doc = await buildLabelsDoc();
    doc.save(`${baseFilename(scopeLabel)}-etiquettes.pdf`);
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
      ShadingType,
    } = docx;

    const headerCell = (text: string, hex: string) =>
      new TableCell({
        shading: { fill: hex, type: ShadingType.CLEAR, color: "auto" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
          }),
        ],
      });

    const separatorRow = () =>
      new TableRow({
        children: [
          new TableCell({
            columnSpan: HEADERS.length,
            shading: {
              fill: SEPARATOR_GRAY_HEX,
              type: ShadingType.CLEAR,
              color: "auto",
            },
            children: [new Paragraph("")],
          }),
        ],
      });

    const makeTable = (code: string, group: LaureateRow[]) => {
      const color = PRIZE_COLORS[code]?.hex ?? "1E40AF";
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: HEADERS.map((h) => headerCell(h, color)),
          }),
          ...withCycleSeparators(group).map((item) =>
            item.separator
              ? separatorRow()
              : new TableRow({
                  children: rowCells(item.row, item.index).map(
                    (cell) =>
                      new TableCell({
                        children: [new Paragraph(String(cell))],
                      })
                  ),
                })
          ),
        ],
      });
    };

    const summaryCell = (text: string, emphasis: boolean, center = false) =>
      new TableCell({
        shading: emphasis
          ? { fill: EMPHASIS_GRAY_HEX, type: ShadingType.CLEAR, color: "auto" }
          : undefined,
        children: [
          new Paragraph({
            alignment: center ? AlignmentType.CENTER : undefined,
            children: [new TextRun({ text, bold: emphasis })],
          }),
        ],
      });

    const summary = buildSummary(rows);
    const summaryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ["", ...summary.cycles, "TOTAL"].map((h) =>
            headerCell(h, "1E40AF")
          ),
        }),
        ...summary.rows.map(
          (r) =>
            new TableRow({
              children: [
                summaryCell(r.label, !!r.emphasis),
                ...r.values.map((v) =>
                  summaryCell(formatSummaryCell(v), !!r.emphasis, true)
                ),
                summaryCell(String(r.total), true, true),
              ],
            })
        ),
        new TableRow({
          children: [
            new TableCell({
              columnSpan: summary.cycles.length + 1,
              shading: {
                fill: GRAND_TOTAL_GRAY_HEX,
                type: ShadingType.CLEAR,
                color: "auto",
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "TOTAL", bold: true })],
                }),
              ],
            }),
            new TableCell({
              shading: {
                fill: GRAND_TOTAL_GRAY_HEX,
                type: ShadingType.CLEAR,
                color: "auto",
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: String(summary.grandTotal),
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
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
        makeTable(code, group),
        new Paragraph("")
      );
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Synthèse", bold: true })],
      }),
      summaryTable
    );

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
        <DropdownMenuItem
          onClick={() => void run(FORMAT_LABELS.pdf, exportPdf)}
        >
          <FileText aria-hidden="true" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void run(FORMAT_LABELS.word, exportWord)}
        >
          <FileType aria-hidden="true" />
          Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void run(FORMAT_LABELS.excel, exportExcel)}
        >
          <FileSpreadsheet aria-hidden="true" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void run(FORMAT_LABELS.csv, exportCsv)}
        >
          <FileSpreadsheet aria-hidden="true" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void run("Étiquettes", exportLabels)}
        >
          <Tags aria-hidden="true" />
          Étiquettes (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

