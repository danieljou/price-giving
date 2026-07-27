import Link from "next/link";
import { CompassIcon, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Page introuvable"
        description="Ce lien ne correspond à aucune page de l'application."
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <CompassIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">
            Nous n&apos;avons pas trouvé cette page
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Vérifiez l&apos;adresse ou repartez du tableau de bord — utilisez la
            recherche (Ctrl+K) pour retrouver rapidement ce que vous cherchez.
          </p>
          <Button asChild className="mt-2">
            <Link href="/dashboard">
              <LayoutDashboard aria-hidden="true" />
              Retour au tableau de bord
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
