import type { LspClient } from './client';
import { lspSeverityToMarker } from './lspSeverityToMarker';
import type { Monaco } from './monacoTypes';

export function registerLspDiagnostics(
  client: LspClient,
  monaco: Monaco,
  resolveUri: (model: any) => string,
): () => void {
  return client.on('textDocument/publishDiagnostics', (params: any) => {
    if (!params?.uri) return;
    let model = monaco.editor.getModel(monaco.Uri.parse(params.uri));
    if (!model) {
      for (const candidate of monaco.editor.getModels()) {
        try {
          if (resolveUri(candidate) === params.uri) {
            model = candidate;
            break;
          }
        } catch {}
      }
    }

    const markers = (params.diagnostics || []).map((diagnostic: any) => {
      const marker: any = {
        severity: lspSeverityToMarker(diagnostic.severity, monaco),
        message: diagnostic.message || '',
        startLineNumber: diagnostic.range.start.line + 1,
        startColumn: diagnostic.range.start.character + 1,
        endLineNumber: diagnostic.range.end.line + 1,
        endColumn: diagnostic.range.end.character + 1,
        source: diagnostic.source || 'lsp',
      };

      if (diagnostic.code !== undefined && diagnostic.code !== null) {
        if (typeof diagnostic.code === 'object') {
          const value = diagnostic.code.value != null ? String(diagnostic.code.value) : '';
          if (value) {
            marker.code = diagnostic.code.target
              ? { value, target: monaco.Uri.parse(String(diagnostic.code.target)) }
              : value;
          }
        } else {
          marker.code = String(diagnostic.code);
        }
      }

      return marker;
    });

    window.dispatchEvent(new CustomEvent('blinkcode:lspDiagnostics', {
      detail: { uri: params.uri, diagnostics: markers },
    }));

    if (!model) return;
    monaco.editor.setModelMarkers(model, 'lsp', markers);
  });
}
