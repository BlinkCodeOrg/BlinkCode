import type { SchemaDefinition } from './schemaDefinitions';
import type { SchemaDiagnostic } from './validateYamlDocument';
import { t } from '../../utils/i18n';

export function validateJsonSchema(content: string, schema: SchemaDefinition | null, language = 'en'): SchemaDiagnostic[] {
  if (!schema) return [];
  let value;
  try { value = JSON.parse(content); } catch { return []; }
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return [{ line: 1, startColumn: 1, endColumn: 2, message: t('diagnostic.jsonRoot', language) }];
  }
  return (schema.required || []).flatMap(key => key in value
    ? []
    : [{ line: 1, startColumn: 1, endColumn: 2, message: t('diagnostic.missingProperty', language, { name: key }) }]);
}
