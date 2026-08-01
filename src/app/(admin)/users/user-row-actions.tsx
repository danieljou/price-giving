"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteUser, setUserRole } from "./actions";
import type { UserRole } from "@/lib/supabase/types";

export function UserRowActions({
  userId,
  role,
  email,
  isSelf,
}: Readonly<{
  userId: string;
  role: UserRole;
  email: string | null;
  isSelf: boolean;
}>) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function changeRole(newRole: UserRole) {
    if (newRole === role) return;
    const formData = new FormData();
    formData.set("role", newRole);
    startTransition(async () => {
      const result = await setUserRole(userId, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Rôle mis à jour.");
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Utilisateur supprimé.");
        setConfirmOpen(false);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        value={role}
        onValueChange={(v) => changeRole(v as UserRole)}
        disabled={isPending || isSelf}
      >
        <SelectTrigger size="sm" className="w-32" aria-label="Rôle">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="saisie">Saisie</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Supprimer ${email ?? "cet utilisateur"}`}
        disabled={isPending || isSelf}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 aria-hidden="true" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              {email ?? "Cet utilisateur"} perdra définitivement l&apos;accès
              à l&apos;application. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
