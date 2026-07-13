"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Laptop },
] as const;

const noopSubscribe = () => () => {};

/** True only once mounted on the client — avoids a useEffect+setState pair
 *  (flagged by the compiler as a render-cascade risk) for the classic
 *  "don't render the resolved theme before hydration" guard. */
function useIsMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** Shared state: current resolved icon + the dropdown's option list, reused
 *  by both trigger presentations (sidebar row, FAB sheet row). */
function useThemeToggleState() {
  const { theme, setTheme } = useTheme();
  // Avoid rendering the resolved theme before hydration (next-themes reads
  // localStorage only on the client) to prevent a server/client mismatch.
  const mounted = useIsMounted();

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
  const Icon = mounted ? current.icon : Laptop;

  return { theme, setTheme, mounted, Icon };
}

function ThemeOptionsList({
  mounted,
  theme,
  setTheme,
}: Readonly<{
  mounted: boolean;
  theme: string | undefined;
  setTheme: (value: string) => void;
}>) {
  return (
    <>
      {OPTIONS.map((option) => (
        <DropdownMenuItem key={option.value} onClick={() => setTheme(option.value)}>
          <option.icon aria-hidden="true" />
          {option.label}
          {mounted && theme === option.value && (
            <Check className="ml-auto size-3.5" aria-hidden="true" />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}

/** Desktop sidebar entry. */
export function ThemeToggle() {
  const { theme, setTheme, mounted, Icon } = useThemeToggleState();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton tooltip="Thème">
          <Icon aria-hidden="true" />
          <span>Thème</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <ThemeOptionsList mounted={mounted} theme={theme} setTheme={setTheme} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile FAB sheet entry — matches the plain-row styling of its siblings. */
export function ThemeToggleFabRow() {
  const { theme, setTheme, mounted, Icon } = useThemeToggleState();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
          Thème
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <ThemeOptionsList mounted={mounted} theme={theme} setTheme={setTheme} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
