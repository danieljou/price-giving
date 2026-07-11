import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarRange,
  ClipboardPlus,
  UserPlus,
  SlidersHorizontal,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Full destination list — shown in the desktop sidebar. */
export const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/students", label: "Étudiants", icon: Users },
  { href: "/results/new", label: "Saisir un résultat", icon: ClipboardPlus },
  { href: "/laureates", label: "Lauréats", icon: Trophy },
  { href: "/school-years", label: "Années scolaires", icon: CalendarRange },
  { href: "/criteria", label: "Critères", icon: SlidersHorizontal },
];

/** Mobile bottom tab bar — capped at 4 so the total stays at or below 5 with the FAB. */
export const TAB_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/students", label: "Étudiants", icon: Users },
  { href: "/laureates", label: "Lauréats", icon: Trophy },
  { href: "/school-years", label: "Années", icon: CalendarRange },
];

/** Overflow destinations surfaced through the mobile FAB menu. */
export const FAB_NAV_ITEMS: NavItem[] = [
  { href: "/results/new", label: "Saisir un résultat", icon: ClipboardPlus },
  { href: "/students/new", label: "Nouvel étudiant", icon: UserPlus },
  { href: "/criteria", label: "Critères", icon: SlidersHorizontal },
];
