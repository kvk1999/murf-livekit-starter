'use client';

import React, { useEffect, useState } from 'react';
import { LanguagesIcon } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          elementId: string
        ) => void;
      };
    };
  }
}

export function LanguageTranslator({ className }: { className?: string }) {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Add Google Translate script if not already present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', autoDisplay: false },
            'google_translate_element'
          );
        }
      };
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setIsOpen(false);

    // Set Google Translate cookie directly for smooth translation
    if (langCode === 'en') {
      document.cookie = 'googtrans=/en/en; path=/';
      document.cookie = 'googtrans=/en/en; domain=.' + window.location.hostname + '; path=/';
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; domain=.${window.location.hostname}; path=/`;
    }
    window.location.reload();
  };

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  ];

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <div id="google_translate_element" className="hidden" />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground"
      >
        <LanguagesIcon className="h-3.5 w-3.5 text-primary" />
        <span>{LANGUAGES.find((l) => l.code === selectedLang)?.label || 'Translate'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Select Language
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  'flex w-full items-center rounded-xl px-3 py-1.5 text-xs text-left transition-colors',
                  selectedLang === lang.code
                    ? 'bg-primary/15 font-bold text-primary'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
