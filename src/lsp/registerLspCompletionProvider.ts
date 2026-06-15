import type { LspClient } from './client';
import { lspCompletionKindToMonaco } from './lspCompletionKindToMonaco';
import { lspRangeToMonaco } from './lspRangeToMonaco';
import { lspTextEditsToMonaco } from './lspTextEditsToMonaco';
import { monacoPositionToLsp } from './monacoPositionToLsp';
import type { Monaco } from './monacoTypes';

export function registerLspCompletionProvider(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', '"', "'", '`', '/', '@', '<', '#', ' '],
    provideCompletionItems: async (model: any, position: any) => {
      if (!client.isReady()) return { suggestions: [] };
      try {
        const res = await client.request<any>('textDocument/completion', {
          textDocument: { uri: resolveUri(model) },
          position: monacoPositionToLsp(position),
          context: { triggerKind: 1 },
        });
        const items = Array.isArray(res) ? res : (res?.items || []);
        const word = model.getWordUntilPosition(position);
        const defaultRange = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
        const suggestions = items.map((item: any) => {
          const textEdit = item.textEdit;
          let range: any = defaultRange;
          let insertText = item.insertText ?? item.label;
          if (textEdit) {
            const editRange = textEdit.range || textEdit.insert;
            if (editRange) range = lspRangeToMonaco(editRange, monaco);
            insertText = textEdit.newText ?? insertText;
          }
          const isSnippet = item.insertTextFormat === 2;
          return {
            label: typeof item.label === 'string' ? item.label : item.label?.label || '',
            kind: lspCompletionKindToMonaco(item.kind, monaco),
            insertText,
            insertTextRules: isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
            detail: item.detail,
            documentation: typeof item.documentation === 'string' ? item.documentation : item.documentation?.value,
            sortText: item.sortText,
            filterText: item.filterText,
            preselect: item.preselect,
            range,
            commitCharacters: item.commitCharacters,
            additionalTextEdits: lspTextEditsToMonaco(item.additionalTextEdits, monaco),
            _lspItem: item,
            _lspModel: model,
          };
        });
        return { suggestions, incomplete: !!(res && res.isIncomplete) };
      } catch {
        return { suggestions: [] };
      }
    },
    resolveCompletionItem: async (item: any) => {
      if (!client.isReady()) return item;
      const raw = item._lspItem;
      if (!raw) return item;
      try {
        const resolved = await client.request<any>('completionItem/resolve', raw);
        if (!resolved) return item;
        if (resolved.detail && !item.detail) item.detail = resolved.detail;
        if (resolved.documentation && !item.documentation) {
          item.documentation = typeof resolved.documentation === 'string'
            ? resolved.documentation
            : resolved.documentation?.value;
        }
        const edits = lspTextEditsToMonaco(resolved.additionalTextEdits, monaco);
        if (edits && edits.length) item.additionalTextEdits = edits;
        if (resolved.command && resolved.command.command) {
          item.command = {
            id: resolved.command.command,
            title: resolved.command.title || '',
            arguments: resolved.command.arguments,
          };
        }
      } catch {}
      return item;
    },
  });

  return () => disposable.dispose();
}
