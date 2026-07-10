"use client";

import "@/lib/i18n";

/** Renders nothing — mounted once to guarantee the i18next init side effect
 * runs as part of the client bundle before any DataTable uses useTranslation. */
export function I18nInit() {
  return null;
}
