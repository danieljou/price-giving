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
  set_role: "Changement de rôle",
};

/** Columns that are never meaningful to a human reading the audit trail —
 *  applies across every entity type rather than a per-table allowlist. */
function isNoiseField(key: string): boolean {
  return key === "id" || key.endsWith("_at");
}

function formatFieldLabel(key: string): string {
  const spaced = key.replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

interface FieldChange {
  key: string;
  before: unknown;
  after: unknown;
}

/** Odoo-style "tracked fields" diff: only the fields that actually changed
 *  between before/after, never the full record. Returns nothing for a pure
 *  create or delete (before or after is null) — those are self-explanatory
 *  from the action label alone. */
function diffFields(before: unknown, after: unknown): FieldChange[] {
  if (
    !before ||
    !after ||
    typeof before !== "object" ||
    typeof after !== "object"
  ) {
    return [];
  }
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);

  const changes: FieldChange[] = [];
  for (const key of keys) {
    if (isNoiseField(key)) continue;
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      changes.push({ key, before: b[key], after: a[key] });
    }
  }
  return changes;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Inline "qui / quand / quoi" history for a record, shared across résultats,
 *  vérification manuelle, configuration des primes, dépenses et utilisateurs.
 *  Shows only the fields that changed (old value struck through, new value
 *  after) instead of a raw JSON dump — never renders before/after as-is.
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
      {entries.map((entry) => {
        const changes = diffFields(entry.before, entry.after);
        return (
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
            {changes.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1">
                {changes.map((change) => (
                  <li
                    key={change.key}
                    className="flex flex-wrap items-baseline gap-1.5 text-xs"
                  >
                    <span className="font-medium text-foreground">
                      {formatFieldLabel(change.key)} :
                    </span>
                    <span className="text-muted-foreground line-through">
                      {formatValue(change.before)}
                    </span>
                    <span className="text-muted-foreground" aria-hidden="true">
                      →
                    </span>
                    <span className="text-foreground">
                      {formatValue(change.after)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
