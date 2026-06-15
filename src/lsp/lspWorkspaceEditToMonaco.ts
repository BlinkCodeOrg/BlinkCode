import { lspRangeToMonaco } from './lspRangeToMonaco';
import type { Monaco } from './monacoTypes';

export function lspWorkspaceEditToMonaco(edit: any, monaco: Monaco): any | null {
  if (!edit) return null;
  const edits: any[] = [];

  if (edit.changes && typeof edit.changes === 'object') {
    for (const uri of Object.keys(edit.changes)) {
      for (const item of edit.changes[uri] || []) {
        edits.push({
          resource: monaco.Uri.parse(uri),
          textEdit: { range: lspRangeToMonaco(item.range, monaco), text: item.newText ?? '' },
          versionId: undefined,
        });
      }
    }
  }

  if (edit.documentChanges && Array.isArray(edit.documentChanges)) {
    for (const documentChange of edit.documentChanges) {
      if (!documentChange || !documentChange.textDocument || !Array.isArray(documentChange.edits)) continue;
      const uri = documentChange.textDocument.uri;
      for (const item of documentChange.edits) {
        edits.push({
          resource: monaco.Uri.parse(uri),
          textEdit: { range: lspRangeToMonaco(item.range, monaco), text: item.newText ?? '' },
          versionId: undefined,
        });
      }
    }
  }

  return { edits };
}
