import { ANSI_ESCAPE_REGEX } from './ansiEscapeRegex';

export function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_REGEX, '');
}
