"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, GraduationCap, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ALL_NAV_ITEMS } from "./nav-items";
import { OPEN_COMMAND_MENU_EVENT } from "./command-menu";
import { ThemeToggle } from "./theme-toggle";

interface AppSidebarProps {
  userEmail: string | null;
  isAdmin: boolean;
  onLogout: () => Promise<void>;
}

export function AppSidebar({
  userEmail,
  isAdmin,
  onLogout,
}: Readonly<AppSidebarProps>) {
  const pathname = usePathname();

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "JV";
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">PRICE GIVING</span>
            <span className="truncate text-xs text-muted-foreground">
              Classification des prix
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Rechercher (Ctrl+K)"
                  onClick={() =>
                    window.dispatchEvent(new Event(OPEN_COMMAND_MENU_EVENT))
                  }
                >
                  <Search aria-hidden="true" />
                  <span>Rechercher</span>
                  <kbd className="ml-auto hidden rounded border border-border px-1 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden md:inline">
                    Ctrl+K
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator className="my-2" />
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                {userEmail ?? "Administrateur"}
              </span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={onLogout}>
              <SidebarMenuButton type="submit" tooltip="Déconnexion">
                <LogOut aria-hidden="true" />
                <span>Déconnexion</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
