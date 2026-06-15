import type { LspClient } from './client';
import { createLspFormatOptions } from './createLspFormatOptions';
import { lspTextEditsToMonaco } from './lspTextEditsToMonaco';
import { monacoPositionToLsp } from './monacoPositionToLsp';
import type { Monaco } from './monacoTypes';

export function registerLspFormattingProviders(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): Array<() => void> {
  const documentDisposable = monaco.languages.registerDocumentFormattingEditProvider(language, {
    provideDocumentFormattingEdits: async (model: any, options: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/formatting', {
          textDocument: { uri: resolveUri(model) },
          options: createLspFormatOptions(options),
        });
        return lspTextEditsToMonaco(res, monaco) || [];
      } catch {
        return null;
      }
    },
  });

  const rangeDisposable = monaco.languages.registerDocumentRangeFormattingEditProvider(language, {
    provideDocumentRangeFormattingEdits: async (model: any, range: any, options: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/rangeFormatting', {
          textDocument: { uri: resolveUri(model) },
          range: {
            start: monacoPositionToLsp({ lineNumber: range.startLineNumber, column: range.startColumn }),
            end: monacoPositionToLsp({ lineNumber: range.endLineNumber, column: range.endColumn }),
          },
          options: createLspFormatOptions(options),
        });
        return lspTextEditsToMonaco(res, monaco) || [];
      } catch {
        return null;
      }
    },
  });

  return [
    () => documentDisposable.dispose(),
    () => rangeDisposable.dispose(),
  ];
}
