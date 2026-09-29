import type { Language } from '@/domain/value-objects/Language';

const LANGUAGE_NAMES: Record<Language, string> = {
  'pt-BR': 'Brazilian Portuguese',
  'en-US': 'American English',
};

export function outputLanguage(language: Language): string {
  return `Output language: ${LANGUAGE_NAMES[language]}`;
}
