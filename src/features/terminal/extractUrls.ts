import { stripAnsi } from './stripAnsi';
import { TERMINAL_URL_REGEX } from './terminalUrlRegex';

export function extractUrls(value: string): string[] {
  TERMINAL_URL_REGEX.lastIndex = 0;
  const cleanValue = stripAnsi(value);
  return Array.from(cleanValue.matchAll(TERMINAL_URL_REGEX), match => match[0].replace(/[\])\]}>,;:!?]+$/g, ''));
}
