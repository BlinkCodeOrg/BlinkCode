import type { LspClient } from './client';
import { lspRangeToMonaco } from './lspRangeToMonaco';
import { monacoPositionToLsp } from './monacoPositionToLsp';
import type { Monaco } from './monacoTypes';

export function registerLspDefinitionProvider(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerDefinitionProvider(language, {
    provideDefinition: async (model: any, position: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/definition', {
          textDocument: { uri: resolveUri(model) },
          position: monacoPositionToLsp(position),
        });
        if (!res) return null;
        const locations = Array.isArray(res) ? res : [res];
        return locations.map((location: any) => {
          const uri = location.targetUri || location.uri;
          const range = location.targetSelectionRange || location.targetRange || location.range;
          return {
            uri: monaco.Uri.parse(uri),
            range: lspRangeToMonaco(range, monaco),
          };
        });
      } catch {
        return null;
      }
    },
  });

  return () => disposable.dispose();
}
