import type { Database, Section } from "../supabase/types";

export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type TypePrimeRow = Database["public"]["Tables"]["types_primes"]["Row"];
export type ConfigurationPrimeRow =
  Database["public"]["Tables"]["configurations_primes"]["Row"];
export type ConfigurationPrimeArticleRow =
  Database["public"]["Tables"]["configuration_prime_articles"]["Row"];
export type DepenseComplementaireRow =
  Database["public"]["Tables"]["depenses_complementaires"]["Row"];

export interface NiveauLike {
  id: string;
  section: Section;
  code: string;
}

export interface ResultLike {
  school_year_id: string;
  section: Section;
  niveau_depart: string;
  awarded_prizes: readonly string[];
}

export interface TypePrimeLike {
  id: string;
  code: string;
}
