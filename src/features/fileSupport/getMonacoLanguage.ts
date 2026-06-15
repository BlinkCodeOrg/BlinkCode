import { getExtension } from './getExtension';
import { isEnvFile } from './isEnvFile';
import { MONACO_LANGUAGE_BY_EXTENSION } from './monacoLanguageByExtension';
import { normalizeFileName } from './normalizeFileName';

export function getMonacoLanguage(fileName: string): string {
  const normalized = normalizeFileName(fileName);

  if (isEnvFile(normalized)) return 'dotenv';
  if (normalized === '.gitignore' || normalized === '.gitmodules' || normalized === '.npmignore' || normalized === '.prettierignore' || normalized === '.dockerignore') return 'plaintext';
  if (normalized === '.editorconfig') return 'ini';
  if (normalized === '.prettierrc' || normalized === '.eslintrc') return 'json';
  if (normalized === 'dockerfile') return 'dockerfile';

  const extension = getExtension(normalized);
  return MONACO_LANGUAGE_BY_EXTENSION[extension] || 'plaintext';
}
