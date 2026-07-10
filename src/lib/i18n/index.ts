"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const LANGUAGE_STORAGE_KEY = "futurix-language";

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: "fr",
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
  });
}

export default i18next;
