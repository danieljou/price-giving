"use client";

import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteStudent } from "./actions";

export function DeleteStudentButton({
  studentId,
  studentName,
  hasResults,
}: Readonly<{
  studentId: string;
  studentName: string;
  hasResults: boolean;
}>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    startTransition(async () => {
      const result = await deleteStudent(studentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Étudiant « ${studentName} » supprimé.`);
      router.push("/students");
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer l&apos;étudiant</DialogTitle>
          <DialogDescription>
            {hasResults
              ? `Cet étudiant a encore des résultats. Ils seront supprimés automatiquement avant la suppression de ${studentName}.`
              : `La fiche de ${studentName} sera supprimée. Cette action est irréversible.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" type="button">
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Confirmer la suppression
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
