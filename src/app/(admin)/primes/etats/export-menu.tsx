"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";
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
import { formatMontant } from "@/lib/primes/format";
import type {
  ArticleSummaryRow,
  ConfigDetailRow,
  DepenseExportRow,
  RecapTotals,
} from "./types";

interface ExportMenuProps {
  scopeLabel: string;
  configDetail: ConfigDetailRow[];
  articleSummary: ArticleSummaryRow[];
  depenses: DepenseExportRow[];
  recap: RecapTotals;
}

function baseFilename(scopeLabel: string): string {
  return `primes-${scopeLabel.replaceAll(/[^\w-]+/g, "-")}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportMenu({
  scopeLabel,
  configDetail,
  articleSummary,
  depenses,
  recap,
}: Readonly<ExportMenuProps>) {
  const [busy, setBusy] = useState(false);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      toast.success(`${label} généré.`);
    } catch (err) {
      console.error(err);
      toast.error(`L'export ${label} a échoué.`);
    } finally {
      setBusy(false);
    }
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
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CONFIGURATION DES PRIMES", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Session ${scopeLabel}`, pageWidth / 2, 26, { align: "center" });

    let y = 36;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Configuration détaillée", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Niveau", "Type de prime", "Article", "Qté", "Prix", "Montant"]],
      body: configDetail.map((r) => [
        r.niveau,
        r.typePrime,
        r.article,
        String(r.quantite),
        formatMontant(r.prixSession),
        formatMontant(r.montant),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    });
    y = lastAutoTableY() + 12;

    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Liste détaillée des articles", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Article", "Quantité totale", "Montant"]],
      body: articleSummary.map((r) => [
        r.article,
        String(r.quantiteTotale),
        formatMontant(r.montantTotal),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontSize: 8 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    });
    y = lastAutoTableY() + 12;

    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dépenses complémentaires", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Libellé", "Catégorie", "Montant", "Observation"]],
      body: depenses.map((r) => [r.libelle, r.categorie, formatMontant(r.montant), r.observation ?? "—"]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 8 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    });
    y = lastAutoTableY() + 12;

    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("État récapitulatif", 14, y);
    autoTable(doc, {
      startY: y + 3,
      body: [
        ["Nombre total de bénéficiaires", String(recap.totalBeneficiaires)],
        ["Budget des primes", formatMontant(recap.budgetPrimes)],
        ["Dépenses complémentaires", formatMontant(recap.depensesComplementaires)],
        ["Budget global", formatMontant(recap.budgetGlobal)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold" } },
      didParseCell: (data) => {
        if (data.row.index === 3) {
          data.cell.styles.fillColor = [209, 213, 219];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 14, right: 14 },
    });

    return doc;
  }

  async function exportPdf() {
    const doc = await buildPdfDoc();
    doc.save(`${baseFilename(scopeLabel)}.pdf`);
  }

  async function printPdf() {
    const doc = await buildPdfDoc();
    window.open(doc.output("bloburl") as string, "_blank");
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    const configSheet = XLSX.utils.aoa_to_sheet([
      ["Niveau", "Type de prime", "Article", "Quantité", "Prix", "Montant"],
      ...configDetail.map((r) => [r.niveau, r.typePrime, r.article, r.quantite, r.prixSession, r.montant]),
    ]);
    XLSX.utils.book_append_sheet(workbook, configSheet, "Configuration");

    const articleSheet = XLSX.utils.aoa_to_sheet([
      ["Article", "Quantité totale", "Montant"],
      ...articleSummary.map((r) => [r.article, r.quantiteTotale, r.montantTotal]),
    ]);
    XLSX.utils.book_append_sheet(workbook, articleSheet, "Articles");

    const depenseSheet = XLSX.utils.aoa_to_sheet([
      ["Libellé", "Catégorie", "Montant", "Observation"],
      ...depenses.map((r) => [r.libelle, r.categorie, r.montant, r.observation ?? ""]),
    ]);
    XLSX.utils.book_append_sheet(workbook, depenseSheet, "Dépenses");

    const recapSheet = XLSX.utils.aoa_to_sheet([
      ["Indicateur", "Valeur"],
      ["Nombre total de bénéficiaires", recap.totalBeneficiaires],
      ["Budget des primes", recap.budgetPrimes],
      ["Dépenses complémentaires", recap.depensesComplementaires],
      ["Budget global", recap.budgetGlobal],
    ]);
    XLSX.utils.book_append_sheet(workbook, recapSheet, "Récapitulatif");

    XLSX.writeFile(workbook, `${baseFilename(scopeLabel)}.xlsx`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Session {scopeLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void run("PDF", exportPdf)}>
          <FileText aria-hidden="true" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void run("Excel", exportExcel)}>
          <FileSpreadsheet aria-hidden="true" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void run("Impression", printPdf)}>
          <Printer aria-hidden="true" />
          Impression directe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
