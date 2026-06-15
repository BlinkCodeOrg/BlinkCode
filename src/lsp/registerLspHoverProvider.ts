import type { LspClient } from './client';
import { lspRangeToMonaco } from './lspRangeToMonaco';
import { monacoPositionToLsp } from './monacoPositionToLsp';
import type { Monaco } from './monacoTypes';

export function registerLspHoverProvider(
  client: LspClient,
  monaco: Monaco,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerHoverProvider(language, {
    provideHover: async (model: any, position: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/hover', {
          textDocument: { uri: resolveUri(model) },
          position: monacoPositionToLsp(position),
        });
        if (!res || !res.contents) return null;
        const contents = Array.isArray(res.contents) ? res.contents : [res.contents];
        const parts = contents.map((content: any) => {
          if (typeof content === 'string') return { value: content };
          if (content && typeof content === 'object') {
            if ('value' in content) return { value: content.value };
            if ('language' in content && 'value' in content) return { value: '```' + content.language + '\n' + content.value + '\n```' };
          }
          return { value: String(content) };
        });
        return {
          range: res.range ? lspRangeToMonaco(res.range, monaco) : undefined,
          contents: parts,
        };
      } catch {
        return null;
      }
    },
  });

  return () => disposable.dispose();
}
