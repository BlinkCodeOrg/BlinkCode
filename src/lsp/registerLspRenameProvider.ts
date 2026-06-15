import type { LspClient } from './client';
import { lspRangeToMonaco } from './lspRangeToMonaco';
import { lspWorkspaceEditToMonaco } from './lspWorkspaceEditToMonaco';
import { monacoPositionToLsp } from './monacoPositionToLsp';
import type { Monaco } from './monacoTypes';

export function registerLspRenameProvider(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerRenameProvider(language, {
    provideRenameEdits: async (model: any, position: any, newName: string) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/rename', {
          textDocument: { uri: resolveUri(model) },
          position: monacoPositionToLsp(position),
          newName,
        });
        return lspWorkspaceEditToMonaco(res, monaco);
      } catch {
        return null;
      }
    },
    resolveRenameLocation: async (model: any, position: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/prepareRename', {
          textDocument: { uri: resolveUri(model) },
          position: monacoPositionToLsp(position),
        });
        if (!res) return null;
        if (res.range && res.placeholder) {
          return { range: lspRangeToMonaco(res.range, monaco), text: res.placeholder };
        }
        if (res.start && res.end) {
          const range = lspRangeToMonaco(res, monaco);
          return { range, text: model.getValueInRange(range) };
        }
        return null;
      } catch {
        return null;
      }
    },
  });

  return () => disposable.dispose();
}
