import Link from "next/link";
import { GraduationCap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-4xl font-semibold tracking-tight text-foreground">
              404
            </p>
            <h1 className="mt-2 text-lg font-semibold text-foreground">
              Page introuvable
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              La page que vous recherchez n&apos;existe pas ou a été déplacée.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/">
              <Home aria-hidden="true" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
