export interface EnvDiagnostic {
  line: number;
  message: string;
  startColumn: number;
  endColumn: number;
}

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

export function parseEnvDocument(source: string, language = 'en') {
  const diagnostics: EnvDiagnostic[] = [];
  const values = new Map<string, string>();

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const separator = rawLine.indexOf('=');
    if (separator < 1) {
      diagnostics.push({
        line: index + 1,
        message: t('diagnostic.envExpected', language),
        startColumn: 1,
        endColumn: Math.max(2, rawLine.length + 1),
      });
      return;
    }
    const key = rawLine.slice(0, separator).trim().replace(/^export\s+/, '');
    if (!KEY_PATTERN.test(key)) {
      diagnostics.push({
        line: index + 1,
        message: t('diagnostic.envInvalidName', language, { name: key }),
        startColumn: 1,
        endColumn: separator + 1,
      });
      return;
    }
    if (values.has(key)) {
      diagnostics.push({
        line: index + 1,
        message: t('diagnostic.envDuplicate', language, { name: key }),
        startColumn: 1,
        endColumn: separator + 1,
      });
    }
    values.set(key, rawLine.slice(separator + 1));
  });

  return { diagnostics, values };
}
import { t } from '../../utils/i18n';
