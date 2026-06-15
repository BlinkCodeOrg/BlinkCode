import { getSchemaDefinition } from './schemaDefinitions';
import { validateJsonSchema } from './validateJsonSchema';
import { validateYamlDocument } from './validateYamlDocument';
import { t } from '../../utils/i18n';

let registered = false;
const getLanguage = () => (window as any).__blinkcodeSettings?.language || 'en';

export function registerSchemaTooling(monaco: any) {
  if (registered) return;
  registered = true;

  for (const language of ['json', 'yaml']) {
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['"', '\n', ' '],
      provideCompletionItems(model: any, position: any) {
        const schema = getSchemaDefinition(model.uri.path);
        if (!schema) return { suggestions: [] };
        const line = model.getLineContent(position.lineNumber);
        const indent = line.match(/^\s*/)?.[0] || '';
        return {
          suggestions: schema.keys.map(key => ({
            label: key,
            detail: t('diagnostic.schemaProperty', getLanguage()),
            documentation: schema.descriptionKeys[key] ? t(schema.descriptionKeys[key], getLanguage()) : '',
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: language === 'json' ? `"${key}": \${1}` : `${key}: \${1}`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: new monaco.Range(position.lineNumber, indent.length + 1, position.lineNumber, position.column),
          })),
        };
      },
    });
    monaco.languages.registerHoverProvider(language, {
      provideHover(model: any, position: any) {
        const schema = getSchemaDefinition(model.uri.path);
        const word = model.getWordAtPosition(position)?.word;
        const descriptionKey = word && schema?.descriptionKeys[word];
        const description = descriptionKey ? t(descriptionKey, getLanguage()) : '';
        return description ? { contents: [{ value: `**${word}**` }, { value: description }] } : null;
      },
    });
  }

  const attach = (model: any) => {
    if (!['json', 'yaml'].includes(model.getLanguageId())) return;
    const refresh = () => {
      const schema = getSchemaDefinition(model.uri.path);
      const diagnostics = model.getLanguageId() === 'yaml'
        ? validateYamlDocument(model.getValue(), schema, getLanguage())
        : validateJsonSchema(model.getValue(), schema, getLanguage());
      monaco.editor.setModelMarkers(model, 'blinkcode-schema', diagnostics.map(item => ({
        severity: monaco.MarkerSeverity.Warning,
        message: item.message,
        startLineNumber: item.line,
        startColumn: item.startColumn,
        endLineNumber: item.line,
        endColumn: item.endColumn,
      })));
    };
    refresh();
    model.onDidChangeContent(refresh);
  };
  monaco.editor.getModels().forEach(attach);
  monaco.editor.onDidCreateModel(attach);
}
