import { normalizeFileName } from './normalizeFileName';

export function isEnvFile(fileName: string): boolean {
  const normalized = normalizeFileName(fileName);
  return normalized === '.env' || normalized.startsWith('.env.') || normalized === '.env.example' || normalized.endsWith('.env.example');
}
