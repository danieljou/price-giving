import { findExistingStudent } from "@/lib/students/duplicate";
import type { Section } from "@/lib/supabase/types";

export interface SchoolYearOption {
  id: string;
  label: string;
}

export interface ExistingStudent {
  id: string;
  first_name: string;
  last_name: string;
  section: Section;
}

export interface ImportRow {
  rowNumber: number;
  first_name: string;
  last_name: string;
  section: Section | null;
  school_year_id: string | null;
  school_year_label: string;
  niveau_depart: string;
  niveau_admission: string | null;
  classe_texte: string | null;
  moyenne: number | null;
  rang: number | null;
  errors: string[];
  duplicateStudentId: string | null;
}

/** Raw row as produced by XLSX.utils.sheet_to_json — French column headers. */
export type RawImportRow = Record<string, unknown>;

function str(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

export function validateRow(
  raw: RawImportRow,
  rowNumber: number,
  schoolYears: readonly SchoolYearOption[],
  niveauxBySection: ReadonlyMap<Section, ReadonlySet<string>>,
  existingStudents: readonly ExistingStudent[]
): ImportRow {
  const errors: string[] = [];

  const first_name = str(raw["Prénom"]);
  const last_name = str(raw["Nom"]);
  if (!first_name) errors.push("Prénom manquant");
  if (!last_name) errors.push("Nom manquant");

  const sectionRaw = str(raw["Section"]).toLowerCase();
  const section: Section | null =
    sectionRaw === "francophone" || sectionRaw === "anglophone"
      ? sectionRaw
      : null;
  if (!section) errors.push("Section invalide (francophone ou anglophone)");

  const yearLabel = str(raw["Année scolaire"]);
  const schoolYear = schoolYears.find((y) => y.label === yearLabel);
  if (!yearLabel) errors.push("Année scolaire manquante");
  else if (!schoolYear) errors.push(`Année scolaire "${yearLabel}" introuvable`);

  const niveauDepart = str(raw["Niveau de départ"]);
  const niveauAdmission = str(raw["Niveau d'admission"]) || null;
  if (!niveauDepart) {
    errors.push("Niveau de départ manquant");
  } else if (section) {
    const known = niveauxBySection.get(section);
    if (known && !known.has(niveauDepart)) {
      errors.push(`Niveau de départ "${niveauDepart}" inconnu pour ${section}`);
    }
    if (niveauAdmission && known && !known.has(niveauAdmission)) {
      errors.push(`Niveau d'admission "${niveauAdmission}" inconnu pour ${section}`);
    }
  }

  const classeTexte = str(raw["Classe"]) || null;

  let moyenne: number | null = null;
  const moyenneRaw = raw["Moyenne"];
  if (moyenneRaw !== undefined && moyenneRaw !== null && moyenneRaw !== "") {
    const n = Number(moyenneRaw);
    if (!Number.isFinite(n) || n < 0 || n > 20) {
      errors.push("Moyenne invalide (doit être entre 0 et 20)");
    } else {
      moyenne = n;
    }
  }

  let rang: number | null = null;
  const rangRaw = raw["Rang"];
  if (rangRaw !== undefined && rangRaw !== null && rangRaw !== "") {
    const n = Number(rangRaw);
    if (!Number.isInteger(n) || n <= 0) {
      errors.push("Rang invalide (entier positif attendu)");
    } else {
      rang = n;
    }
  }

  const duplicate =
    section && first_name && last_name
      ? findExistingStudent({ first_name, last_name, section }, existingStudents)
      : undefined;

  return {
    rowNumber,
    first_name,
    last_name,
    section,
    school_year_id: schoolYear?.id ?? null,
    school_year_label: yearLabel,
    niveau_depart: niveauDepart,
    niveau_admission: niveauAdmission,
    classe_texte: classeTexte,
    moyenne,
    rang,
    errors,
    duplicateStudentId: duplicate?.id ?? null,
  };
}
