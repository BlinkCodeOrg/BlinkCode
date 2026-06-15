import type { LspClient } from './client';
import { lspRangeToMonaco } from './lspRangeToMonaco';
import { monacoPositionToLsp } from './monacoPositionToLsp';
import type { Monaco } from './monacoTypes';

export function registerLspReferenceProvider(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerReferenceProvider(language, {
    provideReferences: async (model: any, position: any, context: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/references', {
          textDocument: { uri: resolveUri(model) },
          position: monacoPositionToLsp(position),
          context: { includeDeclaration: !!context?.includeDeclaration },
        });
        if (!Array.isArray(res)) return null;
        return res.map((location: any) => ({
          uri: monaco.Uri.parse(location.uri),
          range: lspRangeToMonaco(location.range, monaco),
        }));
      } catch {
        return null;
      }
    },
  });

  return () => disposable.dispose();
}
