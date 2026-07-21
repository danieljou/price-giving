"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Section } from "@/lib/supabase/types";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

interface SchoolYearOption {
  id: string;
  label: string;
}

interface LaureatesFiltersProps {
  schoolYears: SchoolYearOption[];
  /** Niveau codes per section, sorted by progression order. */
  niveauxBySection: Record<Section, string[]>;
  effectiveYear?: string;
  filters: {
    year?: string;
    section?: string;
    prize?: string;
    niveau?: string;
  };
}

/** Section drives which niveaux make sense, so picking one resets and
 *  narrows the niveau dropdown instead of leaving it as free text. */
export function LaureatesFilters({
  schoolYears,
  niveauxBySection,
  effectiveYear,
  filters,
}: Readonly<LaureatesFiltersProps>) {
  const [section, setSection] = useState(filters.section ?? "");
  const [niveau, setNiveau] = useState(filters.niveau ?? "");

  const niveauOptions =
    section === "francophone" || section === "anglophone"
      ? niveauxBySection[section]
      : [];

  return (
    <form method="GET" className="flex flex-wrap items-end gap-3">
      <Select name="year" defaultValue={effectiveYear ?? "all"}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les années</SelectItem>
          {schoolYears.map((y) => (
            <SelectItem key={y.id} value={y.id}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        name="section"
        value={section}
        onValueChange={(v) => {
          setSection(v);
          setNiveau("");
        }}
      >
        <SelectTrigger className="w-42.5">
          <SelectValue placeholder="Toutes les sections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="francophone">Francophone</SelectItem>
          <SelectItem value="anglophone">Anglophone</SelectItem>
        </SelectContent>
      </Select>

      <Select name="prize" defaultValue={filters.prize ?? ""}>
        <SelectTrigger className="w-42.5">
          <SelectValue placeholder="Tous les prix" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRIZE_LABELS).map(([code, label]) => (
            <SelectItem key={code} value={code}>
              {label}
            </SelectItem>
          ))}
          <SelectItem value="PENDING">Décision à prendre</SelectItem>
        </SelectContent>
      </Select>

      <Select
        name="niveau"
        value={niveau}
        onValueChange={setNiveau}
        disabled={niveauOptions.length === 0}
      >
        <SelectTrigger className="w-42.5">
          <SelectValue
            placeholder={section ? "Tous les niveaux" : "Choisir une section"}
          />
        </SelectTrigger>
        <SelectContent>
          {niveauOptions.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit">Filtrer</Button>
      {(filters.year || filters.section || filters.prize || filters.niveau) && (
        <Button variant="ghost" asChild>
          <Link href="/laureates">Réinitialiser</Link>
        </Button>
      )}
    </form>
  );
}
