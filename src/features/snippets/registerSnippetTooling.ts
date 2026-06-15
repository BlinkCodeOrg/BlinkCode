import type { UserSnippet } from '../../types';

let currentMonaco: any = null;
let currentSnippets: UserSnippet[] = [];
const providers = new Map<string, { dispose: () => void }>();

export function registerSnippetTooling(monaco: any, snippets: UserSnippet[]) {
  if (currentMonaco && currentMonaco !== monaco) {
    providers.forEach(provider => provider.dispose());
    providers.clear();
  }
  currentMonaco = monaco;
  currentSnippets = snippets;

  const activeLanguages = new Set(snippets.flatMap(snippet => snippet.languages));
  for (const [language, provider] of providers) {
    if (!activeLanguages.has(language)) {
      provider.dispose();
      providers.delete(language);
    }
  }

  for (const language of activeLanguages) {
    if (providers.has(language)) continue;
    providers.set(language, monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems(model: any, position: any) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return {
          suggestions: currentSnippets
            .filter(snippet => snippet.languages.includes(language))
            .map(snippet => ({
              label: snippet.prefix,
              filterText: snippet.prefix,
              sortText: `0-${snippet.prefix}`,
              detail: snippet.name,
              documentation: snippet.description || 'BlinkCode user snippet',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: snippet.body,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            })),
        };
      },
    }));
  }
}
