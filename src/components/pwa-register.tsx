"use client";

import { useEffect } from "react";

/** Registers the service worker (production only — a SW in dev caches stale
 *  chunks and breaks hot reload). */
export function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Registration failure (private mode, unsupported) is non-fatal:
      // the app simply behaves as a regular website.
    });
  }, []);

  return null;
}
