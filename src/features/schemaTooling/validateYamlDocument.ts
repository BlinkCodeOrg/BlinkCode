import type { SchemaDefinition } from './schemaDefinitions';
import { t } from '../../utils/i18n';

export interface SchemaDiagnostic {
  line: number;
  startColumn: number;
  endColumn: number;
  message: string;
}

export function validateYamlDocument(content: string, schema: SchemaDefinition | null, language = 'en'): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];
  const topLevelKeys = new Set<string>();
  const keysByIndent = new Map<number, Set<string>>();
  const lines = String(content || '').split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line.trim() || line.trimStart().startsWith('#')) return;
    if (line.includes('\t')) {
      diagnostics.push({ line: index + 1, startColumn: line.indexOf('\t') + 1, endColumn: line.indexOf('\t') + 2, message: t('diagnostic.yamlTabs', language) });
    }
    const indent = line.match(/^ */)?.[0].length || 0;
    if (indent % 2 !== 0) {
      diagnostics.push({ line: index + 1, startColumn: 1, endColumn: indent + 1, message: t('diagnostic.yamlIndent', language) });
    }
    const keyMatch = line.match(/^\s*([\w.-]+)\s*:/);
    if (!keyMatch) return;
    const key = keyMatch[1];
    const seen = keysByIndent.get(indent) || new Set<string>();
    if (seen.has(key)) {
      diagnostics.push({ line: index + 1, startColumn: line.indexOf(key) + 1, endColumn: line.indexOf(key) + key.length + 1, message: t('diagnostic.yamlDuplicate', language, { name: key }) });
    }
    seen.add(key);
    keysByIndent.set(indent, seen);
    for (const knownIndent of [...keysByIndent.keys()]) {
      if (knownIndent > indent) keysByIndent.delete(knownIndent);
    }
    if (indent === 0) topLevelKeys.add(key);
  });

  for (const required of schema?.required || []) {
    if (!topLevelKeys.has(required)) {
      diagnostics.push({ line: 1, startColumn: 1, endColumn: 1, message: t('diagnostic.yamlMissingTopLevel', language, { name: required }) });
    }
  }
  return diagnostics;
}
