import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Language, Translations, translations } from "@/constants/translations";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "@pdf_scanner_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, _setLanguage] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "en" || stored === "he") {
        _setLanguage(stored);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    _setLanguage(lang);
  }, []);

  const t = translations[language];
  const isRTL = language === "he";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
