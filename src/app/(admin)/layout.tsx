import { createClient } from "@/lib/supabase/server";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { FabMenu } from "@/components/nav/fab-menu";
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

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user?.email ?? null} onLogout={logout} />
      <SidebarInset>
        <header className="flex h-14 items-center border-b border-border px-4 md:hidden">
          <span className="font-semibold text-foreground">PRICE GIVING</span>
        </header>
        <header className="hidden h-12 items-center gap-2 border-b border-border px-4 md:flex">
          <SidebarTrigger aria-label="Replier ou déplier le menu" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground">
            Classification des prix
          </span>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </SidebarInset>

      <BottomTabBar />
      <FabMenu onLogout={logout} />
    </SidebarProvider>
  );
}
