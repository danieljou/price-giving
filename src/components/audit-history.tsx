import { createClient } from "@/lib/supabase/server";
import type { AuditEntityType } from "@/lib/supabase/types";

interface AuditHistoryProps {
  entityType: AuditEntityType | AuditEntityType[];
  entityId: string | string[];
  emptyLabel?: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  resolve: "Décision (délibéré)",
  reopen: "Réouverture",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Inline "qui / quand / avant → après" history for a record, shared across
 *  résultats, vérification manuelle, configuration des primes et dépenses.
 *  Reads audit_log directly — entries are only ever written by the log_audit
 *  RPC (see supabase/migrations/20260729010000_audit_log.sql). */
export async function AuditHistory({
  entityType,
  entityId,
  emptyLabel = "Aucun historique pour l'instant.",
}: Readonly<AuditHistoryProps>) {
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id, action, actor_email, before, after, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  query = Array.isArray(entityType)
    ? query.in("entity_type", entityType)
    : query.eq("entity_type", entityType);
  query = Array.isArray(entityId)
    ? query.in("entity_id", entityId)
    : query.eq("entity_id", entityId);

  const { data: entries } = await query;

  if (!entries || entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-b border-border pb-2 last:border-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-foreground">
              {ACTION_LABELS[entry.action] ?? entry.action}
            </span>
            <span className="text-xs text-muted-foreground">
              {entry.actor_email ?? "Utilisateur supprimé"} ·{" "}
              {formatDate(entry.created_at)}
            </span>
          </div>
          {Boolean(entry.before || entry.after) && (
            <details className="mt-1 text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none hover:text-foreground">
                Détails
              </summary>
              <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <p className="font-medium">Avant</p>
                  <pre className="mt-1 overflow-x-auto rounded-sm bg-muted p-2 whitespace-pre-wrap">
                    {entry.before ? JSON.stringify(entry.before, null, 2) : "—"}
                  </pre>
                </div>
                <div>
                  <p className="font-medium">Après</p>
                  <pre className="mt-1 overflow-x-auto rounded-sm bg-muted p-2 whitespace-pre-wrap">
                    {entry.after ? JSON.stringify(entry.after, null, 2) : "—"}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
