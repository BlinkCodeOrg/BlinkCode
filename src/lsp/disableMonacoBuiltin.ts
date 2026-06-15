import type { Monaco, ServerKey } from './sessionTypes';

const builtinDisabledForServer = new Set<ServerKey>();

export function disableMonacoBuiltin(monaco: Monaco, serverKey: ServerKey): void {
  if (builtinDisabledForServer.has(serverKey)) return;
  builtinDisabledForServer.add(serverKey);
  try {
    if (serverKey === 'typescript') {
      const ts = monaco.languages?.typescript;
      if (ts) {
        const opts = {
          noSemanticValidation: true,
          noSyntaxValidation: true,
          noSuggestionDiagnostics: true,
          onlyVisible: true,
        };
        ts.typescriptDefaults?.setDiagnosticsOptions?.(opts);
        ts.javascriptDefaults?.setDiagnosticsOptions?.(opts);
        ts.typescriptDefaults?.setEagerModelSync?.(false);
        ts.javascriptDefaults?.setEagerModelSync?.(false);
        ts.typescriptDefaults?.setModeConfiguration?.({
          completionItems: false, hovers: false, documentSymbols: false,
          definitions: false, references: false, documentHighlights: false,
          rename: false, diagnostics: false, documentRangeFormattingEdits: false,
          signatureHelp: false, onTypeFormattingEdits: false, codeActions: false,
          inlayHints: false,
        });
        ts.javascriptDefaults?.setModeConfiguration?.({
          completionItems: false, hovers: false, documentSymbols: false,
          definitions: false, references: false, documentHighlights: false,
          rename: false, diagnostics: false, documentRangeFormattingEdits: false,
          signatureHelp: false, onTypeFormattingEdits: false, codeActions: false,
          inlayHints: false,
        });
      }
    } else if (serverKey === 'html') {
      monaco.languages?.html?.htmlDefaults?.setModeConfiguration?.({
        completionItems: false, hovers: false, documentSymbols: false,
        documentFormattingEdits: false, documentRangeFormattingEdits: false,
        documentHighlights: false, documentLinks: false, linkedEditingRanges: false,
        foldingRanges: false, selectionRanges: false, diagnostics: false, colors: false,
        renames: false,
      });
    } else if (serverKey === 'css') {
      const setCfg = {
        completionItems: false, hovers: false, documentSymbols: false,
        documentFormattingEdits: false, documentRangeFormattingEdits: false,
        documentHighlights: false, documentLinks: false, foldingRanges: false,
        selectionRanges: false, diagnostics: false, colors: false, renames: false,
      };
      monaco.languages?.css?.cssDefaults?.setModeConfiguration?.(setCfg);
      monaco.languages?.css?.scssDefaults?.setModeConfiguration?.(setCfg);
      monaco.languages?.css?.lessDefaults?.setModeConfiguration?.(setCfg);
    } else if (serverKey === 'json') {
      monaco.languages?.json?.jsonDefaults?.setModeConfiguration?.({
        completionItems: false, hovers: false, documentSymbols: false,
        documentFormattingEdits: false, documentRangeFormattingEdits: false,
        tokens: false, colors: false, foldingRanges: false, diagnostics: false,
        selectionRanges: false,
      });
    }
  } catch {}
}
