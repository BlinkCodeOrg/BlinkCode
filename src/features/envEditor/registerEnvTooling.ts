import { parseEnvDocument } from './parseEnvDocument';

let registered = false;
const getLanguage = () => (window as any).__blinkcodeSettings?.language || 'en';

export function registerEnvTooling(monaco: any) {
  if (registered) return;
  registered = true;
  monaco.languages.register({ id: 'dotenv', extensions: ['.env'], aliases: ['dotenv', 'Environment'] });
  monaco.languages.setMonarchTokensProvider('dotenv', {
    tokenizer: {
      root: [
        [/^\s*#.*$/, 'comment'],
        [/^\s*(?:export\s+)?[A-Za-z_][\w.-]*(?=\s*=)/, 'variable.name'],
        [/=/, 'delimiter'],
        [/"(?:[^"\\]|\\.)*"/, 'string'],
        [/'[^']*'/, 'string'],
        [/\$\{?[A-Za-z_][\w]*\}?/, 'variable'],
      ],
    },
  });

  const attach = (model: any) => {
    if (model.getLanguageId() !== 'dotenv') return;
    const refresh = () => {
      const { diagnostics } = parseEnvDocument(model.getValue(), getLanguage());
      monaco.editor.setModelMarkers(model, 'blinkcode-env', diagnostics.map(item => ({
        ...item,
        severity: monaco.MarkerSeverity.Warning,
        startLineNumber: item.line,
        endLineNumber: item.line,
      })));
    };
    refresh();
    model.onDidChangeContent(refresh);
  };
  monaco.editor.getModels().forEach(attach);
  monaco.editor.onDidCreateModel(attach);
}
