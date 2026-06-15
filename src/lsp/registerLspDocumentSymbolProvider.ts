import type { LspClient } from './client';
import { lspRangeToMonaco } from './lspRangeToMonaco';
import type { Monaco } from './monacoTypes';

export function registerLspDocumentSymbolProvider(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerDocumentSymbolProvider(language, {
    provideDocumentSymbols: async (model: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/documentSymbol', {
          textDocument: { uri: resolveUri(model) },
        });
        if (!Array.isArray(res)) return null;
        const toMonaco = (symbol: any): any => {
          const range = symbol.range ? lspRangeToMonaco(symbol.range, monaco)
            : (symbol.location?.range ? lspRangeToMonaco(symbol.location.range, monaco) : undefined);
          const selectionRange = symbol.selectionRange ? lspRangeToMonaco(symbol.selectionRange, monaco) : range;
          return {
            name: symbol.name || '',
            detail: symbol.detail || '',
            kind: (symbol.kind ?? 1) - 1,
            tags: symbol.tags || [],
            range,
            selectionRange,
            children: Array.isArray(symbol.children) ? symbol.children.map(toMonaco) : [],
          };
        };
        return res.map(toMonaco);
      } catch {
        return null;
      }
    },
  });

  return () => disposable.dispose();
}
