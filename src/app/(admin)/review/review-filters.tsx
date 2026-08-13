"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SchoolYearOption {
  id: string;
  label: string;
}

interface ReviewFiltersProps {
  schoolYears: SchoolYearOption[];
  effectiveYear?: string;
  filters: { year?: string };
}

/** Year scope for the review queue — same GET-form pattern as the laureates
 *  page filters, so a pending item from a past year doesn't linger in the
 *  current year's queue by default. */
export function ReviewFilters({
  schoolYears,
  effectiveYear,
  filters,
}: Readonly<ReviewFiltersProps>) {
  return (
    <form
      method="GET"
      className="flex flex-wrap items-end gap-3 bg-white rounded-md p-8 my-5"
    >
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

      <Button type="submit">Filtrer</Button>
      {filters.year && (
        <Button variant="ghost" asChild>
          <Link href="/review">Réinitialiser</Link>
        </Button>
      )}
    </form>
  );
}
