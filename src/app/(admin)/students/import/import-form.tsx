"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Download, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Section } from "@/lib/supabase/types";
import { importRows, type ImportRowInput, type ImportSummary } from "./actions";
import {
  validateRow,
  type ExistingStudent,
  type ImportRow,
  type SchoolYearOption,
  type RawImportRow,
} from "./validate-row";

const TEMPLATE_HEADERS = [
  "Nom",
  "Prénom",
  "Section",
  "Année scolaire",
  "Niveau de départ",
  "Niveau d'admission",
  "Classe",
  "Moyenne",
  "Rang",
];

const TEMPLATE_EXAMPLE = [
  "NGONO",
  "Marie",
  "francophone",
  "2024-2025",
  "CM1",
  "CM2",
  "CM1 → CM2",
  "15.5",
  "3",
];

interface ImportFormProps {
  schoolYears: SchoolYearOption[];
  niveauxBySection: Record<Section, string[]>;
  existingStudents: ExistingStudent[];
}

export function ImportForm({
  schoolYears,
  niveauxBySection,
  existingStudents,
}: Readonly<ImportFormProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const niveauSets: ReadonlyMap<Section, ReadonlySet<string>> = new Map([
    ["francophone", new Set(niveauxBySection.francophone)],
    ["anglophone", new Set(niveauxBySection.anglophone)],
  ]);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
    sheet["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 16 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Import");
    XLSX.writeFile(workbook, "modele-import-etudiants.xlsx");
  }

  async function handleFile(file: File) {
    setIsParsing(true);
    setSummary(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<RawImportRow>(sheet, {
        defval: "",
      });

      const validated = raw.map((r, i) =>
        validateRow(r, i + 2, schoolYears, niveauSets, existingStudents)
      );
      setRows(validated);
      if (validated.length === 0) {
        toast.error("Le fichier ne contient aucune ligne exploitable.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de lire ce fichier. Vérifiez le format (.xlsx ou .csv).");
    } finally {
      setIsParsing(false);
    }
  }

  function confirmImport() {
    const payload: ImportRowInput[] = validRows.map((r) => ({
      first_name: r.first_name,
      last_name: r.last_name,
      section: r.section!,
      school_year_id: r.school_year_id!,
      niveau_depart: r.niveau_depart,
      niveau_admission: r.niveau_admission,
      classe_texte: r.classe_texte,
      moyenne: r.moyenne,
      rang: r.rang,
    }));

    startTransition(async () => {
      const result = await importRows(payload);
      setSummary(result);
      setRows([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (result.rowErrors.length === 0) {
        toast.success(
          `Import terminé : ${result.studentsCreated} étudiant(s) créé(s), ${result.resultsCreated + result.resultsUpdated} résultat(s) enregistré(s).`
        );
      } else {
        toast.warning(
          `Import terminé avec ${result.rowErrors.length} erreur(s) — voir le détail ci-dessous.`
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Modèle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Téléchargez le modèle, remplissez une ligne par résultat, puis
            importez le fichier ci-dessous. Les niveaux doivent correspondre
            exactement à ceux utilisés dans le formulaire de saisie.
          </p>
          <Button variant="outline" onClick={() => void downloadTemplate()} className="w-fit">
            <Download aria-hidden="true" />
            Télécharger le modèle (.xlsx)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Importer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            aria-label="Fichier à importer"
            className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {isParsing && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Lecture du fichier…
            </p>
          )}

          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  {validRows.length} ligne{validRows.length > 1 ? "s" : ""}{" "}
                  valide{validRows.length > 1 ? "s" : ""}
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3.5" aria-hidden="true" />
                    {invalidRows.length} en erreur
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[420px] rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ligne</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Année</TableHead>
                      <TableHead>Niveaux</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.rowNumber}>
                        <TableCell className="font-mono text-xs">
                          {r.rowNumber}
                        </TableCell>
                        <TableCell>
                          {r.last_name} {r.first_name}
                          {r.duplicateStudentId && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              (existant)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {r.section ?? "—"}
                        </TableCell>
                        <TableCell>{r.school_year_label || "—"}</TableCell>
                        <TableCell>
                          {r.niveau_depart || "—"}
                          {r.niveau_admission ? ` → ${r.niveau_admission}` : ""}
                        </TableCell>
                        <TableCell>
                          {r.errors.length === 0 ? (
                            <Badge variant="secondary">OK</Badge>
                          ) : (
                            <span className="text-xs text-destructive">
                              {r.errors.join(" · ")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  onClick={confirmImport}
                  disabled={isPending || validRows.length === 0}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload aria-hidden="true" />
                  )}
                  Confirmer l&apos;import ({validRows.length})
                </Button>
              </div>
            </>
          )}

          {summary && (
            <Alert variant={summary.rowErrors.length > 0 ? "destructive" : "default"}>
              <AlertDescription>
                <p className="font-medium text-foreground">
                  {summary.studentsCreated} étudiant(s) créé(s) ·{" "}
                  {summary.resultsCreated} résultat(s) créé(s) ·{" "}
                  {summary.resultsUpdated} résultat(s) mis à jour
                </p>
                {summary.rowErrors.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {summary.rowErrors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
