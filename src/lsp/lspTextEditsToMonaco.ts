import { lspRangeToMonaco } from './lspRangeToMonaco';
import type { Monaco } from './monacoTypes';

export function lspTextEditsToMonaco(edits: any[] | undefined, monaco: Monaco): any[] | undefined {
  if (!edits || !Array.isArray(edits) || edits.length === 0) return undefined;
  return edits.map((edit: any) => ({
    range: lspRangeToMonaco(edit.range, monaco),
    text: edit.newText ?? '',
  }));
}
