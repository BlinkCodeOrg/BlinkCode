import type { LspClient } from './client';
import { monacoPositionToLsp } from './monacoPositionToLsp';

export function registerLspSignatureHelpProvider(
  client: LspClient,
  monaco: any,
  language: string,
  resolveUri: (model: any) => string,
): () => void {
  const disposable = monaco.languages.registerSignatureHelpProvider(language, {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp: async (model: any, position: any) => {
      if (!client.isReady()) return null;
      try {
        const res = await client.request<any>('textDocument/signatureHelp', {
          textDocument: { uri: resolveUri(model) },
          position: monacoPositionToLsp(position),
        });
        if (!res || !res.signatures) return null;
        return {
          value: {
            signatures: res.signatures.map((signature: any) => ({
              label: signature.label,
              documentation: typeof signature.documentation === 'string' ? signature.documentation : signature.documentation?.value,
              parameters: (signature.parameters || []).map((param: any) => ({
                label: param.label,
                documentation: typeof param.documentation === 'string' ? param.documentation : param.documentation?.value,
              })),
            })),
            activeSignature: res.activeSignature || 0,
            activeParameter: res.activeParameter || 0,
          },
          dispose: () => {},
        };
      } catch {
        return null;
      }
    },
  });

  return () => disposable.dispose();
}
