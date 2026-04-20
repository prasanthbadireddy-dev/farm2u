import React, { createContext, useContext, useState, useEffect } from 'react';
import { teTranslations } from '../translations/te';

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Only apply language to farmer portal since that's what was requested,
    // but the context is global. We restore it from local storage.
    const saved = localStorage.getItem('farmerLang') as Language;
    if (saved === 'te' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('farmerLang', lang);
  };

  const t = (rawKey: string): string => {
    if (!rawKey) return rawKey;
    if (language === 'en') return rawKey;

    const key = rawKey.trim();

    // Direct match
    if (teTranslations[key]) return teTranslations[key];

    // Try Title Case (e.g., 'east godavari' -> 'East Godavari')
    const titleKey = key.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (teTranslations[titleKey]) return teTranslations[titleKey];

    // Try exact lower match if the dict has it
    const lowerKey = key.toLowerCase();
    if (teTranslations[lowerKey]) return teTranslations[lowerKey];

    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
