import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import type { Database } from "./types";

/**
 * Service-role client — bypasses RLS and can manage auth.users. Two allowed
 * callers only: trusted standalone scripts run via `tsx` (criteria seed,
 * laureates import, set-phone), and the admin-only user-management server
 * actions under src/app/(admin)/users/ — which MUST call isAdmin() (via the
 * normal cookie-scoped client) before ever touching this client, since it
 * bypasses every RLS check that would otherwise stop a non-admin. Never use
 * it anywhere else in the Next.js app. Deliberately does not import
 * "server-only": that guard only works through Next.js's bundler and throws
 * when run under plain Node/tsx.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // These scripts never use realtime, but supabase-js always constructs a
    // RealtimeClient, which needs a WebSocket implementation — Node < 22 has
    // no native `WebSocket` global, so provide the `ws` package explicitly.
    { realtime: { transport: WebSocket as never } }
  );
}
