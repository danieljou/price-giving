import { createClient } from "@/lib/supabase/server";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { FabMenu } from "@/components/nav/fab-menu";
import { CommandMenu, HeaderSearchButton } from "@/components/nav/command-menu";
import { ThemeToggleHeaderButton } from "@/components/nav/theme-toggle";
import { logout } from "./actions";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "JV";
  // const _displayName = user?.email
  //   ? user.email.split("@")[0].replace(/[._-]/g, " ")
  //   : "Administrateur";

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user?.email ?? null} onLogout={logout} />
      <SidebarInset className="relative isolate overflow-x-hidden">
        {/* Hero banner — tall brand band, gradient derived from --primary
            (never a new color), sits behind the header row + greeting. */}
        <div
          className="absolute inset-x-0 top-0 z-0 h-72   bg-linear-to-br from-(--hero-gradient-from) to-(--hero-gradient-to) sm:h-72 md:h-80"
          aria-hidden="true"
        />
        {/* Hero illustration — the dominant visual on the banner; the
            gradient above is only its supporting backdrop. */}
        <div
          className="absolute inset-x-0 top-0 z-0 h-72 bg-[url('/hero-illustration.svg')] bg-cover bg-center opacity-90 sm:h-72 md:h-80"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col text-primary-foreground">
          {/* Icon row — mobile */}
          <header className="flex h-14 items-center justify-between px-4 md:hidden">
            <span className="font-semibold">PRICE GIVING</span>
            <div className="flex items-center gap-1">
              <HeaderSearchButton />
              <ThemeToggleHeaderButton />
              <Avatar size="sm">
                <AvatarFallback className="bg-primary-foreground/15 text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Icon row — desktop */}
          <header className="hidden h-20 items-center justify-between gap-2 px-6 md:flex md:px-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                aria-label="Replier ou déplier le menu"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              />
              <Separator
                orientation="vertical"
                className="h-4 bg-primary-foreground/20"
              />
              <span className="text-sm text-primary-foreground/80">
                Classification des prix
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <HeaderSearchButton />
              <ThemeToggleHeaderButton />
              <Avatar>
                <AvatarFallback className="bg-primary-foreground/15 text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Greeting — global, page-agnostic; fills the tall banner so it
              never reads as an empty color band. */}
          <div className="px-4 pt-2 pb-10 md:px-10 md:pb-14">
            <p className="text-xl font-semibold capitalize md:text-2xl">
              Bonjour
            </p>
            <p className="mt-1 text-sm text-primary-foreground/70 md:text-base">
              Voici un aperçu de votre activité aujourd&apos;hui
            </p>
          </div>
        </div>

        {/* Content — pulled up over the banner's tail (negative margin +
            higher z-index) so the page's own cards float over the hero
            header, exactly like the reference layout. */}
        <div className="relative z-10 -mt-10 px-4 pt-6 pb-24 sm:-mt-14 md:-mt-20 md:px-8 md:pt-8 md:pb-8">
          {children}
        </div>
      </SidebarInset>

      <BottomTabBar />
      <FabMenu onLogout={logout} />
      <CommandMenu />
    </SidebarProvider>
  );
}
