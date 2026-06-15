import { LANGUAGE_BY_EXTENSION } from './languageByExtension';

export function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_BY_EXTENSION[ext] || 'plaintext';
}
