export const LANGUAGES = ['pt-BR', 'en-US'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'pt-BR';
