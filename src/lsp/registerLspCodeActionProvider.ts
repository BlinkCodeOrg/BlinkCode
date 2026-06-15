import type { LspClient } from './client';
import { lspWorkspaceEditToMonaco } from './lspWorkspaceEditToMonaco';
import { monacoPositionToLsp } from './monacoPositionToLsp';
import type { Monaco } from './monacoTypes';

export function registerLspCodeActionProvider(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerCodeActionProvider(language, {
    provideCodeActions: async (model: any, range: any, context: any) => {
      if (!client.isReady()) return { actions: [], dispose: () => {} };
      try {
        const diagnostics = (context?.markers || []).map((marker: any) => ({
          range: {
            start: { line: marker.startLineNumber - 1, character: marker.startColumn - 1 },
            end: { line: marker.endLineNumber - 1, character: marker.endColumn - 1 },
          },
          message: marker.message,
          severity: marker.severity,
          source: marker.source,
          code: marker.code,
        }));
        const res = await client.request<any>('textDocument/codeAction', {
          textDocument: { uri: resolveUri(model) },
          range: {
            start: monacoPositionToLsp({ lineNumber: range.startLineNumber, column: range.startColumn }),
            end: monacoPositionToLsp({ lineNumber: range.endLineNumber, column: range.endColumn }),
          },
          context: { diagnostics, only: context?.only ? [context.only] : undefined },
        });
        if (!Array.isArray(res)) return { actions: [], dispose: () => {} };
        const actions = res.map((item: any) => {
          if (item.command && !item.edit && !item.title) {
            return { title: item.title || item.command, command: { id: item.command, title: item.title || '', arguments: item.arguments } };
          }
          const action: any = {
            title: item.title || '',
            kind: item.kind,
            isPreferred: item.isPreferred,
            diagnostics: [],
          };
          if (item.edit) action.edit = lspWorkspaceEditToMonaco(item.edit, monaco);
          if (item.command && typeof item.command === 'object') {
            action.command = { id: item.command.command, title: item.command.title || '', arguments: item.command.arguments };
          }
          return action;
        });
        return { actions, dispose: () => {} };
      } catch {
        return { actions: [], dispose: () => {} };
      }
    },
  });

  return () => disposable.dispose();
}
