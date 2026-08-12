import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // `ws` (pulled in by src/lib/supabase/service.ts's WebSocket polyfill for
  // Node < 22, needed by the users/ admin actions — see that file) doesn't
  // bundle cleanly through Next's server compiler: its optional native
  // addons (bufferutil, utf-8-validate) crashed the first request that
  // touched it. Marking it external makes Next require() it at runtime via
  // normal Node module resolution instead of trying to bundle/transform it.
  serverExternalPackages: ["ws"],
};
export default nextConfig;
