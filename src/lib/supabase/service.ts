import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import type { Database } from "./types";

/**
 * Service-role client — bypasses RLS. Only for trusted standalone scripts run
 * via `tsx` (criteria seed, laureates import), never import this from the
 * Next.js app itself. Deliberately does not import "server-only": that guard
 * only works through Next.js's bundler and throws when run under plain Node/tsx.
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
